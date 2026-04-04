/**
 * [start, end) 범위의 숫자 배열을 생성한다. step 기본값은 1.
 * @example range(0, 5)       // [0, 1, 2, 3, 4]
 * @example range(1, 10, 2)   // [1, 3, 5, 7, 9]
 * @example range(5, 0, -1)   // [5, 4, 3, 2, 1]
 * @complexity Time: O(n) | Space: O(n)
 */
export function range(start: number, end: number, step = 1): number[] {
  if (step === 0) throw new Error("step must not be 0");

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) result.push(i);
  } else {
    for (let i = start; i > end; i += step) result.push(i);
  }
  return result;
}
