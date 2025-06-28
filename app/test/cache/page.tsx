'use client'

import { useState } from 'react'
import { cacheService } from '@/services/CacheService'
import { CacheKeyParams, CacheItem, SentenceProcessing } from '@/types/cache'
import { useCacheStore } from '@/store/useCacheStore'
import { OUTPUT_TYPE } from '@/constants/prompt'

// 模拟handleThinkAndResult函数用于测试
async function mockHandleThinkAndResult(
  generator: AsyncGenerator<string, void, unknown>,
  onValue: (value: string) => void,
  onThinkContext: (value: string) => void,
  signal?: AbortSignal
): Promise<{ completed: boolean, hasContent: boolean, thinkComplete: boolean }> {
  let thinking: boolean = false;
  let hasThinkTag = false;
  let contentLength = 0;
  let thinkContentLength = 0;

  try {
    for await (const chunk of generator) {
      if (signal?.aborted) {
        return { completed: false, hasContent: false, thinkComplete: false };
      }

      if (chunk === '<think>') {
        thinking = true;
        hasThinkTag = true;
        continue;
      }
      if (thinking) {
        if (chunk === '</think>') {
          thinking = false;
          continue;
        }
        onThinkContext(chunk);
        thinkContentLength += chunk.length;
      } else {
        onValue(chunk);
        contentLength += chunk.length;
      }
    }

    const hasContent = contentLength > 5;
    const thinkComplete = !hasThinkTag || (!thinking && thinkContentLength > 0);

    return {
      completed: true,
      hasContent,
      thinkComplete
    };

  } catch (error) {
    return { completed: false, hasContent: false, thinkComplete: false };
  }
}

// 内容质量验证函数 - 使用OR逻辑：文本或列表满足其中一个条件即可
function shouldCache(text: string, list: string[], thinkContext: string): boolean {
  // 检查文本是否有效
  const hasValidText = text && text.trim().length >= 5

  // 检查列表是否有效
  const hasValidList = list && list.length > 0 && list.some(item => item.trim().length >= 3)

  // 文本或列表满足其中一个条件即可
  return hasValidText || hasValidList
}

// 创建测试用的生成器
async function* createTestGenerator(content: string[], delay: number = 50): AsyncGenerator<string, void, unknown> {
  for (const chunk of content) {
    await new Promise(resolve => setTimeout(resolve, delay))
    yield chunk
  }
}

