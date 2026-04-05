/**
 * TTL(Time-to-Live) 기반 Map.
 * 각 항목은 지정한 시간이 지나면 자동으로 만료된다.
 *
 * LRUCache와의 차이: LRUCache는 '개수' 기준으로 제거,
 * TTLMap은 '시간' 기준으로 만료. 조합해서 사용할 수도 있다.
 *
 * @example
 * const cache = new TTLMap<string, number>(5_000); // 5초 TTL
 * cache.set("a", 1);
 * cache.get("a"); // 1
 * // 5초 후
 * cache.get("a"); // undefined (만료)
 *
 * // 개별 항목에 다른 TTL 적용
 * cache.set("b", 2, { ttl: 60_000 }); // 이 항목만 1분 TTL
 *
 * @complexity get/set/has/delete: O(1) | cleanup: O(n)
 */
export class TTLMap<K, V> {
  private readonly defaultTtl: number;
  private readonly store: Map<K, { value: V; expiresAt: number }>;

  constructor(defaultTtl: number) {
    if (defaultTtl <= 0) {
      throw new Error("TTL must be a positive number (ms)");
    }
    this.defaultTtl = defaultTtl;
    this.store = new Map();
  }

  /**
   * 값을 저장한다.
   * @param ttl 이 항목에만 적용할 TTL(ms). 미지정 시 기본 TTL 사용.
   */
  set(key: K, value: V, options?: { ttl?: number }): this {
    const ttl = options?.ttl ?? this.defaultTtl;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
    return this;
  }

  /**
   * 키에 해당하는 값을 반환한다.
   * 만료된 항목은 undefined를 반환하고 즉시 삭제된다.
   */
  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * 키가 존재하고 만료되지 않았으면 true.
   * 만료된 항목은 삭제하고 false를 반환한다.
   */
  has(key: K): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /** 키를 삭제한다. */
  delete(key: K): boolean {
    return this.store.delete(key);
  }

  /** 모든 항목을 삭제한다. */
  clear(): void {
    this.store.clear();
  }

  /**
   * 만료된 항목을 모두 제거한다.
   * 자동으로 호출되지 않으므로 장시간 실행 프로세스에서는
   * 주기적으로 호출해 메모리 누수를 방지한다.
   * @returns 제거된 항목 수
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * 현재 저장된 항목 수.
   * 만료됐지만 cleanup() 전인 항목도 포함될 수 있다.
   * 정확한 유효 항목 수가 필요하면 cleanup() 후 조회한다.
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * 특정 키의 남은 TTL(ms)을 반환한다.
   * 만료됐거나 존재하지 않으면 0을 반환한다.
   */
  ttl(key: K): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }
}
