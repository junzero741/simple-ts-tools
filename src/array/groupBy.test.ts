import { describe, expect, it } from "vitest";
import { groupBy } from "./groupBy";

describe("groupBy", () => {
  it("홀수/짝수로 그룹핑한다", () => {
    const result = groupBy([1, 2, 3, 4, 5], (x) => (x % 2 === 0 ? "even" : "odd"));
    expect(result).toEqual({ odd: [1, 3, 5], even: [2, 4] });
  });

  it("문자열 키로 그룹핑한다", () => {
    const users = [
      { name: "Alice", role: "admin" },
      { name: "Bob", role: "user" },
      { name: "Carol", role: "admin" },
    ];
    const result = groupBy(users, (u) => u.role);
    expect(result.admin).toHaveLength(2);
    expect(result.user).toHaveLength(1);
  });

  it("빈 배열은 빈 객체를 반환한다", () => {
    expect(groupBy([], (x) => x)).toEqual({});
  });

  it("모든 요소가 같은 키면 하나의 그룹이 된다", () => {
    expect(groupBy([1, 2, 3], () => "all")).toEqual({ all: [1, 2, 3] });
  });
});
