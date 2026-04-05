import { describe, expect, it } from "vitest";
import { sum, sumBy } from "./sumBy";

describe("sum", () => {
  it("숫자 배열의 합을 반환한다", () => {
    expect(sum([1, 2, 3, 4, 5])).toBe(15);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(sum([])).toBe(0);
  });

  it("음수를 포함한 합을 계산한다", () => {
    expect(sum([1, -2, 3, -4])).toBe(-2);
  });

  it("소수 합을 계산한다", () => {
    expect(sum([0.1, 0.2, 0.3])).toBeCloseTo(0.6);
  });
});

describe("sumBy", () => {
  it("객체 배열의 특정 필드 합을 계산한다", () => {
    const items = [{ price: 10 }, { price: 20 }, { price: 30 }];
    expect(sumBy(items, (i) => i.price)).toBe(60);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(sumBy([], (i: { v: number }) => i.v)).toBe(0);
  });

  it("수량 * 단가 등 계산 값으로도 사용 가능하다", () => {
    const cart = [
      { name: "A", price: 10, qty: 2 },
      { name: "B", price: 5, qty: 3 },
      { name: "C", price: 20, qty: 1 },
    ];
    expect(sumBy(cart, (item) => item.price * item.qty)).toBe(55);
  });

  it("음수 값도 처리한다", () => {
    const items = [{ delta: 10 }, { delta: -3 }, { delta: 5 }];
    expect(sumBy(items, (i) => i.delta)).toBe(12);
  });

  it("단일 요소 배열을 처리한다", () => {
    expect(sumBy([{ v: 42 }], (i) => i.v)).toBe(42);
  });
});
