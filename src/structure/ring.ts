/**
 * 링 버퍼 (Ring Buffer / Circular Buffer).
 *
 * 고정 크기 버퍼. 가득 차면 가장 오래된 요소를 덮어쓴다.
 * 메트릭 윈도우, 최근 로그, 이동 평균, 이벤트 히스토리 등에 적합.
 *
 * @example
 * const ring = createRing<number>(3);
 * ring.push(1).push(2).push(3);
 * ring.toArray();  // [1, 2, 3]
 *
 * ring.push(4);    // 1이 밀려남
 * ring.toArray();  // [2, 3, 4]
 *
 * @example
 * // 이동 평균
 * const window = createRing<number>(5);
 * for (const sample of samples) {
 *   window.push(sample);
 *   const avg = window.reduce((a, b) => a + b, 0) / window.size;
 * }
 *
 * @example
 * // 최근 N개 로그
 * const logs = createRing<string>(100);
 * logs.push("[INFO] server started");
 * logs.last();  // 가장 최근 로그
 *
 * @complexity
 * - push: O(1) amortized
 * - at/first/last: O(1)
 * - toArray: O(n)
 */

export interface Ring<T> extends Iterable<T> {
  /** 값을 추가한다. 가득 차면 가장 오래된 값을 덮어쓴다. */
  push(value: T): Ring<T>;

  /** 인덱스로 접근한다. 0이 가장 오래된 요소. */
  at(index: number): T | undefined;

  /** 가장 오래된 요소. */
  first(): T | undefined;

  /** 가장 최근 요소. */
  last(): T | undefined;

  /** 현재 요소 수. */
  readonly size: number;

  /** 버퍼 용량. */
  readonly capacity: number;

  /** 가득 찼는지 여부. */
  readonly full: boolean;

  /** 모든 요소를 제거한다. */
  clear(): void;

  /** 오래된 순서대로 배열로 변환한다. */
  toArray(): T[];

  /** 각 요소에 대해 함수를 실행한다. */
  forEach(fn: (value: T, index: number) => void): void;

  /** 누적 계산. */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U;

  /** 조건을 만족하는 요소만 배열로 반환한다. */
  filter(predicate: (value: T, index: number) => boolean): T[];

  /** 각 요소를 변환한 배열을 반환한다. */
  map<U>(fn: (value: T, index: number) => U): U[];
}

export function createRing<T>(capacity: number): Ring<T> {
  if (capacity < 1) throw new Error("capacity must be at least 1");

  const buffer: (T | undefined)[] = new Array(capacity);
  let head = 0; // 다음 쓰기 위치
  let count = 0;

  function realIndex(logicalIndex: number): number {
    // head는 다음 쓰기 위치, 가장 오래된 것은 (head - count) mod capacity
    return (head - count + logicalIndex + capacity) % capacity;
  }

  const ring: Ring<T> = {
    push(value: T): Ring<T> {
      buffer[head] = value;
      head = (head + 1) % capacity;
      if (count < capacity) count++;
      return ring;
    },

    at(index: number): T | undefined {
      if (index < 0 || index >= count) return undefined;
      return buffer[realIndex(index)];
    },

    first(): T | undefined {
      if (count === 0) return undefined;
      return buffer[realIndex(0)];
    },

    last(): T | undefined {
      if (count === 0) return undefined;
      return buffer[realIndex(count - 1)];
    },

    get size() { return count; },
    get capacity() { return capacity; },
    get full() { return count === capacity; },

    clear() {
      buffer.fill(undefined);
      head = 0;
      count = 0;
    },

    toArray(): T[] {
      const result: T[] = [];
      for (let i = 0; i < count; i++) {
        result.push(buffer[realIndex(i)] as T);
      }
      return result;
    },

    forEach(fn) {
      for (let i = 0; i < count; i++) {
        fn(buffer[realIndex(i)] as T, i);
      }
    },

    reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
      let acc = initial;
      for (let i = 0; i < count; i++) {
        acc = fn(acc, buffer[realIndex(i)] as T, i);
      }
      return acc;
    },

    filter(predicate) {
      const result: T[] = [];
      for (let i = 0; i < count; i++) {
        const v = buffer[realIndex(i)] as T;
        if (predicate(v, i)) result.push(v);
      }
      return result;
    },

    map<U>(fn: (value: T, index: number) => U): U[] {
      const result: U[] = [];
      for (let i = 0; i < count; i++) {
        result.push(fn(buffer[realIndex(i)] as T, i));
      }
      return result;
    },

    *[Symbol.iterator](): Iterator<T> {
      for (let i = 0; i < count; i++) {
        yield buffer[realIndex(i)] as T;
      }
    },
  };

  return ring;
}
