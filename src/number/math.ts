/**
 * 두 값 사이를 t(0~1)에 따라 선형 보간한다.
 *
 * - t=0 → start, t=1 → end
 * - t는 [0, 1] 범위를 권장하지만 범위 외 값도 허용 (extrapolation)
 *
 * @example
 * lerp(0, 100, 0.5)  // 50
 * lerp(0, 100, 0.25) // 25
 * lerp(10, 20, 0)    // 10
 * lerp(10, 20, 1)    // 20
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * value를 [min, max] 범위에서 [0, 1]로 정규화한다.
 *
 * - min === max 이면 0을 반환 (division by zero 방지)
 * - clamp 옵션으로 결과를 [0, 1]로 제한할 수 있다 (기본: false)
 *
 * @example
 * normalize(50, 0, 100)         // 0.5
 * normalize(0, 0, 100)          // 0
 * normalize(100, 0, 100)        // 1
 * normalize(150, 0, 100)        // 1.5   (범위 초과 허용)
 * normalize(150, 0, 100, true)  // 1     (clamp: true)
 */
export function normalize(value: number, min: number, max: number, clamp = false): number {
  if (min === max) return 0;
  const result = (value - min) / (max - min);
  return clamp ? Math.min(1, Math.max(0, result)) : result;
}

/**
 * value가 total에서 차지하는 백분율을 반환한다.
 *
 * - total이 0이면 0을 반환 (division by zero 방지)
 * - decimals로 소수점 자리수를 지정할 수 있다 (기본: 0)
 *
 * @example
 * percentage(30, 200)     // 15
 * percentage(1, 3, 1)     // 33.3
 * percentage(2, 3, 2)     // 66.67
 * percentage(0, 0)        // 0
 */
/**
 * value를 [inMin, inMax] 범위에서 [outMin, outMax] 범위로 선형 매핑한다.
 * `normalize` + `lerp`의 합성 — 두 임의 범위 사이의 직접 변환.
 *
 * - inMin === inMax 이면 outMin을 반환 (division by zero 방지)
 * - clamp: true 이면 결과가 [outMin, outMax]를 벗어나지 않도록 제한
 * - 역방향 범위(inMax < inMin, outMax < outMin)도 지원
 *
 * @example
 * // 데이터 값 → 픽셀 좌표
 * mapRange(50, 0, 100, 0, 800)      // 400
 *
 * // 슬라이더 위치(0~1) → 볼륨(0~100)
 * mapRange(0.7, 0, 1, 0, 100)       // 70
 *
 * // 온도 변환: 섭씨 → 화씨
 * mapRange(100, 0, 100, 32, 212)    // 212
 * mapRange(0,   0, 100, 32, 212)    // 32
 *
 * // 범위 초과 값 clamp
 * mapRange(150, 0, 100, 0, 255)         // 382.5 (extrapolation)
 * mapRange(150, 0, 100, 0, 255, true)   // 255   (clamp)
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clamp = false
): number {
  if (inMin === inMax) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  const result = outMin + (outMax - outMin) * t;
  if (!clamp) return result;
  return outMin < outMax
    ? Math.min(outMax, Math.max(outMin, result))
    : Math.min(outMin, Math.max(outMax, result));
}

export function percentage(value: number, total: number, decimals = 0): number {
  if (total === 0) return 0;
  const raw = (value / total) * 100;
  // 부동소수점 정밀도 보정 (round 유틸과 동일한 지수 표기 트릭)
  const factor = Math.pow(10, decimals);
  return Math.round((raw + Number.EPSILON) * factor) / factor;
}
