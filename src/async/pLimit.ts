/**
 * 동시에 실행할 비동기 작업 수를 제한하는 concurrency limiter를 반환한다.
 *
 * 반환된 `limit` 함수는 주어진 작업을 큐에 넣고, 현재 실행 중인 작업이
 * `concurrency` 미만일 때 즉시 실행한다. 초과하면 완료된 슬롯이 생길 때까지 대기한다.
 *
 * - `limit.activeCount` — 현재 실행 중인 작업 수
 * - `limit.pendingCount` — 큐에서 대기 중인 작업 수
 * - `limit.clearQueue()` — 대기 중인 작업을 모두 취소 (실행 중인 작업은 그대로)
 *
 * @param concurrency 동시에 실행 가능한 최대 작업 수 (1 이상의 정수)
 *
 * @example
 * // API 호출을 최대 3개씩 병렬로 처리
 * const limit = pLimit(3);
 * const results = await Promise.all(
 *   urls.map(url => limit(() => fetch(url).then(r => r.json())))
 * );
 *
 * // 파일 처리 — 한 번에 5개씩만 열기
 * const limit = pLimit(5);
 * await Promise.all(files.map(f => limit(() => processFile(f))));
 *
 * // 진행 상황 모니터링
 * const limit = pLimit(2);
 * console.log(limit.activeCount);  // 현재 실행 중
 * console.log(limit.pendingCount); // 대기 중
 *
 * @complexity Time: O(1) per enqueue | Space: O(pending)
 */

type Task<T> = () => Promise<T>;

export interface Limiter {
  <T>(task: Task<T>): Promise<T>;
  readonly activeCount: number;
  readonly pendingCount: number;
  clearQueue(): void;
}

export function pLimit(concurrency: number): Limiter {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new RangeError("concurrency must be a positive integer");
  }

  let active = 0;
  const queue: Array<() => void> = [];

  function next() {
    if (active >= concurrency || queue.length === 0) return;
    const run = queue.shift()!;
    active++;
    run();
  }

  function limit<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(() => {
        Promise.resolve()
          .then(() => task())
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });
  }

  Object.defineProperties(limit, {
    activeCount: { get: () => active, enumerable: true },
    pendingCount: { get: () => queue.length, enumerable: true },
    clearQueue: {
      value: () => { queue.length = 0; },
      enumerable: true,
    },
  });

  return limit as Limiter;
}
