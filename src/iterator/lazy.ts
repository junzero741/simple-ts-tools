/**
 * 지연 평가 이터레이터 (Lazy Iterator).
 *
 * 배열 메서드(map, filter 등)와 달리 중간 배열을 생성하지 않고,
 * 값이 필요할 때만 계산한다. 대량 데이터나 무한 시퀀스 처리에 적합하다.
 *
 * @example
 * // 기본 사용 — 체이닝
 * const result = lazy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
 *   .filter(n => n % 2 === 0)
 *   .map(n => n * 10)
 *   .take(3)
 *   .toArray();
 * // [20, 40, 60]
 *
 * @example
 * // 무한 시퀀스 — take로 제한
 * const fibs = lazy(function* () {
 *   let [a, b] = [0, 1];
 *   while (true) { yield a; [a, b] = [b, a + b]; }
 * }).take(10).toArray();
 * // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
 *
 * @example
 * // for...of 직접 사용
 * for (const n of lazy([1, 2, 3]).map(n => n * 2)) {
 *   console.log(n); // 2, 4, 6
 * }
 *
 * @complexity Time: 각 연산 O(1) per element, 전체 O(n). Space: O(1) (중간 배열 없음)
 */

export class Lazy<T> implements Iterable<T> {
  constructor(private source: Iterable<T>) {}

  [Symbol.iterator](): Iterator<T> {
    return this.source[Symbol.iterator]();
  }

