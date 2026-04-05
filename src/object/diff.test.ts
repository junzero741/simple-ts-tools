import { describe, expect, it } from "vitest";
import { diff, isDiffEmpty } from "./diff";

describe("diff", () => {
  it("동일한 객체는 모두 빈 결과를 반환한다", () => {
    const result = diff({ a: 1, b: "hello" }, { a: 1, b: "hello" });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });

  it("b에만 있는 키는 added에 담긴다", () => {
    const result = diff({ a: 1 }, { a: 1, b: 2 });
    expect(result.added).toEqual({ b: 2 });
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });

  it("a에만 있는 키는 removed에 담긴다", () => {
    const result = diff({ a: 1, b: 2 }, { a: 1 });
    expect(result.removed).toEqual({ b: 2 });
    expect(result.added).toEqual({});
    expect(result.changed).toEqual({});
  });

  it("값이 바뀐 키는 changed에 from/to로 담긴다", () => {
    const result = diff({ a: 1, b: 2 }, { a: 1, b: 9 });
    expect(result.changed).toEqual({ b: { from: 2, to: 9 } });
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
  });

  it("세 가지 변화가 동시에 발생한다", () => {
    const a = { keep: 1, remove: 2, change: "old" };
    const b = { keep: 1, add: 3,    change: "new" };
    const result = diff(a, b);
    expect(result.added).toEqual({ add: 3 });
    expect(result.removed).toEqual({ remove: 2 });
    expect(result.changed).toEqual({ change: { from: "old", to: "new" } });
  });

  it("빈 객체끼리는 변경사항이 없다", () => {
    expect(isDiffEmpty(diff({}, {}))).toBe(true);
  });

  it("객체 값의 깊은 동등 비교를 사용한다", () => {
    const a = { obj: { x: 1 } };
    const b = { obj: { x: 1 } };  // 참조는 다르지만 값은 같음
    const result = diff(a, b);
    expect(result.changed).toEqual({});
  });

  it("배열 값의 변경을 감지한다", () => {
    const result = diff({ tags: ["a", "b"] }, { tags: ["a", "c"] });
    expect(result.changed.tags).toBeDefined();
    expect(result.changed.tags).toEqual({ from: ["a", "b"], to: ["a", "c"] });
  });

  it("null 값을 올바르게 처리한다", () => {
    const result = diff({ a: null }, { a: null });
    expect(result.changed).toEqual({});
  });

  it("null → 값 변경을 감지한다", () => {
    const result = diff({ a: null }, { a: 1 });
    expect(result.changed).toEqual({ a: { from: null, to: 1 } });
  });

  it("값 → undefined 변경을 감지한다", () => {
    const result = diff({ a: 1 }, { a: undefined });
    expect(result.changed).toEqual({ a: { from: 1, to: undefined } });
  });
});

describe("isDiffEmpty", () => {
  it("변경사항이 없으면 true", () => {
    expect(isDiffEmpty(diff({ a: 1 }, { a: 1 }))).toBe(true);
  });

  it("변경사항이 있으면 false", () => {
    expect(isDiffEmpty(diff({ a: 1 }, { a: 2 }))).toBe(false);
    expect(isDiffEmpty(diff({ a: 1 }, {}))).toBe(false);
    expect(isDiffEmpty(diff({}, { a: 1 }))).toBe(false);
  });

  it("실사용: 폼 dirty state 감지", () => {
    const initial = { name: "Alice", email: "alice@example.com" };
    const current = { name: "Alice", email: "alice@example.com" };
    expect(isDiffEmpty(diff(initial, current))).toBe(true);

    const modified = { name: "Bob", email: "alice@example.com" };
    expect(isDiffEmpty(diff(initial, modified))).toBe(false);
  });
});
