/**
 * 숫자를 지정한 소수 자릿수로 반올림한다.
 * 부동소수점 오차를 보정하기 위해 지수 표기법 기반으로 계산한다.
 *
 * @param value 반올림할 숫자
 * @param decimals 소수 자릿수 (기본값: 0, 음수면 정수 단위 반올림)
 *
 * @example round(1.2345, 2)   // 1.23
 * @example round(1.005, 2)    // 1.01  (부동소수점 오차 보정)
 * @example round(1234, -2)    // 1200
 * @complexity Time: O(1) | Space: O(1)
 */
export function round(value: number, decimals = 0): number {
  const factor = Math.pow(10, decimals);
  // 지수 표기법으로 부동소수점 오차 회피
  return Math.round(Number(`${value}e${decimals}`)) / factor;
}
