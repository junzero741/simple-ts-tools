import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCompact,
  formatPercent,
  formatUnit,
  formatOrdinal,
  formatList,
} from "./intlFormat";

describe("Intl 포매터", () => {
  describe("formatCurrency", () => {
    it("USD 포맷", () => {
      expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
    });

    it("EUR 포맷", () => {
      const result = formatCurrency(1234.5, "EUR", "de-DE");
      expect(result).toContain("1.234,50");
    });

    it("KRW — 소수점 없음", () => {
      const result = formatCurrency(1234.5, "KRW", "ko-KR");
      expect(result).toContain("1,235"); // 반올림
    });

    it("0 포맷", () => {
      expect(formatCurrency(0, "USD")).toBe("$0.00");
    });

    it("음수 포맷", () => {
      const result = formatCurrency(-99.99, "USD");
      expect(result).toContain("99.99");
    });
  });

  describe("formatCompact", () => {
    it("천 단위 (K)", () => {
      expect(formatCompact(1500)).toBe("1.5K");
    });

    it("백만 단위 (M)", () => {
      expect(formatCompact(1_500_000)).toBe("1.5M");
    });

    it("십억 단위 (B)", () => {
      expect(formatCompact(2_000_000_000)).toBe("2B");
    });

    it("작은 수는 그대로", () => {
      expect(formatCompact(42)).toBe("42");
    });

    it("한국어 로케일", () => {
      const result = formatCompact(15000, "ko-KR");
      expect(result).toContain("1.5만");
    });
  });

  describe("formatPercent", () => {
    it("기본 — 소수점 없음", () => {
      expect(formatPercent(0.1234)).toBe("12%");
    });

    it("소수점 지정", () => {
      expect(formatPercent(0.1234, { decimals: 1 })).toBe("12.3%");
    });

    it("0%", () => {
      expect(formatPercent(0)).toBe("0%");
    });

    it("100%", () => {
      expect(formatPercent(1)).toBe("100%");
    });
  });

  describe("formatUnit", () => {
    it("킬로미터", () => {
      const result = formatUnit(42, "kilometer");
      expect(result).toContain("42");
      expect(result).toContain("km");
    });

    it("섭씨 온도", () => {
      const result = formatUnit(36.5, "celsius");
      expect(result).toContain("36.5");
    });
  });

  describe("formatOrdinal", () => {
    it("영어 서수", () => {
      expect(formatOrdinal(1)).toBe("1st");
      expect(formatOrdinal(2)).toBe("2nd");
      expect(formatOrdinal(3)).toBe("3rd");
      expect(formatOrdinal(4)).toBe("4th");
      expect(formatOrdinal(11)).toBe("11th");
      expect(formatOrdinal(12)).toBe("12th");
      expect(formatOrdinal(13)).toBe("13th");
      expect(formatOrdinal(21)).toBe("21st");
      expect(formatOrdinal(22)).toBe("22nd");
    });
  });

  describe("formatList", () => {
    it("conjunction (and)", () => {
      expect(formatList(["a", "b", "c"])).toBe("a, b, and c");
    });

    it("disjunction (or)", () => {
      expect(formatList(["a", "b", "c"], "en-US", "disjunction")).toBe("a, b, or c");
    });

    it("두 요소", () => {
      expect(formatList(["a", "b"])).toBe("a and b");
    });

    it("한 요소", () => {
      expect(formatList(["a"])).toBe("a");
    });

    it("한국어", () => {
      const result = formatList(["사과", "바나나", "포도"], "ko-KR");
      expect(result).toContain("사과");
      expect(result).toContain("바나나");
      expect(result).toContain("포도");
    });
  });

  describe("캐시", () => {
    it("같은 옵션으로 반복 호출해도 정상 동작한다", () => {
      for (let i = 0; i < 100; i++) {
        expect(formatCurrency(i, "USD")).toContain("$");
      }
    });
  });
});
