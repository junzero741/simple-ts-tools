/**
 * 객체에서 지정한 키를 제외한 새 객체를 반환한다.
 * @example omit({ a: 1, b: 2, c: 3 }, ["b"]) // { a: 1, c: 3 }
 * @complexity Time: O(n) | Space: O(n) — n은 전체 키 수
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const excluded = new Set<PropertyKey>(keys);
  const result = {} as Omit<T, K>;
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (!excluded.has(key)) {
      (result as Record<PropertyKey, unknown>)[key as PropertyKey] = obj[key];
    }
  }
  return result;
}
