import { describe, expect, it } from "vitest";
import { mean, median, mode, stddev, sum, variance } from "./statistics";

describe("sum", () => {
  it("숫자 배열의 합을 반환한다", () => {
    expect(sum([1, 2, 3, 4, 5])).toBe(15);
    expect(sum([10, -5, 3])).toBe(8);
  });

  it("빈 배열은 0을 반환한다", () => {
    expect(sum([])).toBe(0);
  });
});

describe("mean", () => {
  it("평균을 반환한다", () => {
    expect(mean([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20])).toBe(15);
  });

  it("단일 요소", () => {
    expect(mean([42])).toBe(42);
  });

  it("소수 평균", () => {
    expect(mean([1, 2])).toBe(1.5);
  });

  it("빈 배열은 NaN을 반환한다", () => {
    expect(mean([])).toBeNaN();
  });
});

describe("median", () => {
  it("홀수 개 — 중간 값", () => {
    expect(median([3, 1, 2])).toBe(2);     // 정렬: [1,2,3]
    expect(median([5, 3, 1, 4, 2])).toBe(3);
  });

  it("짝수 개 — 중간 두 값의 평균", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([10, 20])).toBe(15);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [3, 1, 2];
    median(arr);
    expect(arr).toEqual([3, 1, 2]);
  });

  it("단일 요소", () => {
    expect(median([7])).toBe(7);
  });

  it("빈 배열은 NaN을 반환한다", () => {
    expect(median([])).toBeNaN();
  });
});

describe("mode", () => {
  it("단일 최빈값", () => {
    expect(mode([1, 2, 2, 3])).toEqual([2]);
    expect(mode([1, 1, 2, 3])).toEqual([1]);
  });

  it("공동 최빈값", () => {
    const result = mode([1, 1, 2, 2, 3]);
    expect(result.sort()).toEqual([1, 2]);
  });

  it("모든 값이 동일 빈도이면 모두 반환한다", () => {
    const result = mode([1, 2, 3]);
    expect(result.sort()).toEqual([1, 2, 3]);
  });

  it("단일 요소", () => {
    expect(mode([5])).toEqual([5]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(mode([])).toEqual([]);
  });
});

describe("variance", () => {
  // 예제: [2, 4, 4, 4, 5, 5, 7, 9] — 평균 5, 분산 4
  const data = [2, 4, 4, 4, 5, 5, 7, 9];

  it("모집단 분산 (sample: false, 기본)", () => {
    expect(variance(data)).toBeCloseTo(4, 5);
  });

  it("표본 분산 (sample: true)", () => {
    expect(variance(data, true)).toBeCloseTo(4.571, 2);
  });

  it("단일 요소의 모집단 분산은 0", () => {
    expect(variance([5])).toBe(0);
  });

  it("단일 요소의 표본 분산은 NaN", () => {
    expect(variance([5], true)).toBeNaN();
  });

  it("빈 배열은 NaN", () => {
    expect(variance([])).toBeNaN();
  });

  it("모든 값이 같으면 분산은 0", () => {
    expect(variance([3, 3, 3, 3])).toBe(0);
  });
});

describe("stddev", () => {
  const data = [2, 4, 4, 4, 5, 5, 7, 9];

  it("모집단 표준편차", () => {
    expect(stddev(data)).toBeCloseTo(2, 5);
  });

  it("표본 표준편차 (sample: true)", () => {
    expect(stddev(data, true)).toBeCloseTo(2.138, 2);
  });

  it("빈 배열은 NaN", () => {
    expect(stddev([])).toBeNaN();
  });

  it("실사용: 성적 표준편차", () => {
    const scores = [70, 80, 85, 90, 95];
    expect(stddev(scores)).toBeCloseTo(8.60, 1);
  });
});
