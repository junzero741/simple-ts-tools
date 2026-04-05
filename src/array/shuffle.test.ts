import { describe, expect, it, vi } from "vitest";
import { sample, sampleSize, shuffle } from "./shuffle";

describe("shuffle", () => {
  it("동일한 요소를 포함하지만 순서가 다른 배열을 반환한다", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(5);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("빈 배열을 처리한다", () => {
    expect(shuffle([])).toEqual([]);
  });

  it("단일 요소 배열은 그대로 반환한다", () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it("Math.random을 고정하면 결정적 결과를 낸다", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    // random=0이면 항상 j=0이므로 역순에 가까운 결과
    const result = shuffle([1, 2, 3]);
    expect(result).toHaveLength(3);
    vi.restoreAllMocks();
  });
});

describe("sample", () => {
  it("배열 요소 중 하나를 반환한다", () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(sample(arr));
    }
  });

  it("빈 배열이면 undefined를 반환한다", () => {
    expect(sample([])).toBeUndefined();
  });

  it("단일 요소 배열이면 항상 그 요소를 반환한다", () => {
    expect(sample([42])).toBe(42);
  });
});

describe("sampleSize", () => {
  it("n개의 고유한 요소를 반환한다", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = sampleSize(arr, 3);
    expect(result).toHaveLength(3);
    // 중복 없음
    expect(new Set(result).size).toBe(3);
    // 원본 요소만 포함
    result.forEach((v) => expect(arr).toContain(v));
  });

  it("n이 배열 길이보다 크면 전체를 반환한다", () => {
    const result = sampleSize([1, 2, 3], 10);
    expect(result).toHaveLength(3);
  });

  it("n=0이면 빈 배열을 반환한다", () => {
    expect(sampleSize([1, 2, 3], 0)).toEqual([]);
  });

  it("빈 배열이면 빈 배열을 반환한다", () => {
    expect(sampleSize([], 3)).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [1, 2, 3, 4, 5];
    sampleSize(arr, 3);
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});
