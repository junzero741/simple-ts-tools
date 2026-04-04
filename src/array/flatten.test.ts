import { describe, expect, it } from "vitest";
import { flatten } from "./flatten";

describe("flatten", () => {
  it("기본값(depth=1)으로 1단계만 펼친다", () => {
    expect(flatten([1, [2, 3], [4]])).toEqual([1, 2, 3, 4]);
  });

  it("depth=2로 2단계 펼친다", () => {
    expect(flatten([1, [2, [3, [4]]]], 2)).toEqual([1, 2, 3, [4]]);
  });

  it("Infinity로 완전히 펼친다", () => {
    expect(flatten([1, [2, [3, [4, [5]]]]], Infinity)).toEqual([1, 2, 3, 4, 5]);
  });

  it("이미 평탄한 배열은 그대로 반환한다", () => {
    expect(flatten([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("빈 배열을 처리한다", () => {
    expect(flatten([])).toEqual([]);
  });

  it("중첩 배열이 없으면 그대로 반환한다", () => {
    expect(flatten([[1], [2], [3]])).toEqual([1, 2, 3]);
  });

  it("depth=0이면 원본을 반환한다", () => {
    expect(flatten([[1, 2], [3]], 0)).toEqual([[1, 2], [3]]);
  });
});
