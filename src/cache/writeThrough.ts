// Write-Through / Write-Behind 캐시 전략 (Cache Strategy).
//
// === 예상 사용처 ===
// - DB 앞단 캐시 — 읽기는 캐시 우선, 쓰기는 캐시+DB 동시 반영
// - API 응답 캐시 — 첫 요청만 실제 fetch, 이후 캐시 반환
// - 사용자 세션/프로필 캐시 — 변경 시 캐시와 저장소 동기화
// - 설정값 캐시 — 원본(파일/환경변수) 변경 시 캐시 자동 갱신
// - Write-behind: 잦은 쓰기를 모아서 배치로 DB 반영 (카운터, 조회수)
// - Read-through + TTL: 캐시 만료 시 원본에서 자동 로드
//
// const cache = createCacheStrategy<string, User>({
//   load: (id) => db.findUser(id),          // cache miss 시 원본 로드
//   save: (id, user) => db.updateUser(user), // 쓰기 시 원본 반영
//   ttl: 60_000,
// });
//
// await cache.get("user:1");   // miss → load → 캐시 저장 → 반환
// await cache.get("user:1");   // hit → 캐시 반환
// await cache.set("user:1", updatedUser); // 캐시 + DB 동시 반영

export interface CacheStrategyOptions<K, V> {
  /** cache miss 시 원본에서 로드하는 함수 (read-through). */
  load: (key: K) => V | Promise<V>;
  /** 쓰기 시 원본에 반영하는 함수 (write-through). 미지정 시 캐시만 업데이트. */
  save?: (key: K, value: V) => void | Promise<void>;
  /** TTL ms. 미지정 시 무제한. */
  ttl?: number;
  /** 최대 캐시 크기. 초과 시 가장 오래된 항목 제거. */
  maxSize?: number;
  /** stale 데이터 반환 후 백그라운드 갱신 (기본: false). */
  staleWhileRevalidate?: boolean;
}

export interface CacheStrategy<K, V> {
  /** 캐시에서 읽는다. miss면 load()로 자동 로드. */
  get(key: K): Promise<V>;

  /** 캐시와 원본 모두에 쓴다. */
  set(key: K, value: V): Promise<void>;

  /** 캐시에서 제거한다 (원본은 건드리지 않음). */
  invalidate(key: K): void;

  /** 전체 캐시를 비운다. */
  invalidateAll(): void;

  /** 캐시에 있는지 확인한다 (만료 고려). */
  has(key: K): boolean;

  /** 캐시 크기. */
  readonly size: number;

  /** 캐시 히트율 통계. */
  readonly stats: { hits: number; misses: number; writes: number };
}

interface Entry<V> {
  value: V;
  expiresAt: number | undefined;
  lastAccess: number;
}

export function createCacheStrategy<K, V>(
  options: CacheStrategyOptions<K, V>,
): CacheStrategy<K, V> {
  const { load, save, ttl, maxSize, staleWhileRevalidate = false } = options;

  const store = new Map<K, Entry<V>>();
  let hits = 0;
  let misses = 0;
  let writes = 0;

  function isExpired(entry: Entry<V>): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }

  function evictOldest(): void {
    if (maxSize === undefined || store.size <= maxSize) return;

    let oldestKey: K | undefined;
    let oldestAccess = Infinity;

    for (const [key, entry] of store) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) store.delete(oldestKey);
  }

  function putEntry(key: K, value: V): void {
    store.set(key, {
      value,
      expiresAt: ttl !== undefined ? Date.now() + ttl : undefined,
      lastAccess: Date.now(),
    });
    evictOldest();
  }

  const cache: CacheStrategy<K, V> = {
    async get(key: K): Promise<V> {
      const entry = store.get(key);

      if (entry && !isExpired(entry)) {
        hits++;
        entry.lastAccess = Date.now();
        return entry.value;
      }

      // stale-while-revalidate
      if (entry && isExpired(entry) && staleWhileRevalidate) {
        hits++;
        // 백그라운드 갱신
        load(key).then((fresh) => putEntry(key, fresh)).catch(() => {});
        return entry.value;
      }

      // cache miss → read-through
      misses++;
      const value = await load(key);
      putEntry(key, value);
      return value;
    },

    async set(key: K, value: V): Promise<void> {
      writes++;
      putEntry(key, value);

      // write-through
      if (save) await save(key, value);
    },

    invalidate(key: K): void {
      store.delete(key);
    },

    invalidateAll(): void {
      store.clear();
    },

    has(key: K): boolean {
      const entry = store.get(key);
      return entry !== undefined && !isExpired(entry);
    },

    get size() { return store.size; },

    get stats() { return { hits, misses, writes }; },
  };

  return cache;
}
