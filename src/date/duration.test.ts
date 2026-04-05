import { describe, it, expect } from "vitest";
import { duration } from "./duration";

describe("duration", () => {
  describe("파싱", () => {
    it("밀리초 숫자를 받는다", () => {
      expect(duration(5000).ms).toBe(5000);
    });

    it("단일 단위 문자열을 파싱한다", () => {
      expect(duration("500ms").ms).toBe(500);
      expect(duration("10s").ms).toBe(10_000);
      expect(duration("5m").ms).toBe(300_000);
      expect(duration("2h").ms).toBe(7_200_000);
      expect(duration("1d").ms).toBe(86_400_000);
      expect(duration("1w").ms).toBe(604_800_000);
    });

    it("복합 단위 문자열을 파싱한다", () => {
      expect(duration("2h30m").ms).toBe(9_000_000);
      expect(duration("1d12h").ms).toBe(129_600_000);
      expect(duration("1m30s").ms).toBe(90_000);
      expect(duration("1h30m45s").ms).toBe(5_445_000);
    });

    it("소수점을 지원한다", () => {
      expect(duration("1.5h").ms).toBe(5_400_000);
      expect(duration("0.5s").ms).toBe(500);
    });

    it("유효하지 않은 문자열에 에러를 던진다", () => {
      expect(() => duration("abc")).toThrow("Invalid duration string");
    });

    it("0을 처리한다", () => {
      expect(duration(0).ms).toBe(0);
    });
  });

  describe("format", () => {
    it("밀리초를 사람 읽기 포맷으로 변환한다", () => {
      expect(duration(3_661_000).format()).toBe("1h1m1s");
      expect(duration(90_000).format()).toBe("1m30s");
      expect(duration(86_400_000).format()).toBe("1d");
      expect(duration(500).format()).toBe("500ms");
    });

    it("복합 포맷", () => {
      expect(duration("1d2h3m4s5ms").format()).toBe("1d2h3m4s5ms");
    });

    it("0은 0ms", () => {
      expect(duration(0).format()).toBe("0ms");
    });

    it("음수는 - 접두사", () => {
      expect(duration(-5000).format()).toBe("-5s");
    });
  });

  describe("단위 변환", () => {
    it("toSeconds", () => {
      expect(duration("1m30s").toSeconds()).toBe(90);
    });

    it("toMinutes", () => {
      expect(duration("2h").toMinutes()).toBe(120);
    });

    it("toHours", () => {
      expect(duration("1d12h").toHours()).toBe(36);
    });

    it("toDays", () => {
      expect(duration("1w").toDays()).toBe(7);
    });
  });

  describe("연산", () => {
    it("add — 문자열", () => {
      expect(duration("1h").add("30m").format()).toBe("1h30m");
    });

    it("add — 숫자", () => {
      expect(duration("1h").add(60_000).format()).toBe("1h1m");
    });

    it("add — Duration", () => {
      const a = duration("1h");
      const b = duration("30m");
      expect(a.add(b).format()).toBe("1h30m");
    });

    it("subtract", () => {
      expect(duration("2h").subtract("45m").format()).toBe("1h15m");
    });

    it("multiply", () => {
      expect(duration("30m").multiply(3).format()).toBe("1h30m");
    });

    it("연산은 원본을 변경하지 않는다", () => {
      const a = duration("1h");
      a.add("30m");
      expect(a.ms).toBe(3_600_000);
    });
  });

  describe("비교", () => {
    const h1 = duration("1h");
    const m30 = duration("30m");
    const h1b = duration("60m");

    it("gt", () => {
      expect(h1.gt(m30)).toBe(true);
      expect(m30.gt(h1)).toBe(false);
    });

    it("gte", () => {
      expect(h1.gte(h1b)).toBe(true);
      expect(h1.gte(m30)).toBe(true);
    });

    it("lt", () => {
      expect(m30.lt(h1)).toBe(true);
      expect(h1.lt(m30)).toBe(false);
    });

    it("lte", () => {
      expect(h1.lte(h1b)).toBe(true);
    });

    it("eq", () => {
      expect(h1.eq(h1b)).toBe(true);
      expect(h1.eq(m30)).toBe(false);
    });
  });

  describe("라운드트립", () => {
    it("format → parse가 일관된다", () => {
      const original = duration("2d5h30m15s");
      const reparsed = duration(original.format());
      expect(reparsed.ms).toBe(original.ms);
    });
  });
});
