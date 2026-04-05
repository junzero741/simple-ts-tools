export interface BatchOptions {
  /**
   * 한 번에 처리할 최대 키 수. 초과하면 즉시 플러시.
   * @default 100
   */
  maxSize?: number;
  /**
   * 키를 수집할 최대 대기 시간(ms). 0이면 같은 틱의 마이크로태스크에서 플러시.
   * @default 0
   */
  maxWait?: number;
}

export interface Batcher<K, V> {
  /**
   * 단일 키를 배치에 추가하고, 해당 값의 Promise를 반환한다.
   * 같은 틱(또는 maxWait 이내)에 쌓인 모든 키는 한 번의 배치 함수 호출로 처리된다.
   */
  load(key: K): Promise<V>;
  /**
   * 현재 대기 중인 배치를 즉시 플러시한다.
   * 보통 직접 호출할 필요 없다.
   */
  flush(): void;
}

/**
 * DataLoader 패턴 — 개별 비동기 조회를 자동으로 배치 처리한다.
 *
 * 같은 틱에서 발생한 `load(key)` 호출들을 모아 batchFn에 한 번에 전달한다.
 * batchFn은 반드시 **입력 keys 배열과 동일한 길이·순서**의 결과 배열을 반환해야 한다.
 *
 * @example
 * // N+1 쿼리 → 단일 배치 쿼리
 * const userLoader = createBatch(async (ids: number[]) => {
 *   const users = await db.users.findMany({ where: { id: { in: ids } } });
 *   return ids.map(id => users.find(u => u.id === id) ?? null);
 * });
 *
 * // 각각 호출하지만 실제 DB 조회는 한 번만 발생
 * const [alice, bob] = await Promise.all([
 *   userLoader.load(1),
 *   userLoader.load(2),
 * ]);
 *
 * // API rate limit 대응 — 50개씩 묶어서 요청
 * const priceLoader = createBatch(
 *   async (symbols: string[]) => fetchPrices(symbols),
 *   { maxSize: 50 }
 * );
 *
 * @param batchFn keys 배열을 받아 동일 길이·순서의 결과(또는 Error)를 반환하는 함수
 * @param options 배치 동작 옵션
 * @complexity batchFn 호출 횟수: O(n / maxSize), 전체 처리: O(n)
 */
export function createBatch<K, V>(
  batchFn: (keys: K[]) => Promise<(V | Error)[]>,
  options: BatchOptions = {}
): Batcher<K, V> {
  const { maxSize = 100, maxWait = 0 } = options;

  type Entry = {
    key: K;
    resolve: (value: V) => void;
    reject: (reason: unknown) => void;
  };

  let queue: Entry[] = [];
  let scheduled = false;

  function flush() {
    if (queue.length === 0) return;

    const batch = queue;
    queue = [];
    scheduled = false;

    const keys = batch.map((e) => e.key);

    batchFn(keys).then(
      (results) => {
        if (results.length !== batch.length) {
          const err = new Error(
            `batchFn returned ${results.length} results for ${batch.length} keys. ` +
            "Results must have the same length and order as keys."
          );
          for (const entry of batch) entry.reject(err);
          return;
        }
        for (let i = 0; i < batch.length; i++) {
          const result = results[i];
          if (result instanceof Error) {
            batch[i].reject(result);
          } else {
            batch[i].resolve(result);
          }
        }
      },
      (err) => {
        // batchFn 자체가 reject된 경우 — 모든 대기자에게 전파
        for (const entry of batch) entry.reject(err);
      }
    );
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    if (maxWait === 0) {
      Promise.resolve().then(flush);
    } else {
      setTimeout(flush, maxWait);
    }
  }

  function load(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      queue.push({ key, resolve, reject });
      if (queue.length >= maxSize) {
        flush();
      } else {
        schedule();
      }
    });
  }

  return { load, flush };
}
