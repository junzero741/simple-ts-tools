// 고급 메모이제이션 캐시 (Memo Cache).
//
// 기존 memoize가 단순 Map 캐시라면, 이건 TTL(만료),
// maxSize(LRU 퇴거), stale-while-revalidate, 통계를 지원.
//
// const cache = createMemoCache<[string], User>({
//   fn: (id) => fetchUser(id),
//   ttl: 60_000,
//   maxSize: 100,
//   staleWhileRevalidate: true,
// });
//
// await cache.get("user-1");  // 캐시 미스 → fetchUser 실행
// await cache.get("user-1");  // 캐시 히트
// cache.stats;  // { hits: 1, misses: 1, size: 1 }

export interface MemoCacheOptions<TArgs extends unknown[], TResult> {
  fn: (...args: TArgs) => TResult | Promise<TResult>;
  key?: (...args: TArgs) => string;
  ttl?: number;
  maxSize?: number;
  staleWhileRevalidate?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleHits: number;
  size: number;
}

export interface MemoCache<TArgs extends unknown[], TResult> {
  get(...args: TArgs): Promise<TResult>;
  invalidate(...args: TArgs): void;
  invalidateAll(): void;
  has(...args: TArgs): boolean;
  readonly stats: CacheStats;
}

interface CacheEntry<T> {
  value: T;
  expireAt: number | undefined;
  key: string;
}

export function createMemoCache<TArgs extends unknown[], TResult>(
  options: MemoCacheOptions<TArgs, TResult>,
): MemoCache<TArgs, TResult> {
  const {
    fn,
    key: keyFn = (...args: TArgs) => JSON.stringify(args),
    ttl,
    maxSize,
    staleWhileRevalidate = false,
  } = options;

  const store = new Map<string, CacheEntry<TResult>>();
  const accessOrder: string[] = [];
  let hits = 0;
  let misses = 0;
  let staleHits = 0;

  function isExpired(entry: CacheEntry<TResult>): boolean {
    if (entry.expireAt === undefined) return false;
    return Date.now() > entry.expireAt;
  }

  function touchAccess(k: string): void {
    const idx = accessOrder.indexOf(k);
    if (idx !== -1) accessOrder.splice(idx, 1);
    accessOrder.push(k);
  }

  function evictIfNeeded(): void {
    if (maxSize === undefined) return;
    while (store.size > maxSize && accessOrder.length > 0) {
      const oldest = accessOrder.shift()!;
      store.delete(oldest);
    }
  }

  async function revalidate(k: string, args: TArgs): Promise<TResult> {
    const result = await fn(...args);
    store.set(k, {
      value: result,
      expireAt: ttl !== undefined ? Date.now() + ttl : undefined,
      key: k,
    });
    touchAccess(k);
    evictIfNeeded();
    return result;
  }

  const cache: MemoCache<TArgs, TResult> = {
    async get(...args: TArgs): Promise<TResult> {
      const k = keyFn(...args);
      const entry = store.get(k);

      if (entry) {
        if (!isExpired(entry)) {
          hits++;
          touchAccess(k);
          return entry.value;
        }

        // stale
        if (staleWhileRevalidate) {
          staleHits++;
          // 백그라운드 revalidate
          revalidate(k, args);
          return entry.value;
        }
      }

      misses++;
      return revalidate(k, args);
    },

    invalidate(...args: TArgs): void {
      const k = keyFn(...args);
      store.delete(k);
      const idx = accessOrder.indexOf(k);
      if (idx !== -1) accessOrder.splice(idx, 1);
    },

    invalidateAll(): void {
      store.clear();
      accessOrder.length = 0;
    },

    has(...args: TArgs): boolean {
      const k = keyFn(...args);
      const entry = store.get(k);
      return entry !== undefined && !isExpired(entry);
    },

    get stats(): CacheStats {
      return { hits, misses, staleHits, size: store.size };
    },
  };

  return cache;
}
