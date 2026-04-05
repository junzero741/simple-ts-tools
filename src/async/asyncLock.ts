// 비동기 뮤텍스 (Async Lock / Mutex).
//
// 기존 Semaphore(permits=1)와 달리, 이건 이름 기반 키별 잠금,
// tryLock(즉시 반환), withLock(자동 해제), deadlock 감지 타임아웃을 지원.
//
// const lock = createAsyncLock();
//
// await lock.acquire("user:42");
// try { await updateUser(42); }
// finally { lock.release("user:42"); }
//
// // withLock — 자동 해제
// await lock.withLock("order:99", async () => {
//   await processOrder(99);
// });
//
// // tryLock — 즉시 반환
// if (lock.tryLock("resource")) {
//   try { doWork(); }
//   finally { lock.release("resource"); }
// }

export interface AsyncLock {
  acquire(key?: string, timeout?: number): Promise<void>;
  release(key?: string): void;
  tryLock(key?: string): boolean;
  withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T>;
  isLocked(key?: string): boolean;
  readonly activeLocks: string[];
}

interface LockEntry {
  locked: boolean;
  queue: Array<{ resolve: () => void; reject: (err: Error) => void; timer?: ReturnType<typeof setTimeout> }>;
}

export function createAsyncLock(): AsyncLock {
  const locks = new Map<string, LockEntry>();

  function getEntry(key: string): LockEntry {
    let entry = locks.get(key);
    if (!entry) {
      entry = { locked: false, queue: [] };
      locks.set(key, entry);
    }
    return entry;
  }

  function cleanup(key: string): void {
    const entry = locks.get(key);
    if (entry && !entry.locked && entry.queue.length === 0) {
      locks.delete(key);
    }
  }

  const lock: AsyncLock = {
    acquire(key = "__default__", timeout?: number): Promise<void> {
      const entry = getEntry(key);

      if (!entry.locked) {
        entry.locked = true;
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const waiter: (typeof entry.queue)[number] = { resolve, reject };

        if (timeout !== undefined) {
          waiter.timer = setTimeout(() => {
            const idx = entry.queue.indexOf(waiter);
            if (idx !== -1) entry.queue.splice(idx, 1);
            cleanup(key);
            reject(new Error(`Lock acquire timeout for "${key}" after ${timeout}ms`));
          }, timeout);
        }

        entry.queue.push(waiter);
      });
    },

    release(key = "__default__"): void {
      const entry = locks.get(key);
      if (!entry) return;

      if (entry.queue.length > 0) {
        const next = entry.queue.shift()!;
        if (next.timer) clearTimeout(next.timer);
        next.resolve();
      } else {
        entry.locked = false;
        cleanup(key);
      }
    },

    tryLock(key = "__default__"): boolean {
      const entry = getEntry(key);
      if (entry.locked) return false;
      entry.locked = true;
      return true;
    },

    async withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T> {
      await lock.acquire(key);
      try {
        return await fn();
      } finally {
        lock.release(key);
      }
    },

    isLocked(key = "__default__"): boolean {
      const entry = locks.get(key);
      return entry?.locked ?? false;
    },

    get activeLocks(): string[] {
      const result: string[] = [];
      for (const [key, entry] of locks) {
        if (entry.locked) result.push(key);
      }
      return result;
    },
  };

  return lock;
}
