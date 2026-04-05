/**
 * 양방향 큐 (Double-Ended Queue / Deque).
 *
 * 앞/뒤 양쪽에서 O(1) 삽입/삭제. 배열 기반 Deque는 앞 삽입이
 * O(n)이지만, 이 구현은 순환 버퍼로 O(1)을 보장한다.
 *
 * 슬라이딩 윈도우 최대/최소, BFS 변형(0-1 BFS),
 * 작업 스틸링(work-stealing) 큐 등에 활용.
 *
 * @example
 * const dq = new Deque<number>();
 * dq.pushBack(1).pushBack(2).pushFront(0);
 * dq.toArray();     // [0, 1, 2]
 *
 * dq.popFront();    // 0
 * dq.popBack();     // 2
 * dq.toArray();     // [1]
 *
 * @example
 * // 슬라이딩 윈도우 최대값
 * function maxSlidingWindow(nums: number[], k: number): number[] {
 *   const dq = new Deque<number>(); // 인덱스 저장
 *   const result: number[] = [];
 *   for (let i = 0; i < nums.length; i++) {
 *     while (!dq.isEmpty() && dq.peekFront()! < i - k + 1) dq.popFront();
 *     while (!dq.isEmpty() && nums[dq.peekBack()!] < nums[i]) dq.popBack();
 *     dq.pushBack(i);
 *     if (i >= k - 1) result.push(nums[dq.peekFront()!]);
 *   }
 *   return result;
 * }
 *
 * @complexity
 * - pushFront/pushBack/popFront/popBack: amortized O(1)
 * - peekFront/peekBack: O(1)
 * - at: O(1)
 */

const MIN_CAPACITY = 8;

export class Deque<T> implements Iterable<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private _size = 0;

  constructor(initialCapacity: number = MIN_CAPACITY) {
    const cap = Math.max(MIN_CAPACITY, nextPow2(initialCapacity));
    this.buf = new Array(cap);
  }

  /** 요소 수. */
  get size(): number { return this._size; }

  /** 비어 있는지 여부. */
  isEmpty(): boolean { return this._size === 0; }

  /** 앞에 추가한다. */
  pushFront(value: T): this {
    this.growIfNeeded();
    this.head = (this.head - 1 + this.buf.length) & (this.buf.length - 1);
    this.buf[this.head] = value;
    this._size++;
    return this;
  }

  /** 뒤에 추가한다. */
  pushBack(value: T): this {
    this.growIfNeeded();
    this.buf[this.tail] = value;
    this.tail = (this.tail + 1) & (this.buf.length - 1);
    this._size++;
    return this;
  }

  /** 앞에서 제거하고 반환한다. */
  popFront(): T | undefined {
    if (this._size === 0) return undefined;
    const value = this.buf[this.head];
    this.buf[this.head] = undefined;
    this.head = (this.head + 1) & (this.buf.length - 1);
    this._size--;
    return value;
  }

  /** 뒤에서 제거하고 반환한다. */
  popBack(): T | undefined {
    if (this._size === 0) return undefined;
    this.tail = (this.tail - 1 + this.buf.length) & (this.buf.length - 1);
    const value = this.buf[this.tail];
    this.buf[this.tail] = undefined;
    this._size--;
    return value;
  }

  /** 앞 요소를 반환한다 (제거 안 함). */
  peekFront(): T | undefined {
    if (this._size === 0) return undefined;
    return this.buf[this.head];
  }

  /** 뒤 요소를 반환한다 (제거 안 함). */
  peekBack(): T | undefined {
    if (this._size === 0) return undefined;
    return this.buf[(this.tail - 1 + this.buf.length) & (this.buf.length - 1)];
  }

  /** 인덱스로 접근한다. 0이 front. */
  at(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    return this.buf[(this.head + index) & (this.buf.length - 1)];
  }

  /** 모든 요소를 제거한다. */
  clear(): void {
    this.buf.fill(undefined);
    this.head = 0;
    this.tail = 0;
    this._size = 0;
  }

  /** front → back 순서로 배열 반환. */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      result.push(this.buf[(this.head + i) & (this.buf.length - 1)] as T);
    }
    return result;
  }

  /** 이터레이터 (front → back). */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this._size; i++) {
      yield this.buf[(this.head + i) & (this.buf.length - 1)] as T;
    }
  }

  /** 역순 이터레이터 (back → front). */
  *reversed(): Iterable<T> {
    for (let i = this._size - 1; i >= 0; i--) {
      yield this.buf[(this.head + i) & (this.buf.length - 1)] as T;
    }
  }

  /** 배열/이터러블에서 생성한다. */
  static from<T>(values: Iterable<T>): Deque<T> {
    const arr = Array.isArray(values) ? values : [...values];
    const dq = new Deque<T>(arr.length);
    for (const v of arr) dq.pushBack(v);
    return dq;
  }

  private growIfNeeded(): void {
    if (this._size < this.buf.length) return;

    const oldCap = this.buf.length;
    const newCap = oldCap * 2;
    const newBuf: (T | undefined)[] = new Array(newCap);

    for (let i = 0; i < this._size; i++) {
      newBuf[i] = this.buf[(this.head + i) & (oldCap - 1)];
    }

    this.buf = newBuf;
    this.head = 0;
    this.tail = this._size;
  }
}

function nextPow2(n: number): number {
  let v = n - 1;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v + 1;
}
