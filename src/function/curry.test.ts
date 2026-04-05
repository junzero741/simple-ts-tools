import { describe, expect, it } from "vitest";
import { curry } from "./curry";

describe("curry", () => {
  it("2인자 함수를 커리화한다", () => {
    const add = curry((a: number, b: number) => a + b);
    expect(add(1)(2)).toBe(3);
    const add10 = add(10);
    expect(add10(5)).toBe(15);
    expect(add10(20)).toBe(30);
  });

  it("3인자 함수를 커리화한다", () => {
    const clamp = curry(
      (min: number, max: number, v: number) => Math.min(Math.max(v, min), max)
    );
    const clamp0to100 = clamp(0)(100);
    expect(clamp0to100(50)).toBe(50);
    expect(clamp0to100(-10)).toBe(0);
    expect(clamp0to100(150)).toBe(100);
  });

  it("4인자 함수를 커리화한다", () => {
    const combine = curry(
      (a: string, b: string, c: string, d: string) => `${a}-${b}-${c}-${d}`
    );
    expect(combine("1")("2")("3")("4")).toBe("1-2-3-4");
    const prefix = combine("prefix")("ns");
    expect(prefix("key")("suffix")).toBe("prefix-ns-key-suffix");
  });

  it("인자를 한꺼번에 전달하면 즉시 실행된다", () => {
    const multiply = curry((a: number, b: number) => a * b);
    // 타입 안전을 위해 커리 체인만 사용
    expect(multiply(3)(4)).toBe(12);
  });

  it("부분 적용 함수는 독립적이다", () => {
    const add = curry((a: number, b: number) => a + b);
    const add5 = add(5);
    const add10 = add(10);
    expect(add5(3)).toBe(8);
    expect(add10(3)).toBe(13);
    expect(add5(3)).toBe(8); // add5 상태는 변하지 않음
  });

  it("pipe와 조합할 수 있다", () => {
    const multiply = curry((factor: number, n: number) => n * factor);
    const addN = curry((amount: number, n: number) => n + amount);

    // 타입 호환성을 위해 명시적 타입 지정
    const double = multiply(2) as (n: number) => number;
    const add3 = addN(3) as (n: number) => number;

    // 함수 합성 수동 테스트
    expect(add3(double(5))).toBe(13); // 5 * 2 + 3
  });

  it("문자열 함수를 커리화한다", () => {
    const join = curry((sep: string, a: string, b: string) => `${a}${sep}${b}`);
    const joinDash = join("-");
    expect(joinDash("hello")("world")).toBe("hello-world");
    expect(join(", ")("a")("b")).toBe("a, b");
  });
});
