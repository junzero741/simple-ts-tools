/**
 * 비동기 리소스 풀 (Resource Pool).
 *
 * DB 커넥션, HTTP 클라이언트, 워커 등 생성 비용이 높은 리소스를
 * 재사용하기 위한 풀. 최소/최대 크기, idle timeout, 대기 큐를 지원한다.
 *
 * - `acquire()` — 유휴 리소스를 꺼내거나, 여유가 있으면 새로 생성.
 *   최대 수에 도달하면 반납될 때까지 대기한다.
 * - `release(resource)` — 리소스를 풀에 반납한다.
 * - `destroy(resource)` — 리소스를 파괴하고 풀에서 제거한다.
 * - `using(fn)` — acquire → fn 실행 → 자동 release (에러 시에도 보장).
 * - `drain()` — 모든 리소스를 파괴하고 풀을 닫는다.
 *
 * @example
 * const pool = createPool({
 *   create: () => createDbConnection(),
 *   destroy: (conn) => conn.close(),
 *   max: 10,
 *   min: 2,
 * });
 *
 * // 수동 acquire/release
 * const conn = await pool.acquire();
 * try {
 *   await conn.query("SELECT 1");
 * } finally {
 *   pool.release(conn);
 * }
 *
 * // using — 자동 release
 * const result = await pool.using((conn) => conn.query("SELECT 1"));
 *
 * // 종료
 * await pool.drain();
 *
 * @example
 * // idle timeout — 유휴 리소스 자동 정리
 * const pool = createPool({
 *   create: () => fetch("/api/token").then(r => r.json()),
 *   destroy: (token) => revokeToken(token),
 *   max: 5,
 *   idleTimeout: 30_000,  // 30초 미사용 시 자동 파괴
 * });
 *
 * @complexity
 * - acquire: O(1) 유휴 리소스 있을 때, O(n) 대기 시 (n = 대기자 수)
 * - release: O(1)
 */

export interface PoolOptions<T> {
  /** 새 리소스를 생성하는 팩토리 함수 */
  create: () => T | Promise<T>;

  /** 리소스를 파괴하는 함수 */
  destroy?: (resource: T) => void | Promise<void>;

  /** 리소스가 유효한지 검증하는 함수. false면 파괴 후 새로 생성한다. */
  validate?: (resource: T) => boolean | Promise<boolean>;

  /** 풀 최대 크기 (기본값: 10) */
  max?: number;

  /** 풀 최소 크기. 시작 시 이 수만큼 미리 생성한다 (기본값: 0) */
  min?: number;

  /** 유휴 리소스 자동 파괴까지의 시간 (ms). 미지정 시 무제한. */
  idleTimeout?: number;

  /** acquire 대기 최대 시간 (ms). 초과 시 에러. 미지정 시 무제한. */
  acquireTimeout?: number;
}

export interface Pool<T> {
  /** 풀에서 리소스를 꺼낸다. 없으면 생성하거나 대기한다. */
  acquire(): Promise<T>;

  /** 리소스를 풀에 반납한다. */
  release(resource: T): void;

  /** 리소스를 파괴하고 풀에서 제거한다. */
  destroy(resource: T): Promise<void>;

  /** acquire → fn 실행 → 자동 release. 에러 시에도 release를 보장한다. */
  using<R>(fn: (resource: T) => R | Promise<R>): Promise<R>;

  /** 모든 리소스를 파괴하고 풀을 닫는다. 이후 acquire는 에러를 던진다. */
  drain(): Promise<void>;

  /** 풀 통계 */
  readonly stats: PoolStats;
}

export interface PoolStats {
  /** 총 리소스 수 (사용 중 + 유휴) */
  total: number;
  /** 유휴 리소스 수 */
  idle: number;
  /** 사용 중인 리소스 수 */
  active: number;
  /** acquire 대기 중인 요청 수 */
  waiting: number;
}

interface IdleEntry<T> {
  resource: T;
  timer?: ReturnType<typeof setTimeout>;
}

