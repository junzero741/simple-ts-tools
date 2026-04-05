// 비동기 이터레이터 유틸 (Async Iterator Utilities).
//
// AsyncIterable에 대한 map/filter/take/batch/merge/timeout 연산.
// 기존 lazy가 동기 이터레이터라면, 이건 스트림/SSE/WebSocket/
// 파일 읽기 등 비동기 데이터 소스에 대한 체이닝.
//
// for await (const chunk of asyncMap(stream, transform)) { ... }
// for await (const batch of asyncBatch(events, 10)) { ... }

/** 비동기 이터러블의 각 요소를 변환한다. */
export async function* asyncMap<T, U>(
  source: AsyncIterable<T>,
  fn: (value: T, index: number) => U | Promise<U>,
): AsyncIterable<U> {
  let i = 0;
  for await (const value of source) {
    yield await fn(value, i++);
  }
}

/** 조건을 만족하는 요소만 통과시킨다. */
export async function* asyncFilter<T>(
  source: AsyncIterable<T>,
  predicate: (value: T, index: number) => boolean | Promise<boolean>,
): AsyncIterable<T> {
  let i = 0;
  for await (const value of source) {
    if (await predicate(value, i++)) yield value;
  }
}

/** 처음 n개만 취한다. */
export async function* asyncTake<T>(
  source: AsyncIterable<T>,
  n: number,
): AsyncIterable<T> {
  let count = 0;
  for await (const value of source) {
    if (count >= n) return;
    yield value;
    count++;
  }
}

/** 처음 n개를 건너뛴다. */
export async function* asyncSkip<T>(
  source: AsyncIterable<T>,
  n: number,
): AsyncIterable<T> {
  let count = 0;
  for await (const value of source) {
    if (count >= n) yield value;
    count++;
  }
}

/** n개씩 묶어 배치로 나눈다. */
export async function* asyncBatch<T>(
  source: AsyncIterable<T>,
  size: number,
): AsyncIterable<T[]> {
  let batch: T[] = [];
  for await (const value of source) {
    batch.push(value);
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}

/** 각 요소에 대해 부수 효과를 실행한다. */
export async function* asyncTap<T>(
  source: AsyncIterable<T>,
  fn: (value: T, index: number) => void | Promise<void>,
): AsyncIterable<T> {
  let i = 0;
  for await (const value of source) {
    await fn(value, i++);
    yield value;
  }
}

/** 여러 비동기 이터러블을 순서대로 연결한다. */
export async function* asyncConcat<T>(
  ...sources: AsyncIterable<T>[]
): AsyncIterable<T> {
  for (const source of sources) {
    yield* source;
  }
}

/** 비동기 이터러블을 배열로 수집한다. */
export async function asyncToArray<T>(source: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of source) {
    result.push(value);
  }
  return result;
}

/** 비동기 이터러블의 요소를 누적한다. */
export async function asyncReduce<T, U>(
  source: AsyncIterable<T>,
  fn: (acc: U, value: T, index: number) => U | Promise<U>,
  initial: U,
): Promise<U> {
  let acc = initial;
  let i = 0;
  for await (const value of source) {
    acc = await fn(acc, value, i++);
  }
  return acc;
}

/** 조건을 만족하는 첫 요소를 반환한다. */
export async function asyncFind<T>(
  source: AsyncIterable<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
): Promise<T | undefined> {
  for await (const value of source) {
    if (await predicate(value)) return value;
  }
  return undefined;
}

/** 하나라도 조건을 만족하면 true. */
export async function asyncSome<T>(
  source: AsyncIterable<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
): Promise<boolean> {
  for await (const value of source) {
    if (await predicate(value)) return true;
  }
  return false;
}

/** 모든 요소가 조건을 만족하면 true. */
export async function asyncEvery<T>(
  source: AsyncIterable<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
): Promise<boolean> {
  for await (const value of source) {
    if (!(await predicate(value))) return false;
  }
  return true;
}

/** 배열/이터러블을 AsyncIterable로 변환한다. */
export async function* fromIterable<T>(source: Iterable<T>): AsyncIterable<T> {
  for (const value of source) {
    yield value;
  }
}
