/**
 * 함수를 최초 한 번만 실행하고, 이후 호출은 첫 번째 결과를 그대로 반환한다.
 * 비동기 함수도 지원하며, 첫 번째 Promise가 완료되기 전에 재호출해도 중복 실행하지 않는다.
 * 반환된 함수에는 .reset()으로 상태를 초기화할 수 있다.
 *
 * @example
 * const initDB = once(() => connectDatabase());
 * await initDB(); // 연결 실행
 * await initDB(); // 동일한 결과 반환, 재연결 없음
 * initDB.reset(); // 상태 초기화 (다음 호출 시 재실행)
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function once<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): ((...args: TArgs) => TReturn) & { reset: () => void } {
  let called = false;
  let result: TReturn;

  const wrapped = (...args: TArgs): TReturn => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };

  wrapped.reset = () => {
    called = false;
  };

  return wrapped;
}
