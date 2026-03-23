import { describe, it, expect, expectTypeOf } from "vitest";
import { tuple } from "./tuple";

describe("tuple", () => {
  it("단일 값 튜플", () => {
    expect(tuple(1)).toEqual([1]);
  });

  it("여러 값 튜플", () => {
    expect(tuple(1, "hello", true)).toEqual([1, "hello", true]);
  });

  it("빈 튜플", () => {
    expect(tuple()).toEqual([]);
  });

  it("동일 타입 튜플", () => {
    expect(tuple(1, 2, 3)).toEqual([1, 2, 3]);
  });

  it("튜플 타입으로 추론된다", () => {
    const result = tuple(1, "hello", true);
    expectTypeOf(result).toEqualTypeOf<[number, string, boolean]>();
  });

  it("일반 배열과 달리 각 요소의 타입이 유지된다", () => {
    const result = tuple(42, "world");
    expectTypeOf(result[0]).toEqualTypeOf<number>();
    expectTypeOf(result[1]).toEqualTypeOf<string>();
  });
});
