import dayjs from 'dayjs';
import { CacheKeyParams } from '@/types/cache';

/**
 * 生成句子的8位短哈希值
 * 
 * 使用简单的字符串哈希实现，确保跨平台兼容性和同步执行
 * 
 * @param sentence - 要哈希的句子字符串
 * @returns string 8位十六进制哈希字符串
 * 
 * @example
 * ```typescript
 * const hash = generateSentenceHash("Hello world");
 * console.log(hash); // "a1b2c3d4"
 * ```
 */
export function generateSentenceHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16).substring(0, 8).padStart(8, '0');
}

/**
 * 从UUID中提取最后6位字符
 * 
 * @param uuid - 完整的UUID字符串
 * @returns string 最后6位字符（不包括连字符）
 * 
 * @example
 * ```typescript
 * const suffix = extractUUIDSuffix("550e8400-e29b-41d4-a716-446655440000");
 * console.log(suffix); // "440000"
 * ```
 */
export function extractUUIDSuffix(uuid: string): string {
  // 移除连字符并取最后6位
  const cleanUuid = uuid.replace(/-/g, '');
  return cleanUuid.slice(-6);
}

/**
 * 生成当前时间的时间槽ID
 * 
 * @returns string 格式为 YYYY-MM-DD_HH 的时间槽ID
 * 
 * @example
 * ```typescript
 * const slot = getTimeSlot();
 * console.log(slot); // "2024-01-15_14"
 * ```
 */
export function getTimeSlot(): string {
  return dayjs().format('YYYY-MM-DD_HH');
}

/**
 * 生成缓存键
 * 
 * @param params - 缓存键生成参数
 * @returns string 格式为 bookSuffix|chapterIndex|sentenceHash|ruleSuffix 的缓存键
 * 
 * @example
 * ```typescript
 * const key = generateCacheKey({
 *   bookId: "550e8400-e29b-41d4-a716-446655440000",
 *   chapterIndex: 5,
 *   sentence: "Hello world",
 *   ruleId: "123e4567-e89b-12d3-a456-426614174000"
 * });
 * console.log(key); // "440000|5|a1b2c3|174000"
 * ```
 */
export function generateCacheKey(params: CacheKeyParams): string {
  const { bookId, sentence, ruleId } = params;

  const bookSuffix = extractUUIDSuffix(bookId);
  const sentenceHash = generateSentenceHash(sentence);
  const ruleSuffix = extractUUIDSuffix(ruleId);

  return `${bookSuffix}|${sentenceHash}|${ruleSuffix}`;
}

/**
 * 检查时间是否过期
 * 
 * @param createTime - 创建时间的ISO字符串
 * @param expireHours - 过期时长（小时）
 * @returns boolean 是否已过期
 * 
 * @example
 * ```typescript
 * const isExpired = isTimeExpired("2024-01-15T10:00:00Z", 1);
 * console.log(isExpired); // true/false
 * ```
 */
export function isTimeExpired(createTime: string, expireHours: number): boolean {
  const createDateTime = dayjs(createTime);
  const now = dayjs();
  return now.diff(createDateTime, 'hour') >= expireHours;
}

/**
 * 解析时间槽ID为Date对象
 * 
 * @param slotId - 时间槽ID，格式为 YYYY-MM-DD_HH
 * @returns Date 解析后的日期对象
 * 
 * @example
 * ```typescript
 * const date = parseTimeSlot("2024-01-15_14");
 * console.log(date); // Date object for 2024-01-15 14:00:00
 * ```
 */
export function parseTimeSlot(slotId: string): Date {
  const [datePart, hourPart] = slotId.split('_');
  return dayjs(`${datePart} ${hourPart}:00:00`).toDate();
}

/**
 * 检查时间槽是否比指定小时数更老
 * 
 * @param slotId - 时间槽ID
 * @param hours - 小时数
 * @returns boolean 是否更老
 * 
 * @example
 * ```typescript
 * const isOlder = isSlotOlderThan("2024-01-15_14", 24);
 * console.log(isOlder); // true/false
 * ```
 */
export function isSlotOlderThan(slotId: string, hours: number): boolean {
  const slotDate = parseTimeSlot(slotId);
  const now = dayjs();
  return now.diff(dayjs(slotDate), 'hour') >= hours;
}

/**
 * 按年龄排序时间槽（最老的在前）
 * 
 * @param slotIds - 时间槽ID数组
 * @returns string[] 排序后的时间槽ID数组
 * 
 * @example
 * ```typescript
 * const sorted = sortSlotsByAge(["2024-01-15_14", "2024-01-15_13"]);
 * console.log(sorted); // ["2024-01-15_13", "2024-01-15_14"]
 * ```
 */
export function sortSlotsByAge(slotIds: string[]): string[] {
  return slotIds.sort((a, b) => {
    const dateA = parseTimeSlot(a);
    const dateB = parseTimeSlot(b);
    return dateA.getTime() - dateB.getTime();
  });
}

