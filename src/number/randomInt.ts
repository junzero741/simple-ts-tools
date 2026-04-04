/**
 * [min, max] 범위의 정수 난수를 반환한다 (양 끝 포함).
 *
 * @example randomInt(1, 6)    // 1~6 사이의 정수 (주사위)
 * @example randomInt(0, 100)  // 0~100 사이의 정수
 * @complexity Time: O(1) | Space: O(1)
 */
export function randomInt(min: number, max: number): number {
  if (min > max) throw new Error("min must be <= max");
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
