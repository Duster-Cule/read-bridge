import { CacheItem } from "@/types/cache"
import { OUTPUT_TYPE } from "@/constants/prompt"
import { OutputType } from "@/types/prompt"

/**
 * 创建缓存模拟Generator
 * 从缓存数据创建能够模拟LLM generator行为的异步生成器
 * 
 * @param cacheItem - 缓存项数据
 * @param outputType - 输出类型
 * @returns AsyncGenerator<string, void, unknown>
 */
export async function* createCacheGenerator(
  cacheItem: CacheItem,
): AsyncGenerator<string, void, unknown> {
  // 模拟think过程
  if (cacheItem.thinkContext) {
    yield '<think>'
    yield cacheItem.thinkContext
    yield '</think>'
  }

  // 返回缓存的结果
  if ('result' in cacheItem) {
    yield cacheItem.result
  } else if ('resultArray' in cacheItem) {
    // 处理数组结果，模拟HTML标签包装
    yield '<ul>'
    for (const item of cacheItem.resultArray) {
      yield `<li>${item}</li>`
    }
    yield '</ul>'
  }
} 