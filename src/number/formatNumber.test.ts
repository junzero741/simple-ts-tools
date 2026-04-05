import { describe, expect, it } from "vitest";
import { formatNumber } from "./formatNumber";

describe("formatNumber", () => {
  it("천 단위 쉼표를 적용한다 (기본: ko-KR)", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(999)).toBe("999");
  });

  it("소수 자릿수를 적용한다", () => {
    expect(formatNumber(1234567.89, { decimals: 2 })).toBe("1,234,567.89");
    expect(formatNumber(1.5, { decimals: 1 })).toBe("1.5");
    expect(formatNumber(1.005, { decimals: 2 })).toBe("1.01");
  });

  it("소수 자릿수가 0이면 정수로 반올림한다", () => {
    expect(formatNumber(1234.7)).toBe("1,235");
    expect(formatNumber(1234.3)).toBe("1,234");
  });

  it("음수를 처리한다", () => {
    expect(formatNumber(-1234567)).toBe("-1,234,567");
    expect(formatNumber(-0.5, { decimals: 1 })).toBe("-0.5");
  });

  it("0을 처리한다", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(0, { decimals: 2 })).toBe("0.00");
  });

  it("en-US 로케일을 사용한다", () => {
    const result = formatNumber(1234567, { locale: "en-US" });
    expect(result).toBe("1,234,567");
  });

  it("currency 옵션으로 통화 기호를 포함한다", () => {
    const krw = formatNumber(50000, { currency: "KRW" });
    expect(krw).toContain("50,000");
    expect(krw).toContain("₩");
  });

  it("compact notation을 적용한다 (ko-KR)", () => {
    const result = formatNumber(10000, { notation: "compact" });
    expect(result).toContain("만");
  });
});
