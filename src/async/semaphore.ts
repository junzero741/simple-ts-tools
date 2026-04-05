/**
 * 비동기 카운팅 세마포어 (Counting Semaphore).
 *
 * pLimit과 달리 acquire/release를 수동으로 호출하여
 * 임의 코드 구간의 동시 접근 수를 제한한다.
 *
 * - `acquire()` — 슬롯을 획득한다. 여유가 없으면 대기.
 * - `release()` — 슬롯을 반납한다.
 * - `using(fn)` — acquire → fn → 자동 release.
 *
 * ## pLimit과의 차이
 * - `pLimit` — 함수 단위. `limit(fn)`으로 감싸서 실행.
 * - `Semaphore` — 구간 단위. acquire/release 사이의 모든 코드에 적용.
 *   여러 리소스를 동시에 잠그거나, 조건부 release가 필요할 때 적합하다.
 *
 * @example
 * const sem = createSemaphore(3); // 동시 3개까지
 *
 * async function worker(id: number) {
 *   await sem.acquire();
 *   try {
 *     await doWork(id);
 *   } finally {
 *     sem.release();
 *   }
 * }
 *
 * // 10개 워커 중 3개만 동시 실행
 * await Promise.all(Array.from({ length: 10 }, (_, i) => worker(i)));
 *
 * @example
 * // using — 자동 release
 * const result = await sem.using(() => fetchData());
 *
 * @complexity Time: O(1) acquire/release. Space: O(n) 대기 큐 (n = 대기자 수).
 */

export interface Semaphore {
  /** 슬롯을 획득한다. 여유가 없으면 대기한다. */
  acquire(): Promise<void>;

  /** 슬롯을 반납한다. 대기자가 있으면 깨운다. */
  release(): void;

  /** acquire → fn → 자동 release. 에러 시에도 release를 보장한다. */
  using<T>(fn: () => T | Promise<T>): Promise<T>;

  /** 현재 사용 가능한 슬롯 수 */
  readonly available: number;

  /** 대기 중인 요청 수 */
  readonly waiting: number;
}

export function createSemaphore(permits: number): Semaphore {
  if (permits < 1) throw new Error("permits must be at least 1");

  let current = permits;
  const queue: Array<() => void> = [];

  const semaphore: Semaphore = {
    acquire(): Promise<void> {
      if (current > 0) {
        current--;
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        queue.push(resolve);
      });
    },

    release(): void {
      if (queue.length > 0) {
        const next = queue.shift()!;
        next();
      } else {
        current++;
        if (current > permits) {
          current = permits;
        }
      }
    },

    async using<T>(fn: () => T | Promise<T>): Promise<T> {
      await semaphore.acquire();
      try {
        return await fn();
      } finally {
        semaphore.release();
      }
    },

    get available(): number {
      return current;
    },

    get waiting(): number {
      return queue.length;
    },
  };

  return semaphore;
}
