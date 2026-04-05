import { describe, expect, it } from "vitest";
import { formatDate } from "./formatDate";

const d = new Date("2024-06-07T09:05:03");   // 금요일 오전 9시 5분 3초
const noon = new Date("2024-01-01T14:30:00"); // 오후 2시 30분
const midnight = new Date("2000-12-31T00:00:00");

describe("formatDate", () => {
  describe("날짜 토큰", () => {
    it("YYYY — 4자리 연도", () => {
      expect(formatDate(d, "YYYY")).toBe("2024");
    });
    it("YY — 2자리 연도", () => {
      expect(formatDate(d, "YY")).toBe("24");
    });
    it("MM — 2자리 월 (패딩)", () => {
      expect(formatDate(d, "MM")).toBe("06");
    });
    it("M — 월 (패딩 없음)", () => {
      expect(formatDate(d, "M")).toBe("6");
    });
    it("DD — 2자리 일 (패딩)", () => {
      expect(formatDate(d, "DD")).toBe("07");
    });
    it("D — 일 (패딩 없음)", () => {
      expect(formatDate(d, "D")).toBe("7");
    });
  });

  describe("시간 토큰", () => {
    it("HH — 24시간제 시 (패딩)", () => {
      expect(formatDate(d, "HH")).toBe("09");
      expect(formatDate(noon, "HH")).toBe("14");
    });
    it("H — 24시간제 시 (패딩 없음)", () => {
      expect(formatDate(d, "H")).toBe("9");
      expect(formatDate(midnight, "H")).toBe("0");
    });
    it("hh — 12시간제 시 (패딩)", () => {
      expect(formatDate(d, "hh")).toBe("09");      // 오전 9시 → 09
      expect(formatDate(noon, "hh")).toBe("02");   // 오후 2시 → 02
    });
    it("h — 12시간제 시 (패딩 없음)", () => {
      expect(formatDate(d, "h")).toBe("9");
      expect(formatDate(noon, "h")).toBe("2");
    });
    it("mm — 분 (패딩)", () => {
      expect(formatDate(d, "mm")).toBe("05");
    });
    it("ss — 초 (패딩)", () => {
      expect(formatDate(d, "ss")).toBe("03");
    });
    it("A — AM/PM", () => {
      expect(formatDate(d, "A")).toBe("AM");
      expect(formatDate(noon, "A")).toBe("PM");
    });
    it("a — am/pm", () => {
      expect(formatDate(d, "a")).toBe("am");
      expect(formatDate(noon, "a")).toBe("pm");
    });
    it("자정(00:00)은 12시간제로 12로 표시한다", () => {
      expect(formatDate(midnight, "h")).toBe("12");
      expect(formatDate(midnight, "A")).toBe("AM");
    });
  });

  describe("복합 포맷", () => {
    it("YYYY-MM-DD", () => {
      expect(formatDate(d, "YYYY-MM-DD")).toBe("2024-06-07");
    });
    it("HH:mm:ss", () => {
      expect(formatDate(d, "HH:mm:ss")).toBe("09:05:03");
    });
    it("YYYY년 M월 D일", () => {
      expect(formatDate(d, "YYYY년 M월 D일")).toBe("2024년 6월 7일");
    });
    it("YYYY-MM-DD HH:mm:ss (ISO-like)", () => {
      expect(formatDate(d, "YYYY-MM-DD HH:mm:ss")).toBe("2024-06-07 09:05:03");
    });
    it("h:mm A (12시간제)", () => {
      expect(formatDate(noon, "h:mm A")).toBe("2:30 PM");
    });
    it("YY/MM/DD", () => {
      expect(formatDate(d, "YY/MM/DD")).toBe("24/06/07");
    });
  });

  describe("경계 케이스", () => {
    it("토큰이 없는 포맷은 그대로 반환한다", () => {
      expect(formatDate(d, "오늘")).toBe("오늘");
    });
    it("YYYY 토큰이 YY로 이중 치환되지 않는다", () => {
      // YYYY → "2024", YY를 "2024" 안에서 다시 매칭하면 "2024" 안의 "24"가 변함
      // 올바른 구현은 YYYY → "2024"로 끝나야 함
      expect(formatDate(new Date("2099-01-01"), "YYYY")).toBe("2099");
    });
  });
});
