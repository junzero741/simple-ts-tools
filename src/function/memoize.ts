/**
 * 함수의 결과를 인자 기준으로 캐싱한다.
 * 같은 인자로 재호출 시 원본 함수를 실행하지 않고 캐시된 값을 반환한다.
 *
 * 반환된 함수에는 `.cache` (Map)와 `.clear()` 메서드가 붙어 있다.
 *
 * @param keyFn 캐시 키 생성 함수 (기본값: JSON.stringify)
 *
 * @example
 * const expensiveCalc = memoize((n: number) => fibonacci(n));
 * expensiveCalc(40); // 계산 실행
 * expensiveCalc(40); // 캐시에서 즉시 반환
 * expensiveCalc.clear(); // 캐시 초기화
 *
 * @complexity Time: O(1) cache hit | Space: O(n) — n은 고유 인자 조합 수
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  keyFn: (...args: TArgs) => string = (...args) => JSON.stringify(args)
): ((...args: TArgs) => TReturn) & { cache: Map<string, TReturn>; clear: () => void } {
  const cache = new Map<string, TReturn>();

  const memoized = (...args: TArgs): TReturn => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key) as TReturn;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}
