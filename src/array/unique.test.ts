import { describe, expect, it } from "vitest";
import { unique } from "./unique";

describe("unique", () => {
  it("원시값 중복을 제거한다", () => {
    expect(unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    expect(unique(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
  });

  it("첫 등장 순서를 유지한다", () => {
    expect(unique([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(unique([])).toEqual([]);
  });

  it("중복이 없으면 원본과 동일한 내용을 반환한다", () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("keyFn으로 객체 배열의 중복을 제거한다", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 1, name: "Alice (dup)" },
    ];
    expect(unique(users, (u) => u.id)).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  it("keyFn으로 대소문자 무시 중복 제거를 할 수 있다", () => {
    expect(unique(["React", "react", "Vue", "vue"], (t) => t.toLowerCase()))
      .toEqual(["React", "Vue"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const arr = [1, 2, 2, 3];
    unique(arr);
    expect(arr).toEqual([1, 2, 2, 3]);
  });
});
