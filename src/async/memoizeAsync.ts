export interface MemoizeAsyncOptions<TArgs extends unknown[]> {
  /**
   * 캐시 만료 시간 (ms). 미지정 시 영구 캐시.
   */
  ttl?: number;
  /**
   * 최대 캐시 항목 수. 초과 시 가장 오래된 항목 제거 (FIFO).
   * 미지정 시 무제한.
   */
  maxSize?: number;
  /**
   * 캐시 키 생성 함수 (기본: JSON.stringify).
   */
  keyFn?: (...args: TArgs) => string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // null = 영구
}

/**
 * 비동기 함수의 결과를 캐싱한다. 같은 인자로 재호출 시 원본 함수를 실행하지 않는다.
 *
 * - TTL 만료된 항목은 다음 호출 시 자동 갱신된다
 * - 동일 키의 in-flight 요청은 하나의 Promise로 합산된다 (thundering herd 방지)
 * - maxSize 초과 시 가장 오래된 항목부터 제거한다 (FIFO)
 *
 * @example
 * const getUser = memoizeAsync(fetchUser, { ttl: 60_000 });
 * await getUser(1); // 네트워크 요청
 * await getUser(1); // 캐시에서 즉시 반환 (1분 내)
 * getUser.invalidate(1); // 특정 키 무효화
 * getUser.clear();       // 전체 캐시 초기화
 */
export function memoizeAsync<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: MemoizeAsyncOptions<TArgs> = {}
): ((...args: TArgs) => Promise<TReturn>) & {
  invalidate: (...args: TArgs) => void;
  clear: () => void;
} {
  const { ttl, maxSize, keyFn = (...args: TArgs) => JSON.stringify(args) } = options;

  const cache = new Map<string, CacheEntry<TReturn>>();
  const inFlight = new Map<string, Promise<TReturn>>();

  function isExpired(entry: CacheEntry<TReturn>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  function evictOldestIfNeeded(): void {
    if (maxSize !== undefined && cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }
  }

  const memoized = async (...args: TArgs): Promise<TReturn> => {
    const key = keyFn(...args);

    // 유효한 캐시 히트
    const cached = cache.get(key);
    if (cached && !isExpired(cached)) {
      return cached.value;
    }

    // 만료된 항목 제거
    if (cached) cache.delete(key);

    // In-flight 요청 합산 (thundering herd 방지)
    const existing = inFlight.get(key);
    if (existing) return existing;

    const promise = fn(...args).then(
      (value) => {
        evictOldestIfNeeded();
        cache.set(key, {
          value,
          expiresAt: ttl != null ? Date.now() + ttl : null,
        });
        inFlight.delete(key);
        return value;
      },
      (err) => {
        inFlight.delete(key);
        throw err;
      }
    );

    inFlight.set(key, promise);
    return promise;
  };

  memoized.invalidate = (...args: TArgs): void => {
    const key = keyFn(...args);
    cache.delete(key);
    inFlight.delete(key);
  };

  memoized.clear = (): void => {
    cache.clear();
    inFlight.clear();
  };

  return memoized;
}
