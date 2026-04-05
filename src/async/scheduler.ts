/**
 * 주기적 작업 스케줄러.
 *
 * `setInterval`의 세 가지 문제를 해결한다.
 * 1. **Drift** — 각 실행 시작 시점을 기준으로 다음 타이머를 걸어 drift 방지
 * 2. **중복 실행** — `exclusive: true`(기본값)로 이전 실행이 끝나지 않으면 다음 실행 건너뜀
 * 3. **에러 무시** — `onError` 콜백으로 에러를 처리하되 스케줄러는 계속 동작
 *
 * ## poll / retry와의 차이
 * - `poll`    — 조건을 충족할 때까지 반복 (일회성, 완료 후 종료)
 * - `retry`   — 실패 시 재시도 (일회성, 성공 또는 최대 시도 후 종료)
 * - `scheduler` — 중단 명령 전까지 **영구적으로 반복** (주기적 백그라운드 작업)
 *
 * @example
 * const scheduler = createScheduler();
 *
 * // DB 정리 작업 — 5분마다, 이전 실행이 끝나야 다음 실행
 * scheduler.every(5 * 60_000, () => db.cleanup(), { id: "db-cleanup" });
 *
 * // 헬스 체크 — 30초마다, 시작 즉시 한 번 실행
 * scheduler.every(30_000, checkHealth, {
 *   id: "health-check",
 *   runImmediately: true,
 *   onError: (err) => logger.error("헬스 체크 실패", {}, err),
 * });
 *
 * // 개별 작업 제어
 * const task = scheduler.every(1000, tick);
 * task.stop();           // 일시 중지
 * task.start();          // 재개
 * await task.run();      // 즉시 한 번 실행
 *
 * // 전체 종료
 * scheduler.stopAll();
 */

export interface TaskOptions {
  /**
   * 작업 식별자. 미지정 시 자동 생성.
   */
  id?: string;

  /**
   * `true`이면 이전 실행이 끝나지 않은 상태에서 다음 실행 시점이 되면 건너뛴다.
   * `false`이면 이전 실행과 상관없이 새 실행을 시작한다 (동시 실행 허용).
   * @default true
   */
  exclusive?: boolean;

  /**
   * `true`이면 `every()` 등록 직후 즉시 한 번 실행한다.
   * @default false
   */
  runImmediately?: boolean;

  /**
   * 실행 중 에러가 발생했을 때 호출되는 콜백.
   * 콜백이 없으면 에러를 조용히 무시한다 (스케줄러는 계속 동작).
   */
  onError?: (error: unknown, taskId: string) => void;
}

export interface ScheduledTask {
  /** 작업 식별자 */
  readonly id: string;
  /** 현재 스케줄이 활성화되어 있는지 (타이머가 걸려 있는지) */
  readonly isScheduled: boolean;
  /** 직전 실행 완료 시각 */
  readonly lastRunAt: Date | null;
  /** 직전 실행에서 발생한 에러 */
  readonly lastError: unknown;
  /** 총 실행 횟수 */
  readonly runCount: number;
  /** 현재 실행 중인 작업이 있는지 */
  readonly isRunning: boolean;

  /** 스케줄을 시작(재개)한다. */
  start(): void;
  /** 스케줄을 중단한다. 실행 중인 작업은 완료될 때까지 기다린다. */
  stop(): void;
  /** 스케줄과 무관하게 즉시 한 번 실행한다. */
  run(): Promise<void>;
}

export interface Scheduler {
  /**
   * `fn`을 `intervalMs` 간격으로 반복 실행하는 작업을 등록한다.
   * 간격은 실행 **완료 후** 측정된다 (drift 방지).
   */
  every(intervalMs: number, fn: () => unknown, options?: TaskOptions): ScheduledTask;

  /** 등록된 모든 작업의 스케줄을 중단한다. */
  stopAll(): void;

  /** 중단된 모든 작업의 스케줄을 재개한다. */
  startAll(): void;

  /** 등록된 모든 작업 목록 */
  readonly tasks: ReadonlyMap<string, ScheduledTask>;
}

let taskCounter = 0;

export function createScheduler(): Scheduler {
  const taskMap = new Map<string, ScheduledTask>();

  const scheduler: Scheduler = {
    every(intervalMs: number, fn: () => unknown, options: TaskOptions = {}): ScheduledTask {
      if (intervalMs <= 0) {
        throw new RangeError("intervalMs must be positive");
      }

      const id = options.id ?? `task-${++taskCounter}`;
      const exclusive = options.exclusive ?? true;
      const onError = options.onError;

      let timerId: ReturnType<typeof setTimeout> | null = null;
      let active = false;   // 계속 스케줄링해야 하는지 여부
      let running = false;
      let lastRunAt: Date | null = null;
      let lastError: unknown = null;
      let runCount = 0;

      async function execute(): Promise<void> {
        if (exclusive && running) return;

        running = true;
        try {
          await fn();
          lastRunAt = new Date();
          runCount++;
          lastError = null;
        } catch (err) {
          lastError = err;
          runCount++;
          lastRunAt = new Date();
          onError?.(err, id);
        } finally {
          running = false;
        }
      }

      function scheduleNext(): void {
        if (!active || timerId !== null) return;
        timerId = setTimeout(async () => {
          timerId = null;
          if (exclusive) {
            // exclusive: 실행 완료 후 다음 타이머 등록 (drift-free, 중복 실행 없음)
            await execute();
            scheduleNext();
          } else {
            // non-exclusive: 실행과 무관하게 즉시 다음 타이머 예약 (동시 실행 허용)
            scheduleNext();
            execute().catch(() => {});
          }
        }, intervalMs);
      }

      const task: ScheduledTask = {
        get id() { return id; },
        get isScheduled() { return active; },
        get lastRunAt() { return lastRunAt; },
        get lastError() { return lastError; },
        get runCount() { return runCount; },
        get isRunning() { return running; },

        start(): void {
          if (active) return; // 이미 활성화 중
          active = true;
          scheduleNext();
        },

        stop(): void {
          active = false;
          if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
          }
        },

        async run(): Promise<void> {
          await execute();
        },
      };

      taskMap.set(id, task);
      task.start();

      if (options.runImmediately) {
        // 비동기 즉시 실행 (타이머와 독립)
        execute().catch(() => {});
      }

      return task;
    },

    stopAll(): void {
      for (const task of taskMap.values()) {
        task.stop();
      }
    },

    startAll(): void {
      for (const task of taskMap.values()) {
        task.start();
      }
    },

    get tasks(): ReadonlyMap<string, ScheduledTask> {
      return taskMap;
    },
  };

  return scheduler;
}
