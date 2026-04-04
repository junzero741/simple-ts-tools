/**
 * LRU(Least Recently Used) 캐시.
 * 최대 용량을 초과하면 가장 오래 전에 사용된 항목을 자동으로 제거한다.
 *
 * 내부적으로 Map의 삽입 순서를 이용해 O(1) get/set을 구현한다.
 *
 * @example
 * const cache = new LRUCache<string, number>(3);
 * cache.set("a", 1); cache.set("b", 2); cache.set("c", 3);
 * cache.get("a");     // 1 — "a"가 최근 사용됨
 * cache.set("d", 4); // 용량 초과 → "b"가 제거됨
 * cache.has("b");     // false
 */
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, V>;

  constructor(capacity: number) {
    if (capacity <= 0 || !Number.isInteger(capacity)) {
      throw new Error("capacity must be a positive integer");
    }
    this.capacity = capacity;
    this.map = new Map();
  }

  /**
   * 키에 해당하는 값을 반환한다. 없으면 undefined.
   * 조회 시 해당 항목을 "최근 사용"으로 갱신한다.
   */
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    // 삭제 후 재삽입으로 Map 순서상 "최신"으로 이동
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /**
   * 값을 저장한다. 이미 존재하면 값을 갱신하고 최근 사용으로 이동한다.
   * 용량 초과 시 가장 오래된 항목을 제거한다.
   */
  set(key: K, value: V): this {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Map의 첫 번째 키 = 가장 오래 전에 사용된 항목
      const oldestKey = this.map.keys().next().value as K;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
    return this;
  }

  /** 키가 캐시에 존재하는지 확인한다. 조회 순서는 변경되지 않는다. */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** 키를 캐시에서 제거한다. 제거 성공 여부를 반환한다. */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /** 캐시를 전체 비운다. */
  clear(): void {
    this.map.clear();
  }

  /** 현재 캐시에 저장된 항목 수. */
  get size(): number {
    return this.map.size;
  }
}
