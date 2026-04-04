/**
 * 배열을 키 추출 함수 기준으로 그룹핑한다.
 * @example groupBy([1, 2, 3, 4], x => x % 2 === 0 ? 'even' : 'odd')
 * // { odd: [1, 3], even: [2, 4] }
 * @complexity Time: O(n) | Space: O(n)
 */
export function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Partial<Record<K, T[]>> {
  const result = {} as Partial<Record<K, T[]>>;
  for (const item of arr) {
    const key = keyFn(item);
    if (result[key] === undefined) {
      result[key] = [];
    }
    result[key]!.push(item);
  }
  return result;
}
