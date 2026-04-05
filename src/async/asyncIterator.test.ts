import { describe, it, expect } from "vitest";
import {
  asyncMap, asyncFilter, asyncTake, asyncSkip,
  asyncBatch, asyncTap, asyncConcat,
  asyncToArray, asyncReduce, asyncFind, asyncSome, asyncEvery,
  fromIterable,
} from "./asyncIterator";

async function* generate<T>(values: T[]): AsyncIterable<T> {
  for (const v of values) yield v;
}

describe("asyncMap", () => {
  it("각 요소를 변환한다", async () => {
    const result = await asyncToArray(asyncMap(generate([1, 2, 3]), (n) => n * 10));
    expect(result).toEqual([10, 20, 30]);
  });

  it("async 변환을 지원한다", async () => {
    const result = await asyncToArray(
      asyncMap(generate([1, 2]), async (n) => n + 1),
    );
    expect(result).toEqual([2, 3]);
  });
});

describe("asyncFilter", () => {
  it("조건에 맞는 요소만 통과시킨다", async () => {
    const result = await asyncToArray(
      asyncFilter(generate([1, 2, 3, 4, 5]), (n) => n % 2 === 0),
    );
    expect(result).toEqual([2, 4]);
  });
});

describe("asyncTake", () => {
  it("처음 n개만 취한다", async () => {
    const result = await asyncToArray(asyncTake(generate([1, 2, 3, 4, 5]), 3));
    expect(result).toEqual([1, 2, 3]);
  });

  it("원본이 짧으면 있는 만큼", async () => {
    const result = await asyncToArray(asyncTake(generate([1, 2]), 5));
    expect(result).toEqual([1, 2]);
  });
});

describe("asyncSkip", () => {
  it("처음 n개를 건너뛴다", async () => {
    const result = await asyncToArray(asyncSkip(generate([1, 2, 3, 4, 5]), 2));
    expect(result).toEqual([3, 4, 5]);
  });
});

describe("asyncBatch", () => {
  it("n개씩 묶는다", async () => {
    const result = await asyncToArray(asyncBatch(generate([1, 2, 3, 4, 5]), 2));
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("정확히 나누어지면 나머지 없음", async () => {
    const result = await asyncToArray(asyncBatch(generate([1, 2, 3, 4]), 2));
    expect(result).toEqual([[1, 2], [3, 4]]);
  });
});

describe("asyncTap", () => {
  it("부수 효과를 실행하되 값은 변경하지 않는다", async () => {
    const side: number[] = [];
    const result = await asyncToArray(
      asyncTap(generate([1, 2, 3]), (n) => { side.push(n * 10); }),
    );
    expect(result).toEqual([1, 2, 3]);
    expect(side).toEqual([10, 20, 30]);
  });
});

describe("asyncConcat", () => {
  it("여러 소스를 연결한다", async () => {
    const result = await asyncToArray(
      asyncConcat(generate([1, 2]), generate([3, 4])),
    );
    expect(result).toEqual([1, 2, 3, 4]);
  });
});

describe("asyncReduce", () => {
  it("누적한다", async () => {
    const sum = await asyncReduce(generate([1, 2, 3, 4]), (acc, n) => acc + n, 0);
    expect(sum).toBe(10);
  });
});

describe("asyncFind", () => {
  it("조건에 맞는 첫 요소를 반환한다", async () => {
    expect(await asyncFind(generate([1, 2, 3, 4]), (n) => n > 2)).toBe(3);
  });

  it("없으면 undefined", async () => {
    expect(await asyncFind(generate([1, 2]), (n) => n > 10)).toBeUndefined();
  });
});

describe("asyncSome / asyncEvery", () => {
  it("some — 하나라도 만족", async () => {
    expect(await asyncSome(generate([1, 2, 3]), (n) => n > 2)).toBe(true);
    expect(await asyncSome(generate([1, 2, 3]), (n) => n > 5)).toBe(false);
  });

  it("every — 모두 만족", async () => {
    expect(await asyncEvery(generate([2, 4, 6]), (n) => n % 2 === 0)).toBe(true);
    expect(await asyncEvery(generate([2, 3, 6]), (n) => n % 2 === 0)).toBe(false);
  });
});

describe("fromIterable", () => {
  it("동기 이터러블을 async로 변환한다", async () => {
    const result = await asyncToArray(fromIterable([1, 2, 3]));
    expect(result).toEqual([1, 2, 3]);
  });
});

describe("체이닝 조합", () => {
  it("filter → map → take → toArray", async () => {
    const source = generate([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = await asyncToArray(
      asyncTake(
        asyncMap(
          asyncFilter(source, (n) => n % 2 === 0),
          (n) => n * 10,
        ),
        3,
      ),
    );
    expect(result).toEqual([20, 40, 60]);
  });
});
