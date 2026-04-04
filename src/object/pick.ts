/**
 * 객체에서 지정한 키만 추출한 새 객체를 반환한다.
 * @example pick({ a: 1, b: 2, c: 3 }, ["a", "c"]) // { a: 1, c: 3 }
 * @complexity Time: O(k) | Space: O(k) — k는 선택한 키 수
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }
  return result;
}
