/**
 * reduce의 누적 버전 — 매 단계의 중간 값을 포함한 배열을 반환한다.
 * 초기값(initial)은 결과에 포함되지 않는다.
 *
 * @example
 * scan([1, 2, 3, 4], 0, (acc, x) => acc + x)
 * // [1, 3, 6, 10]  — 누적 합
 *
 * scan([100, -10, 20, -5], 0, (acc, x) => acc + x)
 * // [100, 90, 110, 105]  — 잔액 추적
 *
 * scan([1, 2, 3, 4], 1, (acc, x) => acc * x)
 * // [1, 2, 6, 24]  — 누적 곱 (팩토리얼)
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function scan<T, U>(
  arr: T[],
  initial: U,
  fn: (acc: U, item: T, index: number) => U
): U[] {
  const result: U[] = [];
  let acc = initial;
  for (let i = 0; i < arr.length; i++) {
    acc = fn(acc, arr[i], i);
    result.push(acc);
  }
  return result;
}
