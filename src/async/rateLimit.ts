/**
 * 토큰 버킷(Token Bucket) 알고리즘 기반 속도 제한기.
 *
 * ## pLimit과의 차이
 * - `pLimit(n)` — **동시 실행 수** 제한 (한 번에 n개)
 * - `createRateLimiter` — **시간당 실행 수** 제한 (window ms 안에 limit개)
 *
 * ## 토큰 버킷 동작 방식
 * 1. 버킷은 `limit`개의 토큰으로 시작한다.
 * 2. 작업 실행 시 토큰 1개를 소비한다.
 * 3. 토큰이 없으면 다음 토큰이 보충될 때까지 대기한다.
 * 4. 토큰은 `window / limit` ms마다 1개씩 보충된다 (일정한 간격).
 * 5. 버킷은 최대 `limit`개까지만 보유한다 (burst cap).
 *
 * @example
 * // 초당 10회 호출 제한 (100ms마다 토큰 1개 보충)
 * const limiter = createRateLimiter({ limit: 10, window: 1000 });
 *
 * // API 클라이언트에서 rate limit 준수
 * async function fetchUser(id: string) {
 *   await limiter.acquire();          // 토큰 없으면 자동 대기
 *   return fetch(`/api/users/${id}`);
 * }
 *
 * // 병렬 실행과 조합 (pLimit + rateLimit)
 * const concurrency = pLimit(5);       // 동시 5개
 * const rate = createRateLimiter({ limit: 10, window: 1000 }); // 초당 10회
 *
 * await Promise.all(ids.map(id =>
 *   concurrency(() => rate.acquire().then(() => fetchUser(id)))
 * ));
 *
 * @complexity acquire: O(1) amortized | Space: O(queue size)
 */

export interface RateLimiterOptions {
  /** 시간 창(window) 내 최대 허용 횟수 */
  limit: number;
  /** 시간 창 크기 (ms) */
  window: number;
}

export interface RateLimiter {
  /**
   * 토큰을 소비하고 작업을 실행할 수 있을 때까지 대기한다.
   * 토큰이 있으면 즉시 resolve, 없으면 다음 토큰 보충 시점에 resolve된다.
   */
  acquire(): Promise<void>;

  /**
   * 토큰이 있으면 즉시 소비하고 `true`를 반환한다.
   * 토큰이 없으면 대기 없이 `false`를 반환한다 (non-blocking).
   */
  tryAcquire(): boolean;

  /** 현재 사용 가능한 토큰 수 */
  readonly tokens: number;

  /** 큐에서 대기 중인 요청 수 */
  readonly waiting: number;

  /**
   * 버킷을 초기 상태(토큰 가득 참)로 리셋하고 대기 중인 모든 요청을 처리한다.
   */
  reset(): void;
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, window: windowMs } = options;

  if (limit < 1 || !Number.isInteger(limit)) {
    throw new RangeError("limit must be a positive integer");
  }
  if (windowMs <= 0) {
    throw new RangeError("window must be a positive number");
  }

  // 토큰 보충 간격: window를 limit으로 나눈 값 (부드러운 분산)
  const refillInterval = windowMs / limit;

  let currentTokens = limit;
  let lastRefillTime = Date.now();
  let refillTimer: ReturnType<typeof setTimeout> | null = null;

  // 대기 중인 resolve 함수들의 큐
  const waitQueue: Array<() => void> = [];

  /** 경과 시간에 따라 토큰을 보충한다 */
  function refill(): void {
    const now = Date.now();
    const elapsed = now - lastRefillTime;
    const newTokens = Math.floor(elapsed / refillInterval);

    if (newTokens > 0) {
      currentTokens = Math.min(limit, currentTokens + newTokens);
      lastRefillTime += newTokens * refillInterval;
    }
  }

  /** 대기 큐에서 가능한 만큼 요청을 처리한다 */
  function drainQueue(): void {
    while (waitQueue.length > 0 && currentTokens > 0) {
      currentTokens--;
      const resolve = waitQueue.shift()!;
      resolve();
    }

    // 아직 대기 중인 요청이 있으면 다음 토큰 보충 시점에 drainQueue 예약
    if (waitQueue.length > 0 && refillTimer === null) {
      scheduleRefill();
    }
  }

  /** 다음 토큰 보충 시점에 drainQueue를 호출하도록 타이머 예약 */
  function scheduleRefill(): void {
    if (refillTimer !== null) return;

    const now = Date.now();
    const nextRefill = lastRefillTime + refillInterval - now;
    const delay = Math.max(0, nextRefill);

    refillTimer = setTimeout(() => {
      refillTimer = null;
      refill();
      drainQueue();
    }, delay);
  }

  const limiter: RateLimiter = {
    acquire(): Promise<void> {
      refill();

      if (currentTokens > 0) {
        currentTokens--;
        return Promise.resolve();
      }

      // 토큰 없음 → 큐에 등록하고 보충 대기
      return new Promise<void>(resolve => {
        waitQueue.push(resolve);
        scheduleRefill();
      });
    },

    tryAcquire(): boolean {
      refill();

      if (currentTokens > 0) {
        currentTokens--;
        return true;
      }
      return false;
    },

    get tokens(): number {
      refill();
      return currentTokens;
    },

    get waiting(): number {
      return waitQueue.length;
    },

    reset(): void {
      if (refillTimer !== null) {
        clearTimeout(refillTimer);
        refillTimer = null;
      }
      currentTokens = limit;
      lastRefillTime = Date.now();

      // 대기 중인 요청들을 즉시 처리
      drainQueue();
    },
  };

  return limiter;
}
