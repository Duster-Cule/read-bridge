import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CacheSystem, CacheItem, CacheKeyParams } from '@/types/cache'
import { DEFAULT_CACHE_SETTINGS } from '@/constants/cache'
import { generateCacheKey, isTimeExpired } from '@/utils/cache'

interface CacheStore extends CacheSystem {
  // 获取缓存项
  getCacheItem: (params: CacheKeyParams) => CacheItem | null
  // 移除缓存项
  removeCacheItem: (cacheKey: string) => void
  // 设置缓存项
  setCacheItem: (params: CacheKeyParams, item: Omit<CacheItem, 'createTime'>) => void
}

export const useCacheStore = create<CacheStore>()(
  persist(
    (set, get) => ({
      buckets: {},
      globalIndex: {},
      settings: DEFAULT_CACHE_SETTINGS,
      // 移除缓存项
      removeCacheItem(cacheKey) {
        const { globalIndex } = get()
        const timeSlot = globalIndex[cacheKey]
        if (!timeSlot) return

        set(state => {
          const newGlobalIndex = { ...state.globalIndex }
          const newBuckets = { ...state.buckets }

          // 从全局索引中移除
          delete newGlobalIndex[cacheKey]

          // 从对应的时间桶中移除
          if (newBuckets[timeSlot]) {
            const newTimeBucket = { ...newBuckets[timeSlot] }
            delete newTimeBucket[cacheKey]

            // 如果时间桶为空，则删除整个时间桶
            if (Object.keys(newTimeBucket).length === 0) {
              delete newBuckets[timeSlot]
            } else {
              newBuckets[timeSlot] = newTimeBucket
            }
          }

          return {
            ...state,
            globalIndex: newGlobalIndex,
            buckets: newBuckets
          }
        })
      },
      // 获取缓存项
      getCacheItem(params) {
        const cacheKey = generateCacheKey(params)
        const { globalIndex, buckets, settings } = get()
        const timeSlot = globalIndex[cacheKey]
        if (!timeSlot) return null

        const timeBucket = buckets[timeSlot] ?? {}
        if (!timeBucket[cacheKey]) return null

        const cacheItem = timeBucket[cacheKey]

        // 检测缓存是否过期
        if (isTimeExpired(cacheItem.createTime, settings.expireHours)) {
          // 立即清理过期项（懒惰清理策略）
          get().removeCacheItem(cacheKey)
          return null
        }
        return cacheItem
      },
      setCacheItem(params, item) {

      }
    }),
    {
      name: 'cache-storage',
    }
  )
) 