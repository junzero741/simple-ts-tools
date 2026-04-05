import { describe, expect, it } from "vitest";
import { negate } from "./negate";

describe("negate", () => {
  it("true를 반환하는 술어를 반전시킨다", () => {
    const isEven = (n: number) => n % 2 === 0;
    const isOdd = negate(isEven);
    expect(isOdd(1)).toBe(true);
    expect(isOdd(2)).toBe(false);
  });

  it("false를 반환하는 술어를 반전시킨다", () => {
    const alwaysFalse = () => false;
    expect(negate(alwaysFalse)()).toBe(true);
  });

  it("반환된 함수는 여러 번 호출할 수 있다", () => {
    const isPositive = (n: number) => n > 0;
    const isNonPositive = negate(isPositive);
    expect(isNonPositive(-1)).toBe(true);
    expect(isNonPositive(0)).toBe(true);
    expect(isNonPositive(1)).toBe(false);
  });

  it("여러 인자를 받는 술어도 반전시킨다", () => {
    const isGreater = (a: number, b: number) => a > b;
    const isNotGreater = negate(isGreater);
    expect(isNotGreater(5, 3)).toBe(false);
    expect(isNotGreater(3, 5)).toBe(true);
    expect(isNotGreater(3, 3)).toBe(true);
  });

  describe("실사용 시나리오", () => {
    it("Array.filter와 함께 — falsy/nil 제거", () => {
      const isNil = (v: unknown): v is null | undefined => v == null;
      const isNotNil = negate(isNil);
      const arr = [1, null, 2, undefined, 3];
      expect(arr.filter(isNotNil)).toEqual([1, 2, 3]);
    });

    it("Array.filter — 짝수 제거 (홀수만)", () => {
      const isEven = (n: number) => n % 2 === 0;
      expect([1, 2, 3, 4, 5].filter(negate(isEven))).toEqual([1, 3, 5]);
    });

    it("빈 문자열 필터링", () => {
      const isEmpty = (s: string) => s.length === 0;
      const lines = ["hello", "", "world", ""];
      expect(lines.filter(negate(isEmpty))).toEqual(["hello", "world"]);
    });

    it("partition의 보완 — 같은 술어로 포함/제외 나누기", () => {
      const isAdmin = (u: { role: string }) => u.role === "admin";
      const users = [
        { role: "admin" },
        { role: "user" },
        { role: "admin" },
        { role: "guest" },
      ];
      const admins = users.filter(isAdmin);
      const nonAdmins = users.filter(negate(isAdmin));
      expect(admins).toHaveLength(2);
      expect(nonAdmins).toHaveLength(2);
    });
  });
});
