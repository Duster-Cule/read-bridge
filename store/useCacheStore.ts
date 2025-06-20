import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CacheSystem, CacheItem, CacheKeyParams } from '@/types/cache'
import { DEFAULT_CACHE_SETTINGS } from '@/constants/cache'

interface CacheStore extends CacheSystem {
  // 增删改 
  setItem: (timeSlot: string, key: string, item: CacheItem) => void
  removeItem: (timeSlot: string, key: string) => void
  removeSlot: (timeSlot: string) => void
  updateIndex: (key: string, timeSlot: string | null) => void

  // 查
  getItem: (timeSlot: string, key: string) => CacheItem | null
  getSlot: (timeSlot: string) => Record<string, CacheItem>
  getSlotForKey: (key: string) => string | null
  getAllSlots: () => string[]

  // 统计
  getTotalCount: () => number
  getSlotCount: () => number
  getSlotStats: () => Array<{ slotId: string, itemCount: number }>

  // 设置
  getSettings: () => typeof DEFAULT_CACHE_SETTINGS
  updateSettings: (settings: Partial<typeof DEFAULT_CACHE_SETTINGS>) => void
}

export const useCacheStore = create<CacheStore>()(
  persist(
    (set, get) => ({
      buckets: {},
      globalIndex: {},
      settings: DEFAULT_CACHE_SETTINGS,

      // 增删改
      setItem: (timeSlot: string, key: string, item: CacheItem) => {
        set(state => {
          const newBuckets = { ...state.buckets }
          if (!newBuckets[timeSlot]) {
            newBuckets[timeSlot] = {}
          }
          newBuckets[timeSlot] = {
            ...newBuckets[timeSlot],
            [key]: item
          }
          return { ...state, buckets: newBuckets }
        })
      },

      removeItem: (timeSlot: string, key: string) => {
        set(state => {
          const newBuckets = { ...state.buckets }
          if (newBuckets[timeSlot]) {
            const newTimeBucket = { ...newBuckets[timeSlot] }
            delete newTimeBucket[key]

            if (Object.keys(newTimeBucket).length === 0) {
              delete newBuckets[timeSlot]
            } else {
              newBuckets[timeSlot] = newTimeBucket
            }
          }
          return { ...state, buckets: newBuckets }
        })
      },

      removeSlot: (timeSlot: string) => {
        set(state => {
          const newBuckets = { ...state.buckets }
          delete newBuckets[timeSlot]
          return { ...state, buckets: newBuckets }
        })
      },

      updateIndex: (key: string, timeSlot: string | null) => {
        set(state => {
          const newGlobalIndex = { ...state.globalIndex }
          if (timeSlot === null) {
            delete newGlobalIndex[key]
          } else {
            newGlobalIndex[key] = timeSlot
          }
          return { ...state, globalIndex: newGlobalIndex }
        })
      },

      // 查询
      getItem: (timeSlot: string, key: string) => {
        const { buckets } = get()
        const timeBucket = buckets[timeSlot]
        return timeBucket?.[key] || null
      },

      getSlot: (timeSlot: string) => {
        const { buckets } = get()
        return buckets[timeSlot] || {}
      },

      getSlotForKey: (key: string) => {
        const { globalIndex } = get()
        return globalIndex[key] || null
      },

      getAllSlots: () => {
        const { buckets } = get()
        return Object.keys(buckets)
      },

      // 状态统计 read only
      getTotalCount: () => {
        const { buckets } = get()
        return Object.values(buckets).reduce((total, slot) =>
          total + Object.keys(slot).length, 0)
      },

      getSlotCount: () => {
        const { buckets } = get()
        return Object.keys(buckets).length
      },

      getSlotStats: () => {
        const { buckets } = get()
        return Object.entries(buckets).map(([slotId, slot]) => ({
          slotId,
          itemCount: Object.keys(slot).length
        }))
      },

      // 设置处理
      getSettings: () => {
        const { settings } = get()
        return settings
      },

      updateSettings: (newSettings) => {
        set(state => ({
          ...state,
          settings: { ...state.settings, ...newSettings }
        }))
      },
    }),
    {
      name: 'cache-storage',
    }
  )
) 