import { describe, it, expect } from "vitest";
import { parseCron } from "./cron";

describe("parseCron", () => {
  describe("matches", () => {
    it("매 분 — * * * * *", () => {
      const expr = parseCron("* * * * *");
      expect(expr.matches(new Date("2024-06-15T10:30:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T00:00:00"))).toBe(true);
    });

    it("매 15분 — */15 * * * *", () => {
      const expr = parseCron("*/15 * * * *");
      expect(expr.matches(new Date("2024-01-01T10:00:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T10:15:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T10:30:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T10:45:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T10:10:00"))).toBe(false);
    });

    it("정확한 시각 — 30 9 * * *", () => {
      const expr = parseCron("30 9 * * *");
      expect(expr.matches(new Date("2024-01-01T09:30:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T09:31:00"))).toBe(false);
      expect(expr.matches(new Date("2024-01-01T10:30:00"))).toBe(false);
    });

    it("범위 — 0 9 * * 1-5 (평일 9시)", () => {
      const expr = parseCron("0 9 * * 1-5");
      // 2024-01-01 = 월요일
      expect(expr.matches(new Date("2024-01-01T09:00:00"))).toBe(true);
      // 2024-01-05 = 금요일
      expect(expr.matches(new Date("2024-01-05T09:00:00"))).toBe(true);
      // 2024-01-06 = 토요일
      expect(expr.matches(new Date("2024-01-06T09:00:00"))).toBe(false);
    });

    it("리스트 — 0 12 * * 0,6 (주말 정오)", () => {
      const expr = parseCron("0 12 * * 0,6");
      // 2024-01-06 = 토요일
      expect(expr.matches(new Date("2024-01-06T12:00:00"))).toBe(true);
      // 2024-01-07 = 일요일
      expect(expr.matches(new Date("2024-01-07T12:00:00"))).toBe(true);
      // 2024-01-08 = 월요일
      expect(expr.matches(new Date("2024-01-08T12:00:00"))).toBe(false);
    });

    it("매월 1일 자정 — 0 0 1 * *", () => {
      const expr = parseCron("0 0 1 * *");
      expect(expr.matches(new Date("2024-02-01T00:00:00"))).toBe(true);
      expect(expr.matches(new Date("2024-02-02T00:00:00"))).toBe(false);
    });

    it("스텝 — 30 */2 * * *", () => {
      const expr = parseCron("30 */2 * * *");
      expect(expr.matches(new Date("2024-01-01T00:30:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T02:30:00"))).toBe(true);
      expect(expr.matches(new Date("2024-01-01T03:30:00"))).toBe(false);
    });
  });

  describe("next", () => {
    it("다음 실행 시각을 반환한다", () => {
      const expr = parseCron("*/15 * * * *");
      const after = new Date("2024-01-01T10:31:00");
      const nextDate = expr.next(after);

      expect(nextDate.getHours()).toBe(10);
      expect(nextDate.getMinutes()).toBe(45);
    });

    it("다음 시간으로 넘어간다", () => {
      const expr = parseCron("0 * * * *"); // 매시 정각
      const after = new Date("2024-01-01T10:30:00");
      const nextDate = expr.next(after);

      expect(nextDate.getHours()).toBe(11);
      expect(nextDate.getMinutes()).toBe(0);
    });

    it("다음 날로 넘어간다", () => {
      const expr = parseCron("0 9 * * *"); // 매일 9시
      const after = new Date("2024-01-01T10:00:00");
      const nextDate = expr.next(after);

      expect(nextDate.getDate()).toBe(2);
      expect(nextDate.getHours()).toBe(9);
    });

    it("평일만 — 0 9 * * 1-5", () => {
      const expr = parseCron("0 9 * * 1-5");
      // 2024-01-05 금요일 10시 이후 → 2024-01-08 월요일 9시
      const after = new Date("2024-01-05T10:00:00");
      const nextDate = expr.next(after);

      expect(nextDate.getDay()).toBe(1); // 월요일
      expect(nextDate.getHours()).toBe(9);
    });
  });

  describe("nextN", () => {
    it("다음 N번 실행 시각을 반환한다", () => {
      const expr = parseCron("0 * * * *"); // 매시 정각
      const after = new Date("2024-01-01T10:30:00");
      const dates = expr.nextN(after, 3);

      expect(dates.length).toBe(3);
      expect(dates[0].getHours()).toBe(11);
      expect(dates[1].getHours()).toBe(12);
      expect(dates[2].getHours()).toBe(13);
    });
  });

  describe("expression", () => {
    it("원본 표현식을 반환한다", () => {
      expect(parseCron("*/5 * * * *").expression).toBe("*/5 * * * *");
    });
  });

  describe("에러", () => {
    it("필드 수가 5가 아니면 에러를 던진다", () => {
      expect(() => parseCron("* * *")).toThrow("expected 5 fields");
      expect(() => parseCron("* * * * * *")).toThrow("expected 5 fields");
    });
  });
});
