/**
 * 숫자 배열의 평균(산술 평균)을 반환한다.
 * 빈 배열이면 NaN을 반환한다.
 *
 * @example
 * mean([1, 2, 3, 4, 5])  // 3
 * mean([])               // NaN
 */
export function mean(nums: number[]): number {
  if (nums.length === 0) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * 숫자 배열의 중앙값(median)을 반환한다.
 * - 홀수 개: 중간 값
 * - 짝수 개: 중간 두 값의 평균
 * - 빈 배열이면 NaN을 반환한다.
 * - 원본 배열을 변경하지 않는다.
 *
 * @example
 * median([3, 1, 2])        // 2
 * median([1, 2, 3, 4])     // 2.5
 * median([])               // NaN
 */
export function median(nums: number[]): number {
  if (nums.length === 0) return NaN;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * 숫자 배열의 최빈값(mode) 배열을 반환한다.
 * 동수(공동 최빈값)가 있으면 모두 반환한다.
 * 빈 배열이면 빈 배열을 반환한다.
 *
 * @example
 * mode([1, 2, 2, 3])          // [2]
 * mode([1, 1, 2, 2, 3])       // [1, 2]  (공동 최빈값)
 * mode([1, 2, 3])             // [1, 2, 3]  (모두 1회)
 * mode([])                    // []
 */
export function mode(nums: number[]): number[] {
  if (nums.length === 0) return [];

  const freq = new Map<number, number>();
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1);

  const max = Math.max(...freq.values());
  return [...freq.entries()]
    .filter(([, count]) => count === max)
    .map(([n]) => n);
}

/**
 * 분산(variance)을 반환한다.
 * @param sample true이면 표본 분산(n-1), false이면 모집단 분산(n). 기본: false
 * - 요소가 0개(sample=false) 또는 1개(sample=true)이면 NaN을 반환한다.
 *
 * @example
 * variance([2, 4, 4, 4, 5, 5, 7, 9])        // 4    (모집단)
 * variance([2, 4, 4, 4, 5, 5, 7, 9], true)  // 4.571... (표본)
 */
export function variance(nums: number[], sample = false): number {
  const n = nums.length;
  if (n === 0 || (sample && n === 1)) return NaN;

  const m = mean(nums);
  const sumSq = nums.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return sumSq / (sample ? n - 1 : n);
}

/**
 * 표준편차(standard deviation)를 반환한다.
 * @param sample true이면 표본 표준편차, false이면 모집단 표준편차. 기본: false
 *
 * @example
 * stddev([2, 4, 4, 4, 5, 5, 7, 9])  // 2
 */
export function stddev(nums: number[], sample = false): number {
  return Math.sqrt(variance(nums, sample));
}

/**
 * 숫자 배열의 합을 반환한다.
 * 빈 배열이면 0을 반환한다.
 *
 * @example
 * sum([1, 2, 3])  // 6
 */
export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
