/**
 * 여러 배열을 같은 인덱스끼리 묶어 튜플 배열을 반환한다.
 * 가장 짧은 배열 길이에 맞춘다.
 *
 * @example zip([1, 2, 3], ['a', 'b', 'c'])      // [[1,'a'], [2,'b'], [3,'c']]
 * @example zip([1, 2], ['a', 'b', 'c'], [true])  // [[1,'a',true]]
 * @complexity Time: O(n * k) | Space: O(n * k)  — n: 최단 배열 길이, k: 배열 수
 */
export function zip<T extends unknown[][]>(
  ...arrays: { [K in keyof T]: T[K] }
): { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[] {
  if (arrays.length === 0) return [];
  const minLen = Math.min(...arrays.map((a) => a.length));
  const result: unknown[][] = [];
  for (let i = 0; i < minLen; i++) {
    result.push(arrays.map((a) => a[i]));
  }
  return result as { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[];
}
