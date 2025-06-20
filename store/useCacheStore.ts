import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CacheSystem, CacheItem, CacheKeyParams } from '@/types/cache'
import { DEFAULT_CACHE_SETTINGS } from '@/constants/cache'
import { generateCacheKey, isTimeExpired, getTimeSlot } from '@/utils/cache'
import dayjs from 'dayjs'

interface CacheStore extends CacheSystem {
  // 设置缓存项
  setCacheItem: (params: CacheKeyParams, item: Omit<CacheItem, 'createTime'>) => void
  // 移除缓存项
  removeCacheItem: (cacheKey: string) => void
  // 获取缓存项
  getCacheItem: (params: CacheKeyParams) => CacheItem | null
}

export const useCacheStore = create<CacheStore>()(
  persist(
    (set, get) => ({
      buckets: {},
      globalIndex: {},
      settings: DEFAULT_CACHE_SETTINGS,
      setCacheItem(params, item) {
        // 1. 获取 cacheKey
        const cacheKey = generateCacheKey(params)

        // 2. 如果有老数据，则清除老数据
        const { removeCacheItem } = get()
        removeCacheItem(cacheKey)

        // 3. 存入新数据
        const timeSlot = getTimeSlot()
        const cacheItem: CacheItem = {
          ...item,
          createTime: dayjs().toISOString()
        }

        set(state => {
          const newGlobalIndex = { ...state.globalIndex }
          const newBuckets = { ...state.buckets }

          // 更新全局索引
          newGlobalIndex[cacheKey] = timeSlot

          // 更新对应的时间桶
          if (!newBuckets[timeSlot]) {
            newBuckets[timeSlot] = {}
          }
          newBuckets[timeSlot] = {
            ...newBuckets[timeSlot],
            [cacheKey]: cacheItem
          }

          return {
            ...state,
            globalIndex: newGlobalIndex,
            buckets: newBuckets
          }
        })
      },
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

    }),
    {
      name: 'cache-storage',
    }
  )
) 