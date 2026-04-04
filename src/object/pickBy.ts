/**
 * 객체에서 predicate를 통과하는 키-값 쌍만 추출한 새 객체를 반환한다.
 *
 * @example pickBy({ a: 1, b: 0, c: 2 }, v => v > 0)  // { a: 1, c: 2 }
 * @example pickBy(user, v => v !== null)               // null 필드 제거
 * @complexity Time: O(n) | Space: O(n)
 */
export function pickBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const k = key as keyof T;
      if (predicate(obj[k], k)) {
        result[k] = obj[k];
      }
    }
  }
  return result;
}
