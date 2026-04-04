import { describe, expect, it } from "vitest";
import { range } from "./range";

describe("range", () => {
  it("기본 step(1)으로 [start, end) 배열을 만든다", () => {
    expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("start === end이면 빈 배열을 반환한다", () => {
    expect(range(3, 3)).toEqual([]);
  });

  it("양수 step으로 건너뛴다", () => {
    expect(range(1, 10, 2)).toEqual([1, 3, 5, 7, 9]);
    expect(range(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });

  it("음수 step으로 역방향 배열을 만든다", () => {
    expect(range(5, 0, -1)).toEqual([5, 4, 3, 2, 1]);
    expect(range(10, 0, -3)).toEqual([10, 7, 4, 1]);
  });

  it("step이 0이면 에러를 던진다", () => {
    expect(() => range(0, 5, 0)).toThrow("step must not be 0");
  });

  it("페이지네이션 숫자 생성에 활용할 수 있다", () => {
    // 1~5 페이지 버튼
    expect(range(1, 6)).toEqual([1, 2, 3, 4, 5]);
  });
});
