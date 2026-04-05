// 커스텀 해시 맵 (HashMap).
//
// 내장 Map은 참조 동등성만 지원하지만, HashMap은 커스텀
// hash/equals 함수로 구조적 동등성을 지원한다.
// 객체를 키로 쓰거나, 복합 키(tuple)를 사용할 때 필수.
//
// const map = new HashMap<[number, number], string>(
//   ([x, y]) => `${x},${y}`,
//   ([ax, ay], [bx, by]) => ax === bx && ay === by,
// );
// map.set([1, 2], "point A");
// map.get([1, 2]); // "point A"  (새 배열이지만 구조적 동등)

export class HashMap<K, V> implements Iterable<[K, V]> {
  private buckets = new Map<string | number, Array<{ key: K; value: V }>>();
  private _size = 0;

  constructor(
    private readonly hashFn: (key: K) => string | number,
    private readonly equalsFn: (a: K, b: K) => boolean,
  ) {}

  get size(): number {
    return this._size;
  }

  has(key: K): boolean {
    const hash = this.hashFn(key);
    const bucket = this.buckets.get(hash);
    if (!bucket) return false;
    return bucket.some((entry) => this.equalsFn(entry.key, key));
  }

  get(key: K): V | undefined {
    const hash = this.hashFn(key);
    const bucket = this.buckets.get(hash);
    if (!bucket) return undefined;
    const entry = bucket.find((e) => this.equalsFn(e.key, key));
    return entry?.value;
  }

  set(key: K, value: V): this {
    const hash = this.hashFn(key);
    let bucket = this.buckets.get(hash);
    if (!bucket) {
      bucket = [];
      this.buckets.set(hash, bucket);
    }

    const idx = bucket.findIndex((e) => this.equalsFn(e.key, key));
    if (idx !== -1) {
      bucket[idx].value = value;
    } else {
      bucket.push({ key, value });
      this._size++;
    }
    return this;
  }

  delete(key: K): boolean {
    const hash = this.hashFn(key);
    const bucket = this.buckets.get(hash);
    if (!bucket) return false;

    const idx = bucket.findIndex((e) => this.equalsFn(e.key, key));
    if (idx === -1) return false;

    bucket.splice(idx, 1);
    if (bucket.length === 0) this.buckets.delete(hash);
    this._size--;
    return true;
  }

  clear(): void {
    this.buckets.clear();
    this._size = 0;
  }

  keys(): K[] {
    const result: K[] = [];
    for (const bucket of this.buckets.values()) {
      for (const entry of bucket) result.push(entry.key);
    }
    return result;
  }

  values(): V[] {
    const result: V[] = [];
    for (const bucket of this.buckets.values()) {
      for (const entry of bucket) result.push(entry.value);
    }
    return result;
  }

  entries(): [K, V][] {
    const result: [K, V][] = [];
    for (const bucket of this.buckets.values()) {
      for (const entry of bucket) result.push([entry.key, entry.value]);
    }
    return result;
  }

  forEach(fn: (value: V, key: K) => void): void {
    for (const bucket of this.buckets.values()) {
      for (const entry of bucket) fn(entry.value, entry.key);
    }
  }

  getOrSet(key: K, defaultFn: () => V): V {
    const existing = this.get(key);
    if (existing !== undefined) return existing;
    const value = defaultFn();
    this.set(key, value);
    return value;
  }

  *[Symbol.iterator](): Iterator<[K, V]> {
    for (const bucket of this.buckets.values()) {
      for (const entry of bucket) {
        yield [entry.key, entry.value];
      }
    }
  }
}
