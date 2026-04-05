/**
 * 값을 변경하지 않고 부수 효과(로깅, 추적, 유효성 검사 등)를 실행하는 함수를 반환한다.
 * `pipe` / `compose` 체인 중간에 삽입해 데이터 흐름을 끊지 않고 관찰할 수 있다.
 *
 * @example
 * // pipe 디버깅 — 각 단계의 중간 값 확인
 * pipe(
 *   rawUsers,
 *   tap(xs => console.log("원본:", xs.length)),
 *   xs => xs.filter(u => u.active),
 *   tap(xs => console.log("활성 유저:", xs.length)),
 *   xs => groupBy(xs, u => u.role),
 * );
 *
 * // 프로덕션 — 로깅/분석 삽입 (체인 유지)
 * const processOrder = compose(
 *   sendConfirmation,
 *   tap(order => analytics.track("order.paid", { id: order.id })),
 *   chargePayment,
 *   tap(order => logger.info("order validated", { id: order.id })),
 *   validateOrder,
 * );
 *
 * // 개발 중 단독 사용
 * const debug = tap(console.log);
 * [1, 2, 3].map(debug); // 각 값을 출력하면서 배열은 그대로 반환
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function tap<T>(fn: (value: T) => void): (value: T) => T {
  return (value: T): T => {
    fn(value);
    return value;
  };
}
