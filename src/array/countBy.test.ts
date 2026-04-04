import { describe, expect, it } from "vitest";
import { countBy } from "./countBy";

describe("countBy", () => {
  it("문자열 배열의 등장 횟수를 센다", () => {
    expect(countBy(["a", "b", "a", "c", "b", "a"], (x) => x)).toEqual({
      a: 3,
      b: 2,
      c: 1,
    });
  });

  it("객체 배열을 키 기준으로 집계한다", () => {
    const users = [
      { role: "admin" },
      { role: "viewer" },
      { role: "admin" },
      { role: "viewer" },
      { role: "viewer" },
    ];
    expect(countBy(users, (u) => u.role)).toEqual({
      admin: 2,
      viewer: 3,
    });
  });

  it("파생 키(계산값)로도 집계한다", () => {
    const nums = [1, 2, 3, 4, 5, 6];
    expect(countBy(nums, (n) => (n % 2 === 0 ? "even" : "odd"))).toEqual({
      odd: 3,
      even: 3,
    });
  });

  it("숫자 키도 지원한다", () => {
    const items = [{ score: 90 }, { score: 80 }, { score: 90 }];
    expect(countBy(items, (i) => i.score)).toEqual({ 90: 2, 80: 1 });
  });

  it("빈 배열이면 빈 객체를 반환한다", () => {
    expect(countBy([], (x: string) => x)).toEqual({});
  });

  it("모든 요소가 같은 키이면 단일 키로 집계한다", () => {
    expect(countBy([1, 2, 3], () => "all")).toEqual({ all: 3 });
  });
});
