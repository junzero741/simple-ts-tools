import { describe, expect, it } from "vitest";
import { intersection } from "./intersection";

describe("intersection", () => {
  it("두 배열의 교집합을 반환한다", () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it("첫 번째 배열의 순서를 따른다", () => {
    expect(intersection([3, 1, 2], [1, 2, 3])).toEqual([3, 1, 2]);
  });

  it("교집합이 없으면 빈 배열을 반환한다", () => {
    expect(intersection([1, 2], [3, 4])).toEqual([]);
  });

  it("중복 요소는 한 번만 포함한다", () => {
    expect(intersection([1, 1, 2, 2], [1, 2])).toEqual([1, 2]);
  });

  it("keyFn으로 객체 배열의 교집합을 구한다", () => {
    const a = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const b = [{ id: 2 }, { id: 3 }, { id: 4 }];
    expect(intersection(a, b, u => u.id)).toEqual([{ id: 2 }, { id: 3 }]);
  });

  it("권한 체크 패턴: 공통 역할이 있는지 확인", () => {
    const userRoles = ["admin", "editor"];
    const requiredRoles = ["editor", "viewer"];
    expect(intersection(userRoles, requiredRoles).length > 0).toBe(true);
  });
});