export function createPool<T>(options: PoolOptions<T>): Pool<T> {
  const {
    create,
    destroy: destroyFn,
    validate,
    max = 10,
    min = 0,
    idleTimeout,
    acquireTimeout,
  } = options;

  if (max < 1) throw new Error("max must be at least 1");
  if (min < 0) throw new Error("min must be non-negative");
  if (min > max) throw new Error("min must not exceed max");

  const idleResources: IdleEntry<T>[] = [];
  const activeResources = new Set<T>();
  const waiters: Array<{
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    timer?: ReturnType<typeof setTimeout>;
  }> = [];
  let drained = false;

  function totalCount(): number {
    return idleResources.length + activeResources.size;
  }

  function setIdleTimer(entry: IdleEntry<T>): void {
    if (idleTimeout === undefined) return;
    entry.timer = setTimeout(() => {
      const idx = idleResources.indexOf(entry);
      if (idx === -1) return;
      if (totalCount() <= min) return;
      idleResources.splice(idx, 1);
      destroyResource(entry.resource);
    }, idleTimeout);
  }

  function clearIdleTimer(entry: IdleEntry<T>): void {
    if (entry.timer !== undefined) {
      clearTimeout(entry.timer);
      entry.timer = undefined;
    }
  }

  async function destroyResource(resource: T): Promise<void> {
    activeResources.delete(resource);
    if (destroyFn) await destroyFn(resource);
  }

  async function createResource(): Promise<T> {
    const resource = await create();
    activeResources.add(resource);
    return resource;
  }

  function takeIdle(): IdleEntry<T> | undefined {
    return idleResources.shift();
  }

  // 최소 리소스 사전 생성
  if (min > 0) {
    (async () => {
      for (let i = 0; i < min; i++) {
        if (drained) break;
        const resource = await create();
        const entry: IdleEntry<T> = { resource };
        setIdleTimer(entry);
        idleResources.push(entry);
      }
    })();
  }

  const pool: Pool<T> = {
    async acquire(): Promise<T> {
      if (drained) throw new Error("Cannot acquire from a drained pool");

      // 1. 유휴 리소스 사용 (동기로 꺼내서 microtask 순서 문제 방지)
      while (idleResources.length > 0) {
        const entry = takeIdle()!;
        clearIdleTimer(entry);

        if (validate) {
          const valid = await validate(entry.resource);
          if (!valid) {
            await destroyResource(entry.resource);
            continue;
          }
        }

        activeResources.add(entry.resource);
        return entry.resource;
      }

      // 2. 여유가 있으면 새로 생성
      if (totalCount() < max) {
        return createResource();
      }

      // 3. 최대 도달 — 대기
      return new Promise<T>((resolve, reject) => {
        const waiter: (typeof waiters)[number] = { resolve, reject };

        if (acquireTimeout !== undefined) {
          waiter.timer = setTimeout(() => {
            const idx = waiters.indexOf(waiter);
            if (idx !== -1) waiters.splice(idx, 1);
            reject(new Error(`Pool acquire timeout after ${acquireTimeout}ms`));
          }, acquireTimeout);
        }

        waiters.push(waiter);
      });
    },

    release(resource: T): void {
      if (!activeResources.has(resource)) return;
      activeResources.delete(resource);

      if (drained) {
        if (destroyFn) destroyFn(resource);
        return;
      }

      // 대기자가 있으면 직접 전달
      if (waiters.length > 0) {
        const waiter = waiters.shift()!;
        if (waiter.timer) clearTimeout(waiter.timer);
        activeResources.add(resource);
        waiter.resolve(resource);
        return;
      }

      // 유휴 풀에 반환
      const entry: IdleEntry<T> = { resource };
      setIdleTimer(entry);
      idleResources.push(entry);
    },

    async destroy(resource: T): Promise<void> {
      activeResources.delete(resource);
      if (destroyFn) await destroyFn(resource);

      // 대기자가 있으면 새 리소스를 생성해서 전달
      if (waiters.length > 0 && !drained) {
        try {
          const newResource = await createResource();
          const waiter = waiters.shift()!;
          if (waiter.timer) clearTimeout(waiter.timer);
          waiter.resolve(newResource);
        } catch (err) {
          const waiter = waiters.shift()!;
          if (waiter.timer) clearTimeout(waiter.timer);
          waiter.reject(err as Error);
        }
      }
    },

    async using<R>(fn: (resource: T) => R | Promise<R>): Promise<R> {
      const resource = await pool.acquire();
      try {
        return await fn(resource);
      } finally {
        pool.release(resource);
      }
    },

    async drain(): Promise<void> {
      drained = true;

      // 대기자 전부 reject
      while (waiters.length > 0) {
        const waiter = waiters.shift()!;
        if (waiter.timer) clearTimeout(waiter.timer);
        waiter.reject(new Error("Pool is draining"));
      }

      // 유휴 리소스 전부 파괴
      while (idleResources.length > 0) {
        const entry = idleResources.shift()!;
        clearIdleTimer(entry);
        if (destroyFn) await destroyFn(entry.resource);
      }

      // active 리소스는 release 시점에 파괴됨
    },

    get stats(): PoolStats {
      return {
        total: totalCount(),
        idle: idleResources.length,
        active: activeResources.size,
        waiting: waiters.length,
      };
    },
  };

  return pool;
}
