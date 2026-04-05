// Multimap — 하나의 키에 여러 값을 매핑하는 자료구조.
//
// 내장 Map<K, V[]>를 래핑하여 put/get/delete/has 등을 제공하고,
// 빈 배열 정리, 카운팅, 이터레이션을 자동 처리한다.
//
// const mm = new Multimap<string, number>();
// mm.put("a", 1).put("a", 2).put("b", 3);
// mm.get("a");     // [1, 2]
// mm.size;         // 3 (총 값 수)
// mm.keyCount;     // 2 (고유 키 수)
//
// 태그 시스템, 역인덱스, 이벤트 그루핑, 1:N 관계 표현에 활용.

export class Multimap<K, V> implements Iterable<[K, V]> {
  private map = new Map<K, V[]>();
  private _size = 0;

  /** 키에 값을 추가한다. */
  put(key: K, value: V): this {
    let arr = this.map.get(key);
    if (!arr) {
      arr = [];
      this.map.set(key, arr);
    }
    arr.push(value);
    this._size++;
    return this;
  }

  /** 키에 여러 값을 추가한다. */
  putAll(key: K, values: Iterable<V>): this {
    for (const v of values) this.put(key, v);
    return this;
  }

  /** 키에 매핑된 모든 값을 반환한다. 없으면 빈 배열. */
  get(key: K): readonly V[] {
    return this.map.get(key) ?? [];
  }

  /** 키가 존재하는지 확인한다. */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** 키에 특정 값이 존재하는지 확인한다. */
  hasEntry(key: K, value: V): boolean {
    const arr = this.map.get(key);
    return arr ? arr.includes(value) : false;
  }

  /** 키의 모든 값을 제거한다. */
  delete(key: K): boolean {
    const arr = this.map.get(key);
    if (!arr) return false;
    this._size -= arr.length;
    this.map.delete(key);
    return true;
  }

  /** 키에서 특정 값 하나를 제거한다. */
  deleteEntry(key: K, value: V): boolean {
    const arr = this.map.get(key);
    if (!arr) return false;
    const idx = arr.indexOf(value);
    if (idx === -1) return false;
    arr.splice(idx, 1);
    this._size--;
    if (arr.length === 0) this.map.delete(key);
    return true;
  }

  /** 모든 항목을 제거한다. */
  clear(): void {
    this.map.clear();
    this._size = 0;
  }

  /** 총 값 수 (모든 키의 값을 합산). */
  get size(): number {
    return this._size;
  }

  /** 고유 키 수. */
  get keyCount(): number {
    return this.map.size;
  }

  /** 모든 고유 키를 반환한다. */
  keys(): K[] {
    return [...this.map.keys()];
  }

  /** 모든 값을 반환한다 (중복 포함). */
  values(): V[] {
    const result: V[] = [];
    for (const arr of this.map.values()) {
      result.push(...arr);
    }
    return result;
  }

  /** [키, 값 배열] 쌍을 반환한다. */
  entries(): [K, readonly V[]][] {
    return [...this.map.entries()];
  }

  /** 각 키-값 쌍에 대해 함수를 실행한다. */
  forEach(fn: (key: K, value: V) => void): void {
    for (const [key, arr] of this.map) {
      for (const value of arr) fn(key, value);
    }
  }

  /** 값을 기준으로 역Multimap을 생성한다. */
  invert(): Multimap<V, K> {
    const result = new Multimap<V, K>();
    for (const [key, arr] of this.map) {
      for (const value of arr) result.put(value, key);
    }
    return result;
  }

  /** 일반 Map<K, V[]>으로 변환한다 (복사). */
  toMap(): Map<K, V[]> {
    const result = new Map<K, V[]>();
    for (const [key, arr] of this.map) {
      result.set(key, [...arr]);
    }
    return result;
  }

  /** 개별 [키, 값] 쌍을 이터레이트한다. */
  *[Symbol.iterator](): Iterator<[K, V]> {
    for (const [key, arr] of this.map) {
      for (const value of arr) yield [key, value];
    }
  }

  /** 배열에서 Multimap을 생성한다. */
  static from<T, K, V>(
    items: Iterable<T>,
    keyFn: (item: T) => K,
    valueFn: (item: T) => V,
  ): Multimap<K, V> {
    const mm = new Multimap<K, V>();
    for (const item of items) mm.put(keyFn(item), valueFn(item));
    return mm;
  }

  /** groupBy — 배열을 키 함수로 그루핑한다. */
  static groupBy<T, K>(items: Iterable<T>, keyFn: (item: T) => K): Multimap<K, T> {
    return Multimap.from(items, keyFn, (item) => item);
  }
}
