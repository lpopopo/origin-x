/**
 * 递归解码 URI 组件，直到无法继续解码为止
 * @param encodedString 需要解码的字符串
 * @returns 完全解码后的字符串
 */
export function decodeURIComponentRecursive(encodedString: string): string {
  if (typeof encodedString !== 'string') {
    return encodedString;
  }

  let decoded = encodedString;
  let previousDecoded = '';
  
  // 持续解码直到无法继续解码
  while (decoded !== previousDecoded) {
    previousDecoded = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch (error) {
      // 如果解码失败，说明已经无法继续解码，返回当前结果
      console.warn('URI 解码失败，返回当前结果:', error);
      break;
    }
  }
  
  return decoded;
}

/**
 * 安全的 URI 解码，处理可能的解码错误
 * @param encodedString 需要解码的字符串
 * @returns 解码后的字符串，如果解码失败则返回原字符串
 */
export function safeDecodeURIComponent(encodedString: string): string {
  try {
    return decodeURIComponentRecursive(encodedString);
  } catch (error) {
    console.warn('URI 解码过程中发生错误，返回原字符串:', error);
    return encodedString;
  }
}
