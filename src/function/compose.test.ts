import { describe, expect, it } from "vitest";
import { compose } from "./compose";

describe("compose", () => {
  const double = (n: number) => n * 2;
  const addOne = (n: number) => n + 1;
  const square = (n: number) => n * n;
  const toString = (n: number) => String(n);

  it("오른쪽에서 왼쪽으로 함수를 합성한다", () => {
    // compose(f, g)(x) = f(g(x))
    const fn = compose(double, addOne);
    expect(fn(3)).toBe(8); // addOne(3)=4 → double(4)=8
  });

  it("3단계 합성", () => {
    const fn = compose(double, addOne, square);
    expect(fn(3)).toBe(20); // square(3)=9 → addOne(9)=10 → double(10)=20
    expect(fn(2)).toBe(10); // square(2)=4 → addOne(4)=5 → double(5)=10
  });

  it("단일 함수는 그대로 반환한다", () => {
    const fn = compose(double);
    expect(fn(5)).toBe(10);
  });

  it("타입 변환이 있는 합성 — 마지막 함수의 반환 타입이 변한다", () => {
    const fn = compose(toString, double);
    expect(fn(5)).toBe("10");
  });

  it("pipe(value, f, g)와 compose(g, f)(value)는 동일한 결과를 낸다", () => {
    // pipe: 왼쪽 → 오른쪽
    // compose: 오른쪽 → 왼쪽
    const value = 3;
    const pipeResult = addOne(double(value));         // double first, then addOne
    const composeResult = compose(addOne, double)(value); // double first, then addOne
    expect(composeResult).toBe(pipeResult); // 8
  });

  it("4단계 합성", () => {
    const trim = (s: string) => s.trim();
    const upper = (s: string) => s.toUpperCase();
    const exclaim = (s: string) => s + "!";
    const repeat = (s: string) => s + s;

    const fn = compose(repeat, exclaim, upper, trim);
    expect(fn("  hello  ")).toBe("HELLO!HELLO!");
  });

  it("배열 .map()과 함께 사용할 수 있다", () => {
    const transform = compose(double, addOne);
    expect([1, 2, 3].map(transform)).toEqual([4, 6, 8]);
  });

  it("합성된 함수는 여러 번 호출할 수 있다", () => {
    const fn = compose(double, addOne);
    expect(fn(1)).toBe(4);
    expect(fn(2)).toBe(6);
    expect(fn(3)).toBe(8);
  });

  it("항등 함수와 합성해도 값이 변하지 않는다", () => {
    const identity = <T>(x: T) => x;
    const fn = compose(identity, double);
    expect(fn(5)).toBe(10);
  });

  it("실사용: 사용자 이름 정규화 파이프라인", () => {
    const trim = (s: string) => s.trim();
    const lower = (s: string) => s.toLowerCase();
    const removeSpecial = (s: string) => s.replace(/[^a-z0-9]/g, "");

    const normalizeUsername = compose(removeSpecial, lower, trim);

    expect(normalizeUsername("  Alice_123  ")).toBe("alice123");
    expect(normalizeUsername(" Bob@Doe ")).toBe("bobdoe");
  });

  it("실사용: 숫자 처리 파이프라인", () => {
    const clamp = (max: number) => (n: number) => Math.min(n, max);
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const processPrice = compose(clamp(999.99), round2);
    expect(processPrice(1234.567)).toBe(999.99);
    expect(processPrice(12.345)).toBe(12.35);
  });
});
