/**
 * 중첩 배열을 지정한 깊이만큼 펼친다 (기본: 1단계).
 *
 * @example flatten([1, [2, [3, [4]]]])          // [1, 2, [3, [4]]]
 * @example flatten([1, [2, [3, [4]]]], Infinity) // [1, 2, 3, 4]
 * @complexity Time: O(n) | Space: O(n)
 */
export function flatten<T>(arr: T[], depth?: number): FlatArray<T[], number>[];
export function flatten(arr: unknown[], depth = 1): unknown[] {
  return arr.flat(depth);
}
