/**
 * 값을 [min, max] 범위로 제한한다.
 * @example clamp(15, 0, 10)  // 10
 * @example clamp(-5, 0, 10)  // 0
 * @example clamp(5, 0, 10)   // 5
 * @complexity Time: O(1) | Space: O(1)
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) throw new Error("min must be <= max");
  return Math.min(Math.max(value, min), max);
}
