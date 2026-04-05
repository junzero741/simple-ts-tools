import { describe, expect, it } from "vitest";
import { drop, dropLast, dropWhile, take, takeLast, takeWhile } from "./slice";

describe("take", () => {
  it("앞에서 n개를 반환한다", () => {
    expect(take([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
    expect(take([1, 2, 3], 1)).toEqual([1]);
  });

  it("n이 배열 길이보다 크면 전체를 반환한다", () => {
    expect(take([1, 2], 10)).toEqual([1, 2]);
  });

  it("n이 0이면 빈 배열을 반환한다", () => {
    expect(take([1, 2, 3], 0)).toEqual([]);
  });

  it("n이 음수이면 빈 배열을 반환한다", () => {
    expect(take([1, 2, 3], -1)).toEqual([]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(take([], 3)).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [1, 2, 3];
    take(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe("drop", () => {
  it("앞에서 n개를 제거한 나머지를 반환한다", () => {
    expect(drop([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5]);
    expect(drop([1, 2, 3], 1)).toEqual([2, 3]);
  });

  it("n이 배열 길이보다 크면 빈 배열을 반환한다", () => {
    expect(drop([1, 2], 10)).toEqual([]);
  });

  it("n이 0이면 전체를 반환한다", () => {
    expect(drop([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });

  it("n이 음수이면 전체를 반환한다", () => {
    expect(drop([1, 2, 3], -1)).toEqual([1, 2, 3]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(drop([], 3)).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [1, 2, 3];
    drop(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });
});

describe("takeWhile", () => {
  it("predicate가 true인 동안 앞에서부터 수집한다", () => {
    expect(takeWhile([1, 2, 3, 4, 1], x => x < 3)).toEqual([1, 2]);
  });

  it("첫 번째 요소부터 false이면 빈 배열을 반환한다", () => {
    expect(takeWhile([5, 6, 7], x => x < 3)).toEqual([]);
  });

  it("모든 요소가 true이면 전체를 반환한다", () => {
    expect(takeWhile([1, 2, 3], x => x > 0)).toEqual([1, 2, 3]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(takeWhile([], () => true)).toEqual([]);
  });

  it("false 이후 다시 true가 되어도 수집을 재개하지 않는다", () => {
    expect(takeWhile([1, 2, 5, 1, 2], x => x < 3)).toEqual([1, 2]);
  });

  it("객체 배열에 사용할 수 있다", () => {
    const items = [
      { done: false, val: 1 },
      { done: false, val: 2 },
      { done: true, val: 3 },
      { done: false, val: 4 },
    ];
    expect(takeWhile(items, i => !i.done)).toEqual([
      { done: false, val: 1 },
      { done: false, val: 2 },
    ]);
  });
});

describe("dropWhile", () => {
  it("predicate가 true인 동안 앞에서부터 건너뛴다", () => {
    expect(dropWhile([1, 2, 3, 4, 1], x => x < 3)).toEqual([3, 4, 1]);
  });

  it("첫 번째 요소부터 false이면 전체를 반환한다", () => {
    expect(dropWhile([5, 6, 7], x => x < 3)).toEqual([5, 6, 7]);
  });

  it("모든 요소가 true이면 빈 배열을 반환한다", () => {
    expect(dropWhile([1, 2, 3], x => x > 0)).toEqual([]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(dropWhile([], () => true)).toEqual([]);
  });

  it("false 이후 다시 true가 되는 요소도 포함한다", () => {
    expect(dropWhile([1, 2, 5, 1, 2], x => x < 3)).toEqual([5, 1, 2]);
  });
});

describe("takeLast", () => {
  it("뒤에서 n개를 반환한다", () => {
    expect(takeLast([1, 2, 3, 4, 5], 2)).toEqual([4, 5]);
    expect(takeLast([1, 2, 3], 1)).toEqual([3]);
  });

  it("n이 배열 길이보다 크면 전체를 반환한다", () => {
    expect(takeLast([1, 2], 10)).toEqual([1, 2]);
  });

  it("n이 0이면 빈 배열을 반환한다", () => {
    expect(takeLast([1, 2, 3], 0)).toEqual([]);
  });

  it("n이 음수이면 빈 배열을 반환한다", () => {
    expect(takeLast([1, 2, 3], -1)).toEqual([]);
  });
});

describe("dropLast", () => {
  it("뒤에서 n개를 제거한 나머지를 반환한다", () => {
    expect(dropLast([1, 2, 3, 4, 5], 2)).toEqual([1, 2, 3]);
    expect(dropLast([1, 2, 3], 1)).toEqual([1, 2]);
  });

  it("n이 배열 길이보다 크면 빈 배열을 반환한다", () => {
    expect(dropLast([1, 2], 10)).toEqual([]);
  });

  it("n이 0이면 전체를 반환한다", () => {
    expect(dropLast([1, 2, 3], 0)).toEqual([1, 2, 3]);
  });

  it("n이 음수이면 전체를 반환한다", () => {
    expect(dropLast([1, 2, 3], -1)).toEqual([1, 2, 3]);
  });
});
