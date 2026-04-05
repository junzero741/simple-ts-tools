// 동기 객체 재사용 풀 (Object Pool).
//
// 빈번한 생성/파괴 시 GC 압박을 줄이기 위해 객체를 재활용한다.
// 게임 루프(벡터, 파티클), 이벤트 객체, DOM 노드 풀,
// 파서 토큰 등 수명이 짧고 고빈도로 생성되는 객체에 최적.
//
// const pool = createObjectPool(
//   () => ({ x: 0, y: 0, active: false }),   // create
//   (obj) => { obj.x = 0; obj.y = 0; obj.active = false; }, // reset
//   { max: 1000 },
// );
//
// const v = pool.acquire();  // 풀에서 꺼내거나 새로 생성
// v.x = 100; v.y = 200;
// pool.release(v);           // 풀에 반환 (reset 후 재사용 대기)

export interface ObjectPoolOptions {
  /** 풀 최대 크기. 초과 시 release된 객체는 버린다. */
  max?: number;
  /** 시작 시 미리 생성할 객체 수. */
  prewarm?: number;
}

export interface ObjectPool<T> {
  /** 풀에서 객체를 꺼낸다. 없으면 새로 생성. */
  acquire(): T;

  /** 객체를 풀에 반환한다. reset 후 재사용 대기. */
  release(obj: T): void;

  /** 여러 객체를 한 번에 반환한다. */
  releaseAll(objs: T[]): void;

  /** 풀의 모든 유휴 객체를 제거한다. */
  drain(): void;

  /** 유휴 객체 수. */
  readonly available: number;

  /** 지금까지 생성된 총 객체 수. */
  readonly created: number;

  /** 현재 사용 중인 객체 수 (acquire - release). */
  readonly inUse: number;
}

export function createObjectPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  options: ObjectPoolOptions = {},
): ObjectPool<T> {
  const { max = Infinity, prewarm = 0 } = options;

  const free: T[] = [];
  let totalCreated = 0;
  let activeCount = 0;

  // prewarm
  for (let i = 0; i < prewarm; i++) {
    free.push(factory());
    totalCreated++;
  }

  const pool: ObjectPool<T> = {
    acquire(): T {
      activeCount++;
      if (free.length > 0) {
        return free.pop()!;
      }
      totalCreated++;
      return factory();
    },

    release(obj: T): void {
      activeCount = Math.max(0, activeCount - 1);
      reset(obj);
      if (free.length < max) {
        free.push(obj);
      }
      // max 초과 시 그냥 버림 (GC에 맡김)
    },

    releaseAll(objs: T[]): void {
      for (const obj of objs) pool.release(obj);
    },

    drain(): void {
      free.length = 0;
    },

    get available() { return free.length; },
    get created() { return totalCreated; },
    get inUse() { return activeCount; },
  };

  return pool;
}
