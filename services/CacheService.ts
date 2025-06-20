import { useCacheStore } from '@/store/useCacheStore'
import { CacheKeyParams, CacheItem } from '@/types/cache'
import { generateCacheKey, getTimeSlot, isSlotOlderThan, isTimeExpired } from '@/utils/cache'
import { DEFAULT_CACHE_SETTINGS, SETTING_BOUNDS } from '@/constants/cache'
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

  /**
   * 更新单个缓存设置项
   */
  async function updateSetting(key: keyof typeof DEFAULT_CACHE_SETTINGS, value: number): Promise<void> {
    const store = useCacheStore.getState()

    // 正整数检查
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} 必须是正整数`);
    }

    // 边界检查
    const bounds = SETTING_BOUNDS[key];
    if (value < bounds.min || value > bounds.max) {
      throw new Error(`${key} 值必须在 ${bounds.min} 到 ${bounds.max} 之间`);
    }

    store.updateSettings({ [key]: value })
  }

  /**
   * 清理
   */
  async function clearCacheOnTriggerEvents() {
    let store = useCacheStore.getState()
    // 获取当前时间
    const now = dayjs()
    const timeSlot = getTimeSlot()
    const protectTimeSlots = [timeSlot]

    const { bufferSlots, maxCacheSize, expireHours } = store.getSettings()
    // 效率优先 
    // 检查槽位是否过期
    Array.from({ length: bufferSlots }).forEach((_, index) => {
      const prevSlot = now.subtract(index + 1, 'hour').format('YYYY-MM-DD_HH')
      protectTimeSlots.push(prevSlot)
    })
    const slotsToBeChecked = store.getAllSlots().filter(slot => {
      return !protectTimeSlots.includes(slot)
    })
    slotsToBeChecked.forEach(slot => {
      if (isSlotOlderThan(slot, expireHours)) {
        store.removeSlot(slot)
        store.removeIndex(slot)
      }
    })
    store = useCacheStore.getState()
    // 判断是否超量 TODO
    const length = store.getTotalCount()
    if (maxCacheSize > length) return

  }

  return {
    get,
    set,
    remove,
    updateSetting,
    clearCacheOnTriggerEvents
  }
}

// 导出单例
export const cacheService = CacheService()