  /** 각 요소를 변환한다. */
  map<U>(fn: (value: T, index: number) => U): Lazy<U> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          yield fn(value, i++);
        }
      },
    });
  }

  /** 조건을 만족하는 요소만 통과시킨다. */
  filter(predicate: (value: T, index: number) => boolean): Lazy<T>;
  filter<S extends T>(predicate: (value: T, index: number) => value is S): Lazy<S>;
  filter(predicate: (value: T, index: number) => boolean): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          if (predicate(value, i++)) yield value;
        }
      },
    });
  }

  /** 처음 n개만 취한다. */
  take(n: number): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        if (n <= 0) return;
        let count = 0;
        for (const value of source) {
          yield value;
          if (++count >= n) return;
        }
      },
    });
  }

  /** 처음 n개를 건너뛴다. */
  skip(n: number): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let count = 0;
        for (const value of source) {
          if (count >= n) yield value;
          count++;
        }
      },
    });
  }

  /** 조건이 참인 동안 요소를 취한다. */
  takeWhile(predicate: (value: T, index: number) => boolean): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          if (!predicate(value, i++)) return;
          yield value;
        }
      },
    });
  }

  /** 조건이 참인 동안 요소를 건너뛴다. */
  skipWhile(predicate: (value: T, index: number) => boolean): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let skipping = true;
        let i = 0;
        for (const value of source) {
          if (skipping && predicate(value, i++)) continue;
          skipping = false;
          yield value;
        }
      },
    });
  }

  /** 중첩된 이터러블을 평탄화한다. */
  flatMap<U>(fn: (value: T, index: number) => Iterable<U>): Lazy<U> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          yield* fn(value, i++);
        }
      },
    });
  }

  /** 중복 요소를 제거한다. */
  distinct(): Lazy<T>;
  distinct<K>(keyFn: (value: T) => K): Lazy<T>;
  distinct<K>(keyFn?: (value: T) => K): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        const seen = new Set<T | K>();
        for (const value of source) {
          const key = keyFn ? keyFn(value) : value;
          if (!seen.has(key)) {
            seen.add(key);
            yield value;
          }
        }
      },
    });
  }

  /** 각 요소에 대해 부수 효과를 실행한다. 값은 변경하지 않는다. */
  tap(fn: (value: T, index: number) => void): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          fn(value, i++);
          yield value;
        }
      },
    });
  }

  /** 다른 이터러블을 뒤에 연결한다. */
  concat(...others: Iterable<T>[]): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        yield* source;
        for (const other of others) {
          yield* other;
        }
      },
    });
  }

  /** n개씩 묶어 청크로 나눈다. */
  chunk(size: number): Lazy<T[]> {
    if (size < 1) throw new Error("Chunk size must be at least 1");
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let batch: T[] = [];
        for (const value of source) {
          batch.push(value);
          if (batch.length === size) {
            yield batch;
            batch = [];
          }
        }
        if (batch.length > 0) yield batch;
      },
    });
  }

  /** 다른 이터러블과 쌍으로 묶는다. 짧은 쪽 기준. */
  zip<U>(other: Iterable<U>): Lazy<[T, U]> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        const iterA = source[Symbol.iterator]();
        const iterB = other[Symbol.iterator]();
        while (true) {
          const a = iterA.next();
          const b = iterB.next();
          if (a.done || b.done) return;
          yield [a.value, b.value] as [T, U];
        }
      },
    });
  }

  /** 인덱스와 함께 [index, value] 쌍을 생성한다. */
  enumerate(): Lazy<[number, T]> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let i = 0;
        for (const value of source) {
          yield [i++, value] as [number, T];
        }
      },
    });
  }

  // --- 터미널 연산 (소비) ---

  /** 배열로 변환한다. */
  toArray(): T[] {
    return [...this.source];
  }

  /** Map으로 변환한다. */
  toMap<K, V>(keyFn: (value: T) => K, valueFn: (value: T) => V): Map<K, V> {
    const map = new Map<K, V>();
    for (const value of this.source) {
      map.set(keyFn(value), valueFn(value));
    }
    return map;
  }

  /** Set으로 변환한다. */
  toSet(): Set<T> {
    return new Set(this.source);
  }

  /** 누적 계산을 수행한다. */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    let acc = initial;
    let i = 0;
    for (const value of this.source) {
      acc = fn(acc, value, i++);
    }
    return acc;
  }

  /** 각 요소에 대해 함수를 실행한다. */
  forEach(fn: (value: T, index: number) => void): void {
    let i = 0;
    for (const value of this.source) {
      fn(value, i++);
    }
  }

  /** 첫 번째 요소를 반환한다. 없으면 undefined. */
  first(): T | undefined {
    for (const value of this.source) {
      return value;
    }
    return undefined;
  }

  /** 조건을 만족하는 첫 번째 요소를 반환한다. */
  find(predicate: (value: T, index: number) => boolean): T | undefined {
    let i = 0;
    for (const value of this.source) {
      if (predicate(value, i++)) return value;
    }
    return undefined;
  }

  /** 모든 요소가 조건을 만족하는지 검사한다. */
  every(predicate: (value: T, index: number) => boolean): boolean {
    let i = 0;
    for (const value of this.source) {
      if (!predicate(value, i++)) return false;
    }
    return true;
  }

  /** 조건을 만족하는 요소가 하나라도 있는지 검사한다. */
  some(predicate: (value: T, index: number) => boolean): boolean {
    let i = 0;
    for (const value of this.source) {
      if (predicate(value, i++)) return true;
    }
    return false;
  }

  /** 요소 수를 반환한다. */
  count(): number {
    let n = 0;
    for (const _ of this.source) n++;
    return n;
  }

  /** 조건을 만족하는 요소가 있는지 검사한다. */
  includes(target: T): boolean {
    for (const value of this.source) {
      if (value === target) return true;
    }
    return false;
  }
}

/**
 * 지연 평가 이터레이터를 생성한다.
 *
 * @param source 배열, Set, Map, 제너레이터 함수 등 Iterable 또는 제너레이터 팩토리
 */
export function lazy<T>(source: Iterable<T> | (() => Generator<T>)): Lazy<T> {
  if (typeof source === "function") {
    return new Lazy({
      [Symbol.iterator]: source,
    });
  }
  return new Lazy(source);
}
