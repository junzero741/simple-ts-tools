import { describe, it, expect } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("균등하게 나누어지는 경우", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
  });

  it("나머지가 있는 경우", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("size가 배열보다 큰 경우", () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it("빈 배열", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("size가 1 미만이면 에러", () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});
