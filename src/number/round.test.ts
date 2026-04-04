import { describe, expect, it } from "vitest";
import { round } from "./round";

describe("round", () => {
  it("소수 자릿수로 반올림한다", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.2355, 2)).toBe(1.24);
    expect(round(1.5)).toBe(2);
  });

  it("decimals 기본값 0은 정수로 반올림한다", () => {
    expect(round(3.7)).toBe(4);
    expect(round(3.2)).toBe(3);
  });

  it("부동소수점 오차를 보정한다", () => {
    // Math.round(1.005 * 100) / 100 === 1.00 (기존 방식의 버그)
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(1.255, 2)).toBe(1.26);
  });

  it("음수 decimals로 정수 단위 반올림을 한다", () => {
    expect(round(1234, -2)).toBe(1200);
    expect(round(1250, -2)).toBe(1300);
    expect(round(1234, -3)).toBe(1000);
  });

  it("음수 값도 올바르게 반올림한다", () => {
    expect(round(-1.5)).toBe(-1); // Math.round(-1.5) === -1
    expect(round(-1.2345, 2)).toBe(-1.23);
  });

  it("decimals이 실제 자릿수보다 크면 그대로 반환한다", () => {
    expect(round(1.5, 5)).toBe(1.5);
  });
});