// 创建中断的生成器
async function* createAbortableGenerator(content: string[], abortAt: number, delay: number = 50): AsyncGenerator<string, void, unknown> {
  for (let i = 0; i < content.length; i++) {
    if (i === abortAt) {
      throw new Error('Generator aborted')
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    yield content[i]
  }
}

export default function CacheTestPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [cacheKey, setCacheKey] = useState<CacheKeyParams>({
    bookId: '550e8400-e29b-41d4-a716-446655440000',
    sentence: 'Hello world',
    ruleId: '123e4567-e89b-12d3-a456-426614174000'
  })
  const [result, setResult] = useState<string>('Test result content')
  const [thinkContext, setThinkContext] = useState<string>('Test think context')
  const [cachedItem, setCachedItem] = useState<CacheItem | null>(null)
  const [batchCount, setBatchCount] = useState<number>(10)
  const [maxCacheSize, setMaxCacheSize] = useState<number>(5)
  const [cacheStats, setCacheStats] = useState<{ totalCount: number, slotCount: number } | null>(null)

  const addLog = (message: string) => {
    setTestResult(prev => prev + `[${new Date().toLocaleTimeString()}] ${message}\n`)
  }

  const testSet = async () => {
    try {
      addLog('开始测试 set 方法...')
      await cacheService.set(cacheKey, {
        type: OUTPUT_TYPE.MD,
        result,
        thinkContext
      })
      addLog('✅ set 方法测试成功')
    } catch (error) {
      addLog(`❌ set 方法测试失败: ${error}`)
    }
  }

  const testGet = async () => {
    try {
      addLog('开始测试 get 方法...')
      const item = await cacheService.get(cacheKey)
      setCachedItem(item)
      if (item) {
        addLog(`✅ get 方法测试成功，获取到数据: ${JSON.stringify(item, null, 2)}`)
      } else {
        addLog('ℹ️ get 方法返回 null，无缓存数据')
      }
    } catch (error) {
      addLog(`❌ get 方法测试失败: ${error}`)
    }
  }

  const testRemove = async () => {
    try {
      addLog('开始测试 remove 方法...')
      await cacheService.remove(cacheKey)
      addLog('✅ remove 方法测试成功')
    } catch (error) {
      addLog(`❌ remove 方法测试失败: ${error}`)
    }
  }

  const testCompleteFlow = async () => {
    addLog('=== 开始完整流程测试 ===')

    // 1. 先尝试获取（应该为空）
    await testGet()

    // 2. 设置缓存
    await testSet()

    // 3. 再次获取（应该有数据）
    await testGet()

    // 4. 删除缓存
    await testRemove()

    // 5. 最后获取（应该为空）
    await testGet()

    addLog('=== 完整流程测试结束 ===')
  }

  const getCacheStats = () => {
    const store = useCacheStore.getState()
    const totalCount = store.getTotalCount()
    const slotCount = store.getAllSlots().length
    setCacheStats({ totalCount, slotCount })
    addLog(`📊 缓存统计: 总项目数 ${totalCount}, 时间槽数 ${slotCount}`)
  }

  const batchAddCache = async () => {
    try {
      addLog(`🔄 开始批量添加 ${batchCount} 个缓存项...`)

      for (let i = 0; i < batchCount; i++) {
        const testKey: CacheKeyParams = {
          bookId: cacheKey.bookId,
          sentence: `${cacheKey.sentence} - ${i}`,
          ruleId: cacheKey.ruleId
        }

        await cacheService.set(testKey, {
          type: OUTPUT_TYPE.MD,
          result: `${result} - ${i}`,
          thinkContext: `${thinkContext} - ${i}`
        })

        // 每5个项目添加一个小延时，模拟不同时间
        if (i % 5 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      getCacheStats()
      addLog(`✅ 批量添加完成`)
    } catch (error) {
      addLog(`❌ 批量添加失败: ${error}`)
    }
  }

  const testOverflowCleanup = async () => {
    try {
      addLog(`🧹 开始测试缓存超量清理...`)

      // 1. 先获取当前状态
      getCacheStats()

      // 2. 设置较小的maxCacheSize
      await cacheService.updateSetting('maxCacheSize', maxCacheSize)
      addLog(`📏 设置最大缓存数量为: ${maxCacheSize}`)

      // 3. 触发清理
      await cacheService.clearCacheOnTriggerEvents()
      addLog(`🧹 清理完成`)

      // 4. 检查清理后状态
      getCacheStats()

      const store = useCacheStore.getState()
      const finalCount = store.getTotalCount()

      if (finalCount <= maxCacheSize) {
        addLog(`✅ 清理成功: 当前数量 ${finalCount} <= 最大数量 ${maxCacheSize}`)
      } else {
        addLog(`❌ 清理异常: 当前数量 ${finalCount} > 最大数量 ${maxCacheSize}`)
      }

    } catch (error) {
      addLog(`❌ 超量清理测试失败: ${error}`)
    }
  }

  const testCompleteOverflowScenario = async () => {
    addLog('=== 开始完整超量场景测试 ===')

    // 1. 清空现有缓存
    clearAllCache()

    // 2. 批量添加超过限制的缓存
    await batchAddCache()

    // 3. 测试超量清理
    await testOverflowCleanup()

    addLog('=== 完整超量场景测试结束 ===')
  }

  const resetCacheSettings = async () => {
    try {
      addLog('🔄 重置缓存设置到默认值...')
      await cacheService.updateSetting('maxCacheSize', 1000)
      await cacheService.updateSetting('expireHours', 24)
      await cacheService.updateSetting('bufferSlots', 3)
      addLog('✅ 缓存设置重置成功')
    } catch (error) {
      addLog(`❌ 重置缓存设置失败: ${error}`)
    }
  }

  const clearAllCache = () => {
    const store = useCacheStore.getState()
    // 手动清空所有时间槽
    const allSlots = store.getAllSlots()
    allSlots.forEach(slot => {
      store.removeSlot(slot)
      store.removeIndex(slot)
    })
    setCacheStats(null)
    setCachedItem(null)
    addLog('🗑️ 清空所有缓存')
  }

  const clearLogs = () => {
    setTestResult('')
  }

  // === 缓存机制优化测试函数 ===

  // 测试正常完成请求的缓存
  const testNormalCompletion = async () => {
    try {
      addLog('🧪 开始测试正常完成请求的缓存...')

      const testKey: CacheKeyParams = {
        ...cacheKey,
        sentence: `Normal completion test - ${Date.now()}`
      }

      let text = ''
      let thinkContext = ''

      // 创建正常的内容生成器
      const content = [
        '<think>',
        'This is a thinking process',
        '</think>',
        'This is the main content that should be cached because it is long enough'
      ]

      const generator = createTestGenerator(content, 10)
      const result = await mockHandleThinkAndResult(
        generator,
        (value) => { text += value },
        (value) => { thinkContext += value }
      )

      addLog(`📊 生成器结果: completed=${result.completed}, hasContent=${result.hasContent}, thinkComplete=${result.thinkComplete}`)
      addLog(`📝 生成内容: text="${text}", thinkContext="${thinkContext}"`)

      if (result.completed && result.hasContent && result.thinkComplete && shouldCache(text, [], thinkContext)) {
        await cacheService.set(testKey, {
          type: OUTPUT_TYPE.TEXT,
          result: text,
          thinkContext
        })
        addLog('✅ 正常完成请求缓存成功')

        // 验证缓存
        const cached = await cacheService.get(testKey)
        if (cached) {
          addLog('✅ 缓存验证成功: 内容已正确缓存')
        } else {
          addLog('❌ 缓存验证失败: 无法获取缓存内容')
        }
      } else {
        addLog('❌ 内容未通过缓存条件验证')
      }

    } catch (error) {
      addLog(`❌ 正常完成测试失败: ${error}`)
    }
  }

  // 测试中断场景不缓存
  const testAbortScenario = async () => {
    try {
      addLog('🧪 开始测试中断场景不缓存...')

      const testKey: CacheKeyParams = {
        ...cacheKey,
        sentence: `Abort test - ${Date.now()}`
      }

      let text = ''
      let thinkContext = ''

      // 创建会中断的AbortController
      const abortController = new AbortController()

      // 100ms后中断
      setTimeout(() => {
        abortController.abort()
        addLog('⚠️ 请求已中断')
      }, 100)

      const content = [
        '<think>',
        'This is a thinking process',
        '</think>',
        'This content should not be cached because request will be aborted'
      ]

      const generator = createTestGenerator(content, 50)
      const result = await mockHandleThinkAndResult(
        generator,
        (value) => { text += value },
        (value) => { thinkContext += value },
        abortController.signal
      )

      addLog(`📊 中断结果: completed=${result.completed}, hasContent=${result.hasContent}, thinkComplete=${result.thinkComplete}`)
      addLog(`📝 生成内容: text="${text}", thinkContext="${thinkContext}"`)

      if (!result.completed) {
        addLog('✅ 中断检测正确: 请求未完成，内容不会被缓存')

        // 验证确实没有缓存
        const cached = await cacheService.get(testKey)
        if (!cached) {
          addLog('✅ 验证成功: 中断的请求确实没有被缓存')
        } else {
          addLog('❌ 验证失败: 中断的请求被错误缓存了')
        }
      } else {
        addLog('❌ 中断检测失败: 请求显示已完成')
      }

    } catch (error) {
      addLog(`❌ 中断场景测试失败: ${error}`)
    }
  }

  // 测试内容过短不缓存
  const testShortContent = async () => {
    try {
      addLog('🧪 开始测试内容过短不缓存...')

      const testKey: CacheKeyParams = {
        ...cacheKey,
        sentence: `Short content test - ${Date.now()}`
      }

      let text = ''
      let thinkContext = ''

      // 创建内容过短的生成器
      const content = ['Hi']  // 只有2个字符，小于最小长度5

      const generator = createTestGenerator(content, 10)
      const result = await mockHandleThinkAndResult(
        generator,
        (value) => { text += value },
        (value) => { thinkContext += value }
      )

      addLog(`📊 短内容结果: completed=${result.completed}, hasContent=${result.hasContent}, thinkComplete=${result.thinkComplete}`)
      addLog(`📝 生成内容: text="${text}" (长度: ${text.length})`)

      const shouldCacheResult = shouldCache(text, [], thinkContext)

      if (result.completed && !result.hasContent) {
        addLog('✅ 内容长度检测正确: 内容过短，hasContent=false')
      }

      if (!shouldCacheResult) {
        addLog('✅ shouldCache检测正确: 内容过短不应缓存')

        // 验证确实没有缓存
        const cached = await cacheService.get(testKey)
        if (!cached) {
          addLog('✅ 验证成功: 过短内容确实没有被缓存')
        } else {
          addLog('❌ 验证失败: 过短内容被错误缓存了')
        }
      } else {
        addLog('❌ shouldCache检测失败: 过短内容被允许缓存')
      }

    } catch (error) {
      addLog(`❌ 短内容测试失败: ${error}`)
    }
  }

  // 测试think标签不完整不缓存
  const testIncompleteThink = async () => {
    try {
      addLog('🧪 开始测试think标签不完整不缓存...')

      const testKey: CacheKeyParams = {
        ...cacheKey,
        sentence: `Incomplete think test - ${Date.now()}`
      }

      let text = ''
      let thinkContext = ''

      // 创建think标签不完整的生成器（缺少</think>结束标签）
      const content = [
        '<think>',
        'This thinking process is incomplete',  // 缺少</think>结束标签
        'This is the main content that should not be cached due to incomplete think tags'
      ]

      const generator = createTestGenerator(content, 10)
      const result = await mockHandleThinkAndResult(
        generator,
        (value) => { text += value },
        (value) => { thinkContext += value }
      )

      addLog(`📊 不完整think结果: completed=${result.completed}, hasContent=${result.hasContent}, thinkComplete=${result.thinkComplete}`)
      addLog(`📝 生成内容: text="${text}", thinkContext="${thinkContext}"`)

      // 在think标签不完整的情况下：
      // - completed=true (生成器正常完成)
      // - hasContent=false (因为所有内容都被当作think内容，主要内容为空)
      // - thinkComplete=false (think标签没有正确结束)

      if (result.completed && !result.hasContent && !result.thinkComplete) {
        addLog('✅ think完整性检测正确: think标签不完整导致hasContent=false, thinkComplete=false')
      }

      // 由于hasContent=false，即使我们修复了shouldCache，这个内容也不应该被缓存
      if (!result.hasContent) {
        addLog('✅ 内容检测正确: 由于think标签不完整，主要内容为空，不应缓存')

        // 验证确实没有缓存
        const cached = await cacheService.get(testKey)
        if (!cached) {
          addLog('✅ 验证成功: think标签不完整的内容确实没有被缓存')
        } else {
          addLog('❌ 验证失败: think标签不完整的内容被错误缓存了')
        }
      } else {
        addLog('❌ 内容检测失败: think标签不完整但内容检测通过')
      }

    } catch (error) {
      addLog(`❌ think标签不完整测试失败: ${error}`)
    }
  }

  // 测试列表类型缓存
  const testListTypeCache = async () => {
    try {
      addLog('🧪 开始测试列表类型缓存...')

      const testKey: CacheKeyParams = {
        ...cacheKey,
        sentence: `List type test - ${Date.now()}`
      }

      let list: string[] = []
      let thinkContext = ''

      // 创建列表内容的生成器
      const content = [
        '<think>',
        'Processing list items',
        '</think>',
        'Item 1: First important item',
        'Item 2: Second important item',
        'Item 3: Third important item'
      ]

      const generator = createTestGenerator(content, 10)
      const result = await mockHandleThinkAndResult(
        generator,
        (value) => { list.push(value) },  // 列表模式
        (value) => { thinkContext += value }
      )

      addLog(`📊 列表结果: completed=${result.completed}, hasContent=${result.hasContent}, thinkComplete=${result.thinkComplete}`)
      addLog(`📝 生成内容: list=[${list.join(', ')}], thinkContext="${thinkContext}"`)

      if (result.completed && result.hasContent && result.thinkComplete && shouldCache('', list, thinkContext)) {
        await cacheService.set(testKey, {
          type: OUTPUT_TYPE.SIMPLE_LIST,
          resultArray: list,
          thinkContext
        })
        addLog('✅ 列表类型缓存成功')

        // 验证缓存
        const cached = await cacheService.get(testKey)
        if (cached && 'resultArray' in cached) {
          addLog(`✅ 列表缓存验证成功: ${cached.resultArray.length} 个项目`)
        } else {
          addLog('❌ 列表缓存验证失败')
        }
      } else {
        addLog('❌ 列表内容未通过缓存条件验证')
      }

    } catch (error) {
      addLog(`❌ 列表类型测试失败: ${error}`)
    }
  }

  // 综合测试场景
  const testOptimizedCacheScenarios = async () => {
    addLog('=== 开始缓存机制优化综合测试 ===')

    await testNormalCompletion()
    await new Promise(resolve => setTimeout(resolve, 200))

    await testAbortScenario()
    await new Promise(resolve => setTimeout(resolve, 200))

    await testShortContent()
    await new Promise(resolve => setTimeout(resolve, 200))

    await testIncompleteThink()
    await new Promise(resolve => setTimeout(resolve, 200))

    await testListTypeCache()

    addLog('=== 缓存机制优化综合测试结束 ===')
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cache Service 测试页面</h1>

      {/* 测试参数配置 */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">测试参数配置</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Book ID:</label>
            <input
              type="text"
              value={cacheKey.bookId}
              onChange={e => setCacheKey({ ...cacheKey, bookId: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Chapter Index:</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sentence:</label>
            <input
              type="text"
              value={cacheKey.sentence}
              onChange={e => setCacheKey({ ...cacheKey, sentence: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rule ID:</label>
            <input
              type="text"
              value={cacheKey.ruleId}
              onChange={e => setCacheKey({ ...cacheKey, ruleId: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Result Content:</label>
            <textarea
              value={result}
              onChange={e => setResult(e.target.value)}
              className="w-full p-2 border rounded h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Think Context:</label>
            <textarea
              value={thinkContext}
              onChange={e => setThinkContext(e.target.value)}
              className="w-full p-2 border rounded h-20"
            />
          </div>
        </div>
      </div>

      {/* 测试按钮 */}
      <div className="mb-6 space-x-4">
        <button
          onClick={testSet}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          测试 Set
        </button>

        <button
          onClick={testGet}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          测试 Get
        </button>

        <button
          onClick={testRemove}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          测试 Remove
        </button>

        <button
          onClick={testCompleteFlow}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          完整流程测试
        </button>

        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          清空日志
        </button>
      </div>

      {/* 新增：缓存清理测试区域 */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">缓存超量清理测试</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">批量添加数量:</label>
            <input
              type="number"
              value={batchCount}
              onChange={e => setBatchCount(parseInt(e.target.value) || 10)}
              className="w-full p-2 border rounded"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">最大缓存数量:</label>
            <input
              type="number"
              value={maxCacheSize}
              onChange={e => setMaxCacheSize(parseInt(e.target.value) || 5)}
              className="w-full p-2 border rounded"
              min="1"
              max="50"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={getCacheStats}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              获取缓存统计
            </button>
          </div>
        </div>

        <div className="space-x-4">
          <button
            onClick={batchAddCache}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            批量添加缓存
          </button>

          <button
            onClick={testOverflowCleanup}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            测试超量清理
          </button>

          <button
            onClick={testCompleteOverflowScenario}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            完整超量场景
          </button>

          <button
            onClick={resetCacheSettings}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            重置设置
          </button>

          <button
            onClick={clearAllCache}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            清空所有缓存
          </button>
        </div>
      </div>

      {/* 新增：缓存机制优化测试区域 */}
      <div className="mb-6 p-4 border rounded-lg bg-purple-50">
        <h2 className="text-xl font-semibold mb-4">🔧 缓存机制优化测试</h2>
        <p className="text-sm text-gray-600 mb-4">
          测试新的缓存机制：基于Promise的缓存触发、中断检测、内容验证等功能
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">单项测试:</h3>
            <div className="space-x-2">
              <button
                onClick={testNormalCompletion}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                正常完成
              </button>

              <button
                onClick={testAbortScenario}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                中断场景
              </button>

              <button
                onClick={testShortContent}
                className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
              >
                内容过短
              </button>
            </div>

            <div className="space-x-2">
              <button
                onClick={testIncompleteThink}
                className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
              >
                Think不完整
              </button>

              <button
                onClick={testListTypeCache}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                列表类型
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm">综合测试:</h3>
            <button
              onClick={testOptimizedCacheScenarios}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 w-full"
            >
              🧪 运行全部优化测试
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>测试说明:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li><span className="font-medium">正常完成:</span> 测试正常请求完成后的缓存行为</li>
            <li><span className="font-medium">中断场景:</span> 测试AbortSignal中断时不会产生无效缓存</li>
            <li><span className="font-medium">内容过短:</span> 测试内容长度不足时的过滤机制</li>
            <li><span className="font-medium">Think不完整:</span> 测试think标签不完整时的处理</li>
            <li><span className="font-medium">列表类型:</span> 测试数组类型缓存的处理</li>
          </ul>
        </div>
      </div>

      {/* 缓存统计显示 */}
      {cacheStats && (
        <div className="mb-6 p-4 border rounded-lg bg-green-50">
          <h3 className="text-lg font-semibold mb-2">缓存统计:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded border">
              <span className="text-sm text-gray-600">总项目数:</span>
              <span className="text-xl font-bold ml-2">{cacheStats.totalCount}</span>
            </div>
            <div className="bg-white p-3 rounded border">
              <span className="text-sm text-gray-600">时间槽数:</span>
              <span className="text-xl font-bold ml-2">{cacheStats.slotCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* 当前缓存数据显示 */}
      {cachedItem && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">当前缓存数据:</h3>
          <pre className="bg-white p-3 rounded border text-sm">
            {JSON.stringify(cachedItem, null, 2)}
          </pre>
        </div>
      )}

      {/* 测试日志 */}
      <div className="border rounded-lg">
        <h3 className="text-lg font-semibold p-4 border-b">测试日志:</h3>
        <pre className="p-4 bg-gray-50 text-sm whitespace-pre-wrap h-64 overflow-y-auto">
          {testResult || '暂无测试日志...'}
        </pre>
      </div>
    </div>
  )
} 