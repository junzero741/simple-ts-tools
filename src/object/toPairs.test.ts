import { describe, expect, it } from "vitest";
import { fromPairs, toPairs } from "./toPairs";

describe("toPairs", () => {
  it("객체를 [키, 값] 튜플 배열로 변환한다", () => {
    expect(toPairs({ a: 1, b: 2, c: 3 })).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });

  it("빈 객체는 빈 배열을 반환한다", () => {
    expect(toPairs({})).toEqual([]);
  });

  it("혼합 타입 값을 처리한다", () => {
    const result = toPairs({ name: "Alice", age: 30, active: true });
    expect(result).toEqual([
      ["name", "Alice"],
      ["age", 30],
      ["active", true],
    ]);
  });
});

describe("fromPairs", () => {
  it("[키, 값] 튜플 배열을 객체로 변환한다", () => {
    expect(
      fromPairs([
        ["a", 1],
        ["b", 2],
      ])
    ).toEqual({ a: 1, b: 2 });
  });

  it("빈 배열은 빈 객체를 반환한다", () => {
    expect(fromPairs([])).toEqual({});
  });

  it("키가 중복되면 마지막 값이 남는다", () => {
    expect(fromPairs([["a", 1], ["a", 99]])).toEqual({ a: 99 });
  });

  it("toPairs와 fromPairs는 왕복 가능하다", () => {
    const obj = { x: 10, y: 20, z: 30 };
    expect(fromPairs(toPairs(obj) as [string, number][])).toEqual(obj);
  });

  it("값 변환 파이프라인 패턴 — 필터 후 재조립", () => {
    const prices = { apple: 300, banana: 150, cherry: 500 };
    // 300원 이상만 유지
    const expensive = fromPairs(
      toPairs(prices).filter(([, v]) => v >= 300) as [string, number][]
    );
    expect(expensive).toEqual({ apple: 300, cherry: 500 });
  });
});
