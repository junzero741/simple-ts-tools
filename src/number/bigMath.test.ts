import { describe, it, expect } from "vitest";
import {
  preciseAdd, preciseSubtract, preciseMultiply, preciseDivide,
  preciseRound, bankersRound, splitAmount, roundTo,
} from "./bigMath";

describe("preciseAdd", () => {
  it("0.1 + 0.2 = 0.3", () => {
    expect(preciseAdd(0.1, 0.2)).toBe(0.3);
  });

  it("일반 덧셈도 정확", () => {
    expect(preciseAdd(1.23, 4.56)).toBe(5.79);
    expect(preciseAdd(0, 0)).toBe(0);
    expect(preciseAdd(-1.5, 2.5)).toBe(1);
  });
});

describe("preciseSubtract", () => {
  it("1.0 - 0.9 = 0.1", () => {
    expect(preciseSubtract(1.0, 0.9)).toBe(0.1);
  });

  it("0.3 - 0.1 = 0.2", () => {
    expect(preciseSubtract(0.3, 0.1)).toBe(0.2);
  });
});

describe("preciseMultiply", () => {
  it("0.1 * 0.2 = 0.02", () => {
    expect(preciseMultiply(0.1, 0.2)).toBe(0.02);
  });

  it("19.9 * 100 = 1990", () => {
    expect(preciseMultiply(19.9, 100)).toBe(1990);
  });

  it("음수", () => {
    expect(preciseMultiply(-0.1, 0.3)).toBe(-0.03);
  });
});

describe("preciseDivide", () => {
  it("1 / 3 ≈ 0.3333333333", () => {
    expect(preciseDivide(1, 3)).toBe(0.3333333333);
  });

  it("소수점 자릿수 지정", () => {
    expect(preciseDivide(1, 3, 4)).toBe(0.3333);
    expect(preciseDivide(10, 3, 2)).toBe(3.33);
  });

  it("0으로 나누면 에러", () => {
    expect(() => preciseDivide(1, 0)).toThrow("Division by zero");
  });

  it("정확한 나눗셈", () => {
    expect(preciseDivide(10, 2, 2)).toBe(5);
  });
});

describe("preciseRound", () => {
  it("소수점 반올림", () => {
    expect(preciseRound(2.555, 2)).toBe(2.56);
    expect(preciseRound(1.005, 2)).toBe(1.01);
    expect(preciseRound(1.004, 2)).toBe(1);
  });

  it("0자리 반올림", () => {
    expect(preciseRound(2.5, 0)).toBe(3);
    expect(preciseRound(2.4, 0)).toBe(2);
  });
});

describe("bankersRound", () => {
  it("0.5일 때 짝수로 반올림", () => {
    expect(bankersRound(0.5)).toBe(0);
    expect(bankersRound(1.5)).toBe(2);
    expect(bankersRound(2.5)).toBe(2);
    expect(bankersRound(3.5)).toBe(4);
  });

  it("0.5가 아닌 경우 일반 반올림", () => {
    expect(bankersRound(2.3)).toBe(2);
    expect(bankersRound(2.7)).toBe(3);
  });

  it("소수점 자릿수 지정", () => {
    expect(bankersRound(2.55, 1)).toBe(2.6);
    expect(bankersRound(2.45, 1)).toBe(2.4);
  });
});

describe("splitAmount", () => {
  it("균등 분할", () => {
    expect(splitAmount(100, 4)).toEqual([25, 25, 25, 25]);
  });

  it("나머지를 앞 항목에 분배", () => {
    const parts = splitAmount(100, 3);
    expect(parts).toEqual([33.34, 33.33, 33.33]);
    expect(parts.reduce((a, b) => preciseAdd(a, b), 0)).toBe(100);
  });

  it("1원 단위 분할", () => {
    const parts = splitAmount(10, 3, 0);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10);
  });

  it("1명이면 전액", () => {
    expect(splitAmount(99.99, 1)).toEqual([99.99]);
  });

  it("parts < 1이면 에러", () => {
    expect(() => splitAmount(100, 0)).toThrow("parts must be at least 1");
  });
});

describe("roundTo", () => {
  it("5센트 단위 반올림", () => {
    expect(roundTo(1.23, 0.05)).toBeCloseTo(1.25, 10);
    expect(roundTo(1.22, 0.05)).toBeCloseTo(1.20, 10);
  });

  it("5 단위 반올림", () => {
    expect(roundTo(17, 5)).toBe(15);
    expect(roundTo(18, 5)).toBe(20);
  });

  it("floor 모드", () => {
    expect(roundTo(17, 5, "floor")).toBe(15);
    expect(roundTo(19, 5, "floor")).toBe(15);
  });

  it("ceil 모드", () => {
    expect(roundTo(11, 5, "ceil")).toBe(15);
    expect(roundTo(15, 5, "ceil")).toBe(15);
  });
});
