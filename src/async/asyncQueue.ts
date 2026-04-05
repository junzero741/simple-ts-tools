/**
 * 비동기 producer/consumer 큐 (AsyncQueue).
 *
 * - `push(item)` — 항목 추가. 용량이 가득 찼으면 여유가 생길 때까지 await.
 * - `pop()` — 항목 꺼내기. 비어있으면 항목이 들어올 때까지 await.
 * - `for await (const item of queue)` — 큐가 닫힐 때까지 자동으로 소비.
 * - `close()` — 생산 종료 선언. 남은 항목은 소비 가능하다.
 *
 * ## pLimit / mapAsync와의 차이
 * - `pLimit` — 동시 실행 수 제한 (concurrency gate)
 * - `mapAsync` — 배열을 한 번에 병렬 처리
 * - `AsyncQueue` — 두 비동기 컨텍스트를 연결. 생산/소비 속도가 다를 때
 *   backpressure와 버퍼링을 자동 처리한다.
 *
 * @example
 * // 워커 패턴 — producer와 consumer를 독립적으로 실행
 * const queue = createAsyncQueue<Buffer>({ capacity: 10 });
 *
 * // Producer
 * (async () => {
 *   for (const chunk of readChunks()) {
 *     await queue.push(chunk);  // 10개 초과 시 자동 대기 (backpressure)
 *   }
 *   queue.close();
 * })();
 *
 * // Consumer
 * for await (const chunk of queue) {
 *   await processChunk(chunk);
 * }
 *
 * @example
 * // 멀티 consumer — 여러 워커가 동일 큐를 경쟁 소비
 * const queue = createAsyncQueue<Job>();
 * const workers = Array.from({ length: 4 }, () =>
 *   (async () => { for await (const job of queue) await processJob(job); })()
 * );
 * await Promise.all(workers);
 */

export interface AsyncQueueOptions {
  /**
   * 버퍼 최대 크기. 초과 시 push()가 소비될 때까지 대기한다.
   * 미지정 시 무제한 (backpressure 없음).
   */
  capacity?: number;
}

export interface AsyncQueue<T> {
  /**
   * 항목을 큐에 추가한다.
   * 용량이 가득 찼으면 consumer가 항목을 꺼낼 때까지 대기한다.
   * 닫힌 큐에 push하면 에러를 던진다.
   */
  push(item: T): Promise<void>;

  /**
   * 큐에서 항목을 꺼낸다.
   * 비어있으면 항목이 추가될 때까지 대기한다.
   * 큐가 닫히고 비어있으면 `undefined`를 반환한다.
   */
  pop(): Promise<T | undefined>;

  /**
   * 생산 종료를 선언한다. 이미 들어온 항목은 소비 가능하다.
   * 중복 호출은 무시된다.
   */
  close(): void;

  /** 큐가 닫혔는지 여부 */
  readonly closed: boolean;

  /** 현재 버퍼에 있는 항목 수 */
  readonly size: number;

  /** 비동기 이터레이터. 큐가 닫히고 비어있으면 자동 종료. */
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

export function createAsyncQueue<T>(options: AsyncQueueOptions = {}): AsyncQueue<T> {
  const { capacity } = options;

  const buffer: T[] = [];
  let isClosed = false;
  const popWaiters: Array<(value: T | undefined) => void> = [];
  const pushWaiters: Array<() => void> = [];

  function drainPushWaiters(): void {
    while (
      pushWaiters.length > 0 &&
      (capacity === undefined || buffer.length < capacity)
    ) {
      pushWaiters.shift()!();
    }
  }

  function drainPopWaiters(): void {
    while (popWaiters.length > 0 && buffer.length > 0) {
      const item = buffer.shift()!;
      popWaiters.shift()!(item);
      drainPushWaiters();
    }
    if (isClosed && buffer.length === 0) {
      while (popWaiters.length > 0) {
        popWaiters.shift()!(undefined);
      }
    }
  }

  const queue: AsyncQueue<T> = {
    async push(item: T): Promise<void> {
      if (isClosed) throw new Error("Cannot push to a closed AsyncQueue");

      // pop 대기자가 있으면 버퍼를 거치지 않고 직접 전달
      if (popWaiters.length > 0) {
        popWaiters.shift()!(item);
        return;
      }

      // 용량 초과 시 여유가 생길 때까지 대기
      if (capacity !== undefined && buffer.length >= capacity) {
        await new Promise<void>((resolve) => { pushWaiters.push(resolve); });
      }

      buffer.push(item);
    },

    pop(): Promise<T | undefined> {
      if (buffer.length > 0) {
        const item = buffer.shift()!;
        drainPushWaiters();
        return Promise.resolve(item);
      }
      if (isClosed) return Promise.resolve(undefined);
      return new Promise<T | undefined>((resolve) => { popWaiters.push(resolve); });
    },

    close(): void {
      if (isClosed) return;
      isClosed = true;
      drainPopWaiters();
    },

    get closed(): boolean { return isClosed; },
    get size(): number { return buffer.length; },

    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        async next(): Promise<IteratorResult<T>> {
          const item = await queue.pop();
          if (item === undefined) {
            return { value: undefined as unknown as T, done: true };
          }
          return { value: item, done: false };
        },
      };
    },
  };

  return queue;
}
