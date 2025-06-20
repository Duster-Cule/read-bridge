'use client'

import { useState } from 'react'
import { cacheService } from '@/services/CacheService'
import { CacheKeyParams, CacheItem } from '@/types/cache'

export default function CacheTestPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [cacheKey, setCacheKey] = useState<CacheKeyParams>({
    bookId: '550e8400-e29b-41d4-a716-446655440000',
    chapterIndex: 1,
    sentence: 'Hello world',
    ruleId: '123e4567-e89b-12d3-a456-426614174000'
  })
  const [result, setResult] = useState<string>('Test result content')
  const [thinkContext, setThinkContext] = useState<string>('Test think context')
  const [cachedItem, setCachedItem] = useState<CacheItem | null>(null)

  const addLog = (message: string) => {
    setTestResult(prev => prev + `[${new Date().toLocaleTimeString()}] ${message}\n`)
  }

  const testSet = async () => {
    try {
      addLog('开始测试 set 方法...')
      await cacheService.set(cacheKey, result, thinkContext)
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
            <input
              type="number"
              value={cacheKey.chapterIndex}
              onChange={e => setCacheKey({ ...cacheKey, chapterIndex: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
            />
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