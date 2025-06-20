import { useCacheStore } from '@/store/useCacheStore'
import { CacheKeyParams, CacheItem } from '@/types/cache'
import { generateCacheKey, getTimeSlot, isTimeExpired } from '@/utils/cache'
import dayjs from 'dayjs'

export function CacheService() {
  /**
   * 获取缓存项
   */
  async function get(params: CacheKeyParams): Promise<CacheItem | null> {
    const store = useCacheStore.getState()

    const cacheKey = generateCacheKey(params)

    const timeSlot = store.getSlotForKey(cacheKey)
    // 无时间槽
    if (!timeSlot) return null

    const item = store.getItem(timeSlot, cacheKey)
    // 无对应值
    if (!item) return null

    const { expireHours } = store.getSettings()
    if (isTimeExpired(item.createTime, expireHours)) {
      // 过期清理
      store.removeItem(timeSlot, cacheKey)
      store.updateIndex(cacheKey, null)
      return null
    }

    return item
  }

  /**
   * 设置缓存项
   */
  async function set(params: CacheKeyParams, result: string, thinkContext?: string): Promise<void> {
    const store = useCacheStore.getState()

    const cacheKey = generateCacheKey(params)
    const timeSlot = getTimeSlot()

    // 清除老数据
    await remove(params)

    // 创建缓存项
    const cacheItem: CacheItem = {
      result,
      thinkContext,
      createTime: dayjs().toISOString()
    }

    // 存储新数据
    store.setItem(timeSlot, cacheKey, cacheItem)
    store.updateIndex(cacheKey, timeSlot)
  }

  /**
   * 移除缓存项
   */
  async function remove(params: CacheKeyParams): Promise<void> {
    const store = useCacheStore.getState()

    const cacheKey = generateCacheKey(params)
    const timeSlot = store.getSlotForKey(cacheKey)
    // 有对应时间槽
    if (timeSlot) {
      store.removeItem(timeSlot, cacheKey)
      store.updateIndex(cacheKey, null)
    }
  }

  return {
    get,
    set,
    remove
  }
}

// 导出单例
export const cacheService = CacheService()

