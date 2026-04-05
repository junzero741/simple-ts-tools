// 정렬 배열 (SortedArray).
//
// 삽입 시 자동으로 정렬 위치를 찾아 넣어, 항상 정렬 상태를 유지한다.
// O(log n) 탐색, O(n) 삽입이지만, 캐시 효율이 높아 실무에서
// 수천 개 이하 데이터에서는 트리보다 빠르다.
//
// const arr = new SortedArray<number>((a, b) => a - b);
// arr.insert(3).insert(1).insert(2);
// arr.toArray(); // [1, 2, 3]
//
// arr.has(2);       // true (O(log n))
// arr.indexOf(2);   // 1
// arr.range(1, 2);  // [1, 2]
// arr.at(0);        // 1 (최소)
// arr.at(-1);       // 3 (최대)

export type CompareFn<T> = (a: T, b: T) => number;

export class SortedArray<T> implements Iterable<T> {
  private items: T[] = [];

  constructor(private compare: CompareFn<T>) {}

  get size(): number { return this.items.length; }

  isEmpty(): boolean { return this.items.length === 0; }

  /** 값을 정렬 위치에 삽입한다. */
  insert(value: T): this {
    const idx = this.findInsertIndex(value);
    this.items.splice(idx, 0, value);
    return this;
  }

  /** 여러 값을 삽입한다. */
  insertAll(values: Iterable<T>): this {
    for (const v of values) this.insert(v);
    return this;
  }

  /** 값을 제거한다. 같은 값이 여러 개면 첫 번째만 제거. */
  remove(value: T): boolean {
    const idx = this.indexOf(value);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

  /** 값이 존재하는지 확인 (O(log n)). */
  has(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  /** 값의 인덱스를 반환 (O(log n)). 없으면 -1. */
  indexOf(value: T): number {
    let lo = 0;
    let hi = this.items.length - 1;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const cmp = this.compare(this.items[mid], value);
      if (cmp === 0) return mid;
      if (cmp < 0) lo = mid + 1;
      else hi = mid - 1;
    }

    return -1;
  }

  /** 인덱스로 접근. 음수 인덱스 지원. */
  at(index: number): T | undefined {
    const i = index < 0 ? this.items.length + index : index;
    return this.items[i];
  }

  /** 최솟값. */
  min(): T | undefined {
    return this.items[0];
  }

  /** 최댓값. */
  max(): T | undefined {
    return this.items[this.items.length - 1];
  }

  /** lo 이상 hi 이하 범위의 값을 반환한다 (O(log n + k)). */
  range(lo: T, hi: T): T[] {
    const startIdx = this.lowerBound(lo);
    const result: T[] = [];
    for (let i = startIdx; i < this.items.length; i++) {
      if (this.compare(this.items[i], hi) > 0) break;
      result.push(this.items[i]);
    }
    return result;
  }

  /** value 이상인 첫 인덱스 (lower bound). */
  lowerBound(value: T): number {
    let lo = 0;
    let hi = this.items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.compare(this.items[mid], value) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** value 초과인 첫 인덱스 (upper bound). */
  upperBound(value: T): number {
    let lo = 0;
    let hi = this.items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.compare(this.items[mid], value) <= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** value 이하인 요소 수 (rank). */
  rank(value: T): number {
    return this.upperBound(value);
  }

  /** k번째 작은 값 (0-based). */
  select(k: number): T | undefined {
    return this.items[k];
  }

  /** 모든 요소를 제거한다. */
  clear(): void {
    this.items.length = 0;
  }

  /** 배열로 반환 (복사). */
  toArray(): T[] {
    return [...this.items];
  }

  forEach(fn: (value: T, index: number) => void): void {
    this.items.forEach(fn);
  }

  filter(predicate: (value: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.items;
  }

  /** 배열에서 SortedArray를 생성한다. */
  static from<T>(values: Iterable<T>, compare: CompareFn<T>): SortedArray<T> {
    const arr = new SortedArray<T>(compare);
    for (const v of values) arr.insert(v);
    return arr;
  }

  private findInsertIndex(value: T): number {
    let lo = 0;
    let hi = this.items.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.compare(this.items[mid], value) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
