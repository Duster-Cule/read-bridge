import { CacheSettings } from "@/types/cache";

/**
 * 默认缓存配置
 */
export const DEFAULT_CACHE_SETTINGS: CacheSettings = {
  expireHours: 1,
  bufferSlots: 2,
  maxCacheSize: 1000,
};