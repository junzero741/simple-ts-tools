/**
 * 배열 요소의 합을 반환한다.
 *
 * @example sum([1, 2, 3, 4, 5])  // 15
 * @complexity Time: O(n) | Space: O(1)
 */
export function sum(arr: number[]): number {
  return arr.reduce((acc, v) => acc + v, 0);
}

/**
 * 배열에서 keyFn으로 추출한 숫자 값들의 합을 반환한다.
 * 빈 배열이면 0을 반환한다.
 *
 * @example sumBy(cart, item => item.price * item.qty)  // 총 금액
 * @example sumBy(tasks, t => t.estimatedHours)         // 총 예상 시간
 *
 * @complexity Time: O(n) | Space: O(1)
 */
export function sumBy<T>(arr: T[], keyFn: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + keyFn(item), 0);
}
