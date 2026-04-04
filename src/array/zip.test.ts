import { describe, expect, it } from "vitest";
import { zip } from "./zip";

describe("zip", () => {
  it("두 배열을 인덱스 기준으로 묶는다", () => {
    expect(zip([1, 2, 3], ["a", "b", "c"])).toEqual([
      [1, "a"],
      [2, "b"],
      [3, "c"],
    ]);
  });

  it("세 배열도 처리한다", () => {
    expect(zip([1, 2], ["a", "b"], [true, false])).toEqual([
      [1, "a", true],
      [2, "b", false],
    ]);
  });

  it("가장 짧은 배열 길이에 맞춘다", () => {
    expect(zip([1, 2, 3], ["a", "b"])).toEqual([
      [1, "a"],
      [2, "b"],
    ]);
  });

  it("배열 중 하나가 비어 있으면 빈 배열을 반환한다", () => {
    expect(zip([1, 2, 3], [])).toEqual([]);
  });

  it("인자가 없으면 빈 배열을 반환한다", () => {
    expect(zip()).toEqual([]);
  });

  it("단일 배열을 래핑해 반환한다", () => {
    expect(zip([1, 2, 3])).toEqual([[1], [2], [3]]);
  });
});
