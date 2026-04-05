/**
 * 술어 함수(predicate)의 결과를 반전시킨 새 함수를 반환한다.
 * 타입 가드 술어도 지원한다.
 *
 * @example
 * const isEven = (n: number) => n % 2 === 0;
 * const isOdd = negate(isEven);
 * [1, 2, 3, 4].filter(isOdd);  // [1, 3]
 *
 * // null/undefined 필터링
 * const isNil = (v: unknown): v is null | undefined => v == null;
 * const isNotNil = negate(isNil);
 * [1, null, 2, undefined, 3].filter(isNotNil);  // [1, 2, 3]
 *
 * // takeWhile / dropWhile과 함께
 * takeWhile([1, 2, 3, 4], negate(x => x > 2));  // [1, 2]
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function negate<T extends unknown[]>(
  fn: (...args: T) => boolean
): (...args: T) => boolean {
  return (...args: T) => !fn(...args);
}
