import { describe, expect, it } from "vitest";
import { pipe } from "./pipe";

describe("pipe", () => {
  it("단계 없이 호출하면 값을 그대로 반환한다", () => {
    expect(pipe(42)).toBe(42);
    expect(pipe("hello")).toBe("hello");
  });

  it("단일 함수를 적용한다", () => {
    expect(pipe(5, x => x * 2)).toBe(10);
  });

  it("여러 함수를 왼쪽→오른쪽 순서로 적용한다", () => {
    const result = pipe(
      "  hello world  ",
      s => s.trim(),
      s => s.toUpperCase(),
      s => s.replace(" ", "_"),
    );
    expect(result).toBe("HELLO_WORLD");
  });

  it("타입이 단계마다 변환된다", () => {
    const result = pipe(
      "42",
      s => parseInt(s, 10),  // string → number
      n => n * 2,             // number → number
      n => String(n),         // number → string
    );
    expect(result).toBe("84");
  });

  it("라이브러리 유틸과 조합할 수 있다", () => {
    const result = pipe(
      [3, 1, 2, 2, 1, 3, 4],
      (arr: number[]) => arr.filter(x => x % 2 !== 0),    // [3, 1, 1, 3]
      (arr: number[]) => [...new Set(arr)],                // [3, 1]
      (arr: number[]) => arr.sort((a, b) => a - b),        // [1, 3]
    );
    expect(result).toEqual([1, 3]);
  });

  it("객체 변환 파이프라인을 구성할 수 있다", () => {
    const result = pipe(
      { name: "  Alice  ", age: 17 },
      u => ({ ...u, name: u.name.trim() }),
      u => ({ ...u, isAdult: u.age >= 18 }),
    );
    expect(result).toEqual({ name: "Alice", age: 17, isAdult: false });
  });
});
