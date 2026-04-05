// 우선순위 비동기 태스크 스케줄러 (Priority Task Scheduler).
//
// 우선순위 큐 + 동시성 제한 + 취소(AbortSignal) + 재시도를 지원.
// 기존 pLimit은 단순 동시성 게이트, createTaskRunner는 DAG 의존성.
// 이건 우선순위가 높은 태스크를 먼저 실행하는 작업 큐.
//
// const scheduler = createPriorityScheduler({ concurrency: 3 });
//
// scheduler.schedule(() => fetchData(), { priority: 1 });
// scheduler.schedule(() => processImage(), { priority: 10 }); // 먼저 실행
// scheduler.schedule(() => sendEmail(), { priority: 5 });
//
// await scheduler.drain(); // 모든 태스크 완료 대기

export interface ScheduleOptions {
  priority?: number;
  signal?: AbortSignal;
  retries?: number;
  retryDelay?: number;
}

export interface ScheduledJob<T> {
  readonly promise: Promise<T>;
  readonly id: number;
  cancel(reason?: string): void;
}

export interface PriorityScheduler {
  schedule<T>(
    fn: (signal: AbortSignal) => T | Promise<T>,
    options?: ScheduleOptions,
  ): ScheduledJob<T>;

  drain(): Promise<void>;
  pause(): void;
  resume(): void;

  readonly pending: number;
  readonly running: number;
  readonly paused: boolean;
}

interface QueueEntry {
  id: number;
  priority: number;
  fn: (signal: AbortSignal) => unknown;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  controller: AbortController;
  retries: number;
  retryDelay: number;
}

export function createPriorityScheduler(options: {
  concurrency?: number;
} = {}): PriorityScheduler {
  const { concurrency = 4 } = options;

  const queue: QueueEntry[] = [];
  let activeCount = 0;
  let isPaused = false;
  let idCounter = 0;
  let drainResolve: (() => void) | null = null;

  function sortQueue(): void {
    queue.sort((a, b) => b.priority - a.priority);
  }

  function tryRun(): void {
    if (isPaused) return;

    while (activeCount < concurrency && queue.length > 0) {
      const entry = queue.shift()!;

      if (entry.controller.signal.aborted) {
        entry.reject(entry.controller.signal.reason ?? new Error("Cancelled"));
        continue;
      }

      activeCount++;
      runEntry(entry);
    }
  }

  async function runEntry(entry: QueueEntry, attempt: number = 0): Promise<void> {
    try {
      const result = await entry.fn(entry.controller.signal);
      if (!entry.controller.signal.aborted) {
        entry.resolve(result);
      } else {
        entry.reject(entry.controller.signal.reason ?? new Error("Cancelled"));
      }
    } catch (err) {
      if (entry.controller.signal.aborted) {
        entry.reject(entry.controller.signal.reason ?? new Error("Cancelled"));
      } else if (attempt < entry.retries) {
        await new Promise((r) => setTimeout(r, entry.retryDelay));
        if (!entry.controller.signal.aborted) {
          await runEntry(entry, attempt + 1);
          return;
        }
        entry.reject(err);
      } else {
        entry.reject(err);
      }
    } finally {
      activeCount--;
      tryRun();
      if (activeCount === 0 && queue.length === 0 && drainResolve) {
        drainResolve();
        drainResolve = null;
      }
    }
  }

  const scheduler: PriorityScheduler = {
    schedule<T>(
      fn: (signal: AbortSignal) => T | Promise<T>,
      opts: ScheduleOptions = {},
    ): ScheduledJob<T> {
      const {
        priority = 0,
        signal: externalSignal,
        retries = 0,
        retryDelay = 0,
      } = opts;

      const id = ++idCounter;
      const controller = new AbortController();

      if (externalSignal) {
        if (externalSignal.aborted) {
          controller.abort(externalSignal.reason);
        } else {
          externalSignal.addEventListener(
            "abort",
            () => controller.abort(externalSignal.reason),
            { once: true },
          );
        }
      }

      let resolve!: (value: unknown) => void;
      let reject!: (error: unknown) => void;

      const promise = new Promise<T>((res, rej) => {
        resolve = res as (value: unknown) => void;
        reject = rej;
      });

      const entry: QueueEntry = {
        id,
        priority,
        fn: fn as (signal: AbortSignal) => unknown,
        resolve,
        reject,
        controller,
        retries,
        retryDelay,
      };

      queue.push(entry);
      sortQueue();
      tryRun();

      return {
        promise,
        id,
        cancel(reason?: string) {
          controller.abort(reason ?? "Cancelled");
        },
      };
    },

    drain(): Promise<void> {
      if (activeCount === 0 && queue.length === 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        drainResolve = resolve;
      });
    },

    pause() {
      isPaused = true;
    },

    resume() {
      isPaused = false;
      tryRun();
    },

    get pending() { return queue.length; },
    get running() { return activeCount; },
    get paused() { return isPaused; },
  };

  return scheduler;
}
