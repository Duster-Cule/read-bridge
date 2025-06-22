'use client'

import { useState } from 'react'
import { cacheService } from '@/services/CacheService'
import { CacheKeyParams, CacheItem } from '@/types/cache'
import { useCacheStore } from '@/store/useCacheStore'
import { OUTPUT_TYPE } from '@/constants/prompt'

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