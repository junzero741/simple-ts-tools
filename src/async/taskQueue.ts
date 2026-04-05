// 지연 실행 태스크 큐 (Delayed Task Queue).
//
// === 예상 사용처 ===
// - 이메일 발송 지연 (회원가입 후 5분 뒤 환영 이메일)
// - 결제 취소 유예 (주문 후 30분 내 자동 취소)
// - 알림 디바운싱 (5초 내 동일 이벤트 묶어서 1회 알림)
// - 스케줄된 작업 실행 (특정 시각에 보고서 생성)
// - 임시 데이터 만료 (OTP 코드 3분 후 삭제)
// - rate limit 해제 예약 (ban 후 1시간 뒤 해제)
//
// const queue = createTaskQueue();
//
// queue.schedule("send-email", () => sendWelcomeEmail(userId), { delay: 300_000 });
// queue.schedule("cancel-order", () => cancelOrder(orderId), { delay: 1800_000 });
//
// queue.cancel("cancel-order");  // 사용자가 결제 완료 → 취소 예약 해제
// queue.pending;  // 1

export interface TaskQueueOptions {
  /** 동시 실행 제한 (기본: 무제한). */
  concurrency?: number;
}

export interface ScheduleOptions {
  /** 실행 지연 ms. */
  delay: number;
}

export interface TaskQueue {
  /** 지연 실행 태스크를 예약한다. */
  schedule(id: string, fn: () => void | Promise<void>, options: ScheduleOptions): void;

  /** 예약된 태스크를 취소한다. */
  cancel(id: string): boolean;

  /** 모든 예약을 취소한다. */
  cancelAll(): void;

  /** 태스크가 예약되어 있는지 확인한다. */
  has(id: string): boolean;

  /** 예약된 태스크 수. */
  readonly pending: number;

  /** 현재 실행 중인 태스크 수. */
  readonly running: number;

  /** 예약된 태스크 ID 목록. */
  readonly ids: string[];

  /** 태스크 완료/에러 구독. 해제 함수 반환. */
  onComplete(handler: (id: string, error?: Error) => void): () => void;
}

interface ScheduledTask {
  id: string;
  fn: () => void | Promise<void>;
  timer: ReturnType<typeof setTimeout>;
}

export function createTaskQueue(options: TaskQueueOptions = {}): TaskQueue {
  const { concurrency } = options;
  const tasks = new Map<string, ScheduledTask>();
  let activeCount = 0;
  const waitQueue: Array<{ id: string; fn: () => void | Promise<void> }> = [];
  const listeners = new Set<(id: string, error?: Error) => void>();

  function notify(id: string, error?: Error): void {
    for (const h of listeners) h(id, error);
  }

  async function execute(id: string, fn: () => void | Promise<void>): Promise<void> {
    activeCount++;
    tasks.delete(id);
    try {
      await fn();
      notify(id);
    } catch (err) {
      notify(id, err as Error);
    } finally {
      activeCount--;
      tryDequeue();
    }
  }

  function tryDequeue(): void {
    while (waitQueue.length > 0 && (concurrency === undefined || activeCount < concurrency)) {
      const next = waitQueue.shift()!;
      execute(next.id, next.fn);
    }
  }

  function scheduleExecution(id: string, fn: () => void | Promise<void>): void {
    if (concurrency !== undefined && activeCount >= concurrency) {
      waitQueue.push({ id, fn });
    } else {
      execute(id, fn);
    }
  }

  const queue: TaskQueue = {
    schedule(id, fn, options) {
      if (tasks.has(id)) {
        clearTimeout(tasks.get(id)!.timer);
      }

      const timer = setTimeout(() => {
        scheduleExecution(id, fn);
      }, options.delay);

      tasks.set(id, { id, fn, timer });
    },

    cancel(id) {
      const task = tasks.get(id);
      if (!task) return false;
      clearTimeout(task.timer);
      tasks.delete(id);
      return true;
    },

    cancelAll() {
      for (const task of tasks.values()) {
        clearTimeout(task.timer);
      }
      tasks.clear();
      waitQueue.length = 0;
    },

    has(id) { return tasks.has(id); },

    get pending() { return tasks.size; },
    get running() { return activeCount; },
    get ids() { return [...tasks.keys()]; },

    onComplete(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };

  return queue;
}
