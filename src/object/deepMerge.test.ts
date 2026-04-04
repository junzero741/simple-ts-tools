import { describe, expect, it } from "vitest";
import { deepMerge } from "./deepMerge";

describe("deepMerge", () => {
  it("최상위 키를 병합한다", () => {
    expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("source가 target 값을 덮어쓴다", () => {
    expect(deepMerge({ a: 1, b: 2 }, { b: 99 })).toEqual({ a: 1, b: 99 });
  });

  it("중첩 plain 객체를 재귀적으로 병합한다", () => {
    const target = { a: 1, b: { x: 1, y: 2 } };
    const source = { b: { y: 99, z: 3 }, c: 4 };
    expect(deepMerge(target, source)).toEqual({ a: 1, b: { x: 1, y: 99, z: 3 }, c: 4 });
  });

  it("깊게 중첩된 객체도 병합한다", () => {
    const target = { a: { b: { c: 1, d: 2 } } };
    const source = { a: { b: { d: 99, e: 3 } } };
    expect(deepMerge(target, source)).toEqual({ a: { b: { c: 1, d: 99, e: 3 } } });
  });

  it("배열은 병합하지 않고 source 값으로 덮어쓴다", () => {
    expect(deepMerge({ arr: [1, 2, 3] }, { arr: [4, 5] })).toEqual({ arr: [4, 5] });
  });

  it("Date는 source 값으로 덮어쓴다", () => {
    const d1 = new Date("2024-01-01");
    const d2 = new Date("2025-06-01");
    expect(deepMerge({ date: d1 }, { date: d2 })).toEqual({ date: d2 });
  });

  it("원본 객체를 변경하지 않는다 (비파괴)", () => {
    const target = { a: { x: 1 } };
    const source = { a: { y: 2 } };
    deepMerge(target, source);
    expect(target).toEqual({ a: { x: 1 } });
    expect(source).toEqual({ a: { y: 2 } });
  });

  it("빈 객체와 병합한다", () => {
    expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(deepMerge({}, { b: 2 })).toEqual({ b: 2 });
  });

  it("null 값은 source 값으로 덮어쓴다", () => {
    expect(deepMerge({ a: { x: 1 } }, { a: null as unknown as object })).toEqual({ a: null });
  });

  it("설정 기본값 패턴: 사용자 설정이 기본값을 부분 덮어씀", () => {
    const defaults = { host: "localhost", port: 3000, db: { name: "dev", pool: 5 } };
    const userConfig = { port: 8080, db: { name: "prod" } };
    expect(deepMerge(defaults, userConfig)).toEqual({
      host: "localhost",
      port: 8080,
      db: { name: "prod", pool: 5 },
    });
  });
});
