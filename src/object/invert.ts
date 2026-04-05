/**
 * 객체의 키와 값을 뒤집은 새 객체를 반환한다.
 * 값이 중복되면 마지막으로 등장한 키가 남는다.
 * 모든 값은 문자열로 변환된다.
 *
 * @example invert({ a: 1, b: 2, c: 3 })  // { "1": "a", "2": "b", "3": "c" }
 * @example invert({ sun: 0, mon: 1, tue: 2 })  // { "0": "sun", "1": "mon", "2": "tue" }
 * @complexity Time: O(n) | Space: O(n)
 */
export function invert<K extends string, V extends string | number>(
  obj: Record<K, V>
): Record<string, K> {
  const result: Record<string, K> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[String(obj[key])] = key;
    }
  }
  return result;
}
