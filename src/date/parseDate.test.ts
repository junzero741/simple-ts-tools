import { describe, expect, it } from "vitest";
import { parseDate } from "./parseDate";

function ymd(d: Date | null): string {
  if (!d) return "null";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("parseDate", () => {
  describe("ISO 형식", () => {
    it("YYYY-MM-DD", () => {
      expect(ymd(parseDate("2024-06-07"))).toBe("2024-06-07");
    });

    it("YYYY/MM/DD", () => {
      expect(ymd(parseDate("2024/06/07"))).toBe("2024-06-07");
    });

    it("YYYY.MM.DD", () => {
      expect(ymd(parseDate("2024.06.07"))).toBe("2024-06-07");
    });

    it("YYYY-MM-DDTHH:mm:ss (로컬 시각)", () => {
      const d = parseDate("2024-06-07T14:30:00");
      expect(d).not.toBeNull();
      expect(d!.getHours()).toBe(14);
      expect(d!.getMinutes()).toBe(30);
    });

    it("ISO 8601 with Z (UTC)", () => {
      const d = parseDate("2024-06-07T00:00:00Z");
      expect(d).not.toBeNull();
      expect(ymd(d!)).toBeDefined();
    });
  });

  describe("한국어 형식", () => {
    it("2024년 6월 7일", () => {
      expect(ymd(parseDate("2024년 6월 7일"))).toBe("2024-06-07");
    });

    it("공백 없는 한국어", () => {
      expect(ymd(parseDate("2024년6월7일"))).toBe("2024-06-07");
    });

    it("일 없는 형식은 null", () => {
      expect(parseDate("2024년 6월")).toBeNull();
    });
  });

  describe("슬래시 형식 (en-US / en-GB)", () => {
    it("MM/DD/YYYY (기본: en-US)", () => {
      expect(ymd(parseDate("06/07/2024"))).toBe("2024-06-07");
    });

    it("DD/MM/YYYY (en-GB)", () => {
      expect(ymd(parseDate("07/06/2024", "en-GB"))).toBe("2024-06-07");
    });

    it("en-US 명시적 지정", () => {
      expect(ymd(parseDate("06/07/2024", "en-US"))).toBe("2024-06-07");
    });
  });

  describe("잘못된 날짜 처리", () => {
    it("존재하지 않는 날짜 → null", () => {
      expect(parseDate("2024-02-30")).toBeNull(); // 2월 30일 없음
      expect(parseDate("2023-02-29")).toBeNull(); // 2023년은 윤년 아님
    });

    it("빈 문자열 → null", () => {
      expect(parseDate("")).toBeNull();
    });

    it("파싱 불가 문자열 → null", () => {
      expect(parseDate("not-a-date")).toBeNull();
      expect(parseDate("hello world")).toBeNull();
    });

    it("월이 13인 경우 → null", () => {
      expect(parseDate("2024-13-01")).toBeNull();
    });

    it("일이 0인 경우 → null", () => {
      expect(parseDate("2024-06-00")).toBeNull();
    });
  });

  describe("윤년 처리", () => {
    it("윤년 2월 29일", () => {
      expect(ymd(parseDate("2024-02-29"))).toBe("2024-02-29");
    });

    it("평년 2월 29일 → null", () => {
      expect(parseDate("2025-02-29")).toBeNull();
    });
  });
});
