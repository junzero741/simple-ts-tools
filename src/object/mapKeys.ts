/**
 * 객체의 모든 키에 변환 함수를 적용한 새 객체를 반환한다.
 * 값은 그대로 유지된다.
 *
 * @example
 * mapKeys({ background_color: "#fff", font_size: 16 }, kebabToCamel)
 * // { backgroundColor: "#fff", fontSize: 16 }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function mapKeys<V>(
  obj: Record<string, V>,
  keyFn: (key: string) => string
): Record<string, V> {
  const result: Record<string, V> = {};
  for (const key of Object.keys(obj)) {
    result[keyFn(key)] = obj[key];
  }
  return result;
}
