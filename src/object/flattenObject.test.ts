import { describe, expect, it } from "vitest";
import { flattenObject, unflattenObject } from "./flattenObject";

describe("flattenObject", () => {
  it("단순 중첩 객체를 평탄화한다", () => {
    expect(flattenObject({ a: { b: { c: 1 }, d: 2 } })).toEqual({
      "a.b.c": 1,
      "a.d": 2,
    });
  });

  it("이미 평탄한 객체는 그대로 반환한다", () => {
    expect(flattenObject({ x: 1, y: "hello" })).toEqual({ x: 1, y: "hello" });
  });

  it("배열 인덱스를 키로 사용한다", () => {
    expect(flattenObject({ items: ["a", "b", "c"] })).toEqual({
      "items.0": "a",
      "items.1": "b",
      "items.2": "c",
    });
  });

  it("배열 안의 객체를 평탄화한다", () => {
    expect(flattenObject({ list: [{ name: "Alice" }, { name: "Bob" }] })).toEqual({
      "list.0.name": "Alice",
      "list.1.name": "Bob",
    });
  });

  it("null 값을 보존한다", () => {
    expect(flattenObject({ a: { b: null } })).toEqual({ "a.b": null });
  });

  it("undefined 값을 보존한다", () => {
    expect(flattenObject({ a: { b: undefined } })).toEqual({ "a.b": undefined });
  });

  it("커스텀 separator를 사용할 수 있다", () => {
    expect(flattenObject({ a: { b: 1 } }, "_")).toEqual({ a_b: 1 });
    expect(flattenObject({ a: { b: 1 } }, "/")).toEqual({ "a/b": 1 });
  });

  it("빈 객체를 처리한다", () => {
    expect(flattenObject({})).toEqual({});
  });

  it("빈 중첩 객체는 해당 키를 유지한다", () => {
    expect(flattenObject({ a: {} })).toEqual({ a: {} });
  });

  it("빈 배열은 해당 키를 유지한다", () => {
    expect(flattenObject({ a: [] })).toEqual({ a: [] });
  });

  it("숫자, 불리언, 문자열 값을 처리한다", () => {
    expect(flattenObject({ a: { n: 42, b: true, s: "hello" } })).toEqual({
      "a.n": 42,
      "a.b": true,
      "a.s": "hello",
    });
  });
});

describe("unflattenObject", () => {
  it("평탄화된 객체를 중첩 구조로 복원한다", () => {
    expect(unflattenObject({ "a.b.c": 1, "a.d": 2 })).toEqual({
      a: { b: { c: 1 }, d: 2 },
    });
  });

  it("단순 키는 그대로 반환한다", () => {
    expect(unflattenObject({ x: 1, y: "hello" })).toEqual({ x: 1, y: "hello" });
  });

  it("인덱스 키를 배열로 복원한다", () => {
    expect(unflattenObject({ "items.0": "a", "items.1": "b", "items.2": "c" })).toEqual({
      items: ["a", "b", "c"],
    });
  });

  it("커스텀 separator를 사용할 수 있다", () => {
    expect(unflattenObject({ a_b_c: 1 }, "_")).toEqual({ a: { b: { c: 1 } } });
  });

  it("빈 객체를 처리한다", () => {
    expect(unflattenObject({})).toEqual({});
  });
});

describe("flattenObject + unflattenObject 왕복", () => {
  it("단순 중첩 객체 왕복", () => {
    const original = { a: { b: { c: 1 }, d: 2 }, e: 3 };
    expect(unflattenObject(flattenObject(original))).toEqual(original);
  });

  it("다양한 타입 왕복", () => {
    const original = { user: { name: "Alice", age: 30, active: true } };
    expect(unflattenObject(flattenObject(original))).toEqual(original);
  });
});
