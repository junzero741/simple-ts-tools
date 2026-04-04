/**
 * 객체에서 predicate를 통과하는 키-값 쌍을 제외한 새 객체를 반환한다.
 * pickBy의 반전 버전.
 *
 * @example omitBy({ a: 1, b: null, c: 2 }, v => v == null)  // { a: 1, c: 2 }
 * @example omitBy(config, (_, key) => key.startsWith('_'))   // private 필드 제거
 * @complexity Time: O(n) | Space: O(n)
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const k = key as keyof T;
      if (!predicate(obj[k], k)) {
        result[k] = obj[k];
      }
    }
  }
  return result;
}
