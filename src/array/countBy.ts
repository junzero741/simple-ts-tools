/**
 * 배열 요소를 키 추출 함수 기준으로 집계해 각 키의 등장 횟수를 반환한다.
 * groupBy의 카운트 버전.
 *
 * @example
 * countBy(["a", "b", "a", "c", "b", "a"], x => x)
 * // { a: 3, b: 2, c: 1 }
 *
 * @example
 * countBy(users, u => u.role)
 * // { admin: 2, viewer: 5, editor: 1 }
 *
 * @complexity Time: O(n) | Space: O(k) — k: 유니크 키 수
 */
export function countBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Partial<Record<K, number>> {
  const result = {} as Partial<Record<K, number>>;
  for (const item of arr) {
    const key = keyFn(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}
