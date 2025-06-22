import { OutputType } from "./prompt";

/**
 * 缓存项值类型
 */
export type CacheItemValue =
  {
    type: OutputType
    thinkContext?: string;
    result: string
  } | {
    type: OutputType
    thinkContext?: string;
    resultArray: string[]
  }


/**
 * 缓存项Type
 */
export type CacheItem = {
  /** 创建时间 ISO字符串格式 */
  createTime: string;
} & CacheItemValue
/**
 * 缓存配置接口
 */
export interface CacheSettings {
  /** 过期时间（小时） */
  expireHours: number;
  /** 边界缓冲槽数量 */
  bufferSlots: number;
  /** 最大缓存项数 */
  maxCacheSize: number;
}

/**
 * 缓存系统状态接口
 */
export interface CacheSystem {
  /** 按时间槽分桶存储 */
  buckets: Record<string, Record<string, CacheItem>>;
  /** 全局索引：key -> 时间槽ID */
  globalIndex: Record<string, string>;
  /** 配置参数 */
  settings: CacheSettings;
}

/**
 * 缓存键生成参数接口
 */
export interface CacheKeyParams {
  /** 书籍ID */
  bookId: string;
  /** 句子内容 */
  sentence: string;
  /** 规则ID */
  ruleId: string;
}


export type SentenceProcessing = { name: string, type: string, generator: AsyncGenerator<string, void, unknown>, id: string, text: string }