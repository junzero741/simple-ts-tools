/**
 * 배열을 크기 n의 겹치는 윈도우로 나눈 2차원 배열을 반환한다.
 *
 * chunk와의 차이:
 * - chunk: 비겹침 (겹침 없이 순차 분할)
 * - windows: 겹침 (슬라이딩 윈도우, 이동평균·n-gram 등에 사용)
 *
 * @param arr    원본 배열
 * @param size   윈도우 크기 (1 이상)
 * @param step   다음 윈도우 시작까지의 이동 간격 (기본: 1)
 *
 * @example
 * windows([1, 2, 3, 4, 5], 3)
 * // [[1,2,3], [2,3,4], [3,4,5]]
 *
 * windows([1, 2, 3, 4, 5], 3, { step: 2 })
 * // [[1,2,3], [3,4,5]]
 *
 * // 이동평균 (3-period MA)
 * windows(prices, 3).map(w => w.reduce((a, b) => a + b, 0) / w.length)
 *
 * @complexity Time: O(n * size) | Space: O(n * size)
 */
export function windows<T>(
  arr: T[],
  size: number,
  options: { step?: number } = {}
): T[][] {
  if (size <= 0) throw new Error("size must be >= 1");
  const step = options.step ?? 1;
  if (step <= 0) throw new Error("step must be >= 1");

  if (arr.length < size) return [];

  const result: T[][] = [];
  for (let i = 0; i + size <= arr.length; i += step) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 배열을 인접한 두 요소의 쌍으로 묶은 배열을 반환한다.
 * `windows(arr, 2)`의 축약형.
 *
 * @example
 * pairwise([1, 2, 3, 4])
 * // [[1,2], [2,3], [3,4]]
 *
 * // 연속된 날짜 간 차이 계산
 * pairwise(dates).map(([a, b]) => diffDays(a, b))
 *
 * // 가격 변동률
 * pairwise(prices).map(([prev, curr]) => (curr - prev) / prev * 100)
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function pairwise<T>(arr: T[]): [T, T][] {
  return windows(arr, 2) as [T, T][];
}
