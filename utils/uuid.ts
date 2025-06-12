/**
 * 使用crypto.getRandomValues()生成UUID v4
 * 兼容性降级方案，适用于不支持crypto.randomUUID()的环境
 */
function generateUUIDFallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * 生成UUID v4
 * 
 * 优先使用原生crypto.randomUUID()，在不支持的环境中自动降级为
 * crypto.getRandomValues()实现，确保跨平台兼容性
 * 
 * @returns {string} RFC 4122标准的UUID v4字符串
 * 
 * @example
 * ```typescript
 * const uuid = generateUUID();
 * console.log(uuid); // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function generateUUID(): string {
  // 检查是否支持原生crypto.randomUUID()
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (error) {
      console.warn('crypto.randomUUID() failed, falling back to alternative implementation:', error);
    }
  }

  // 降级到crypto.getRandomValues()实现
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return generateUUIDFallback();
  }

  throw new Error('UUID generation not supported: crypto API unavailable');
}

console.log(crypto, 'crypto')

// 默认导出主要函数
export default generateUUID; 