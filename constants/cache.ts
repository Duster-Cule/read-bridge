import { CacheSettings } from "@/types/cache";

/**
 * 默认缓存配置
 */
const DEFAULT_CACHE_SETTINGS: CacheSettings = {
  expireHours: 1,
  bufferSlots: 2,
  maxCacheSize: 1000,
};

const SETTING_BOUNDS = {
  expireHours: { min: 1, max: 168 },    // 1小时到7天
  bufferSlots: { min: 1, max: 10 },       // 1到10个槽
  maxCacheSize: { min: 100, max: 3000 }  // 100到3000项
} as const;
export {
  DEFAULT_CACHE_SETTINGS,
  SETTING_BOUNDS
}