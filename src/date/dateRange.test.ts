import { describe, expect, it } from "vitest";
import { dateRange, monthRange } from "./dateRange";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

describe("dateRange", () => {
  it("시작일부터 종료일까지 하루씩 날짜 배열을 반환한다", () => {
    const result = dateRange(new Date("2024-06-01"), new Date("2024-06-05"));
    expect(result.map(ymd)).toEqual([
      "2024-06-01",
      "2024-06-02",
      "2024-06-03",
      "2024-06-04",
      "2024-06-05",
    ]);
  });

  it("시작일 = 종료일이면 하나만 반환한다", () => {
    const result = dateRange(new Date("2024-06-15"), new Date("2024-06-15"));
    expect(result).toHaveLength(1);
    expect(ymd(result[0])).toBe("2024-06-15");
  });

  it("시작일 > 종료일이면 빈 배열을 반환한다", () => {
    const result = dateRange(new Date("2024-06-10"), new Date("2024-06-05"));
    expect(result).toEqual([]);
  });

  it("step으로 날짜 간격을 조정한다", () => {
    const result = dateRange(new Date("2024-06-01"), new Date("2024-06-10"), 3);
    expect(result.map(ymd)).toEqual([
      "2024-06-01",
      "2024-06-04",
      "2024-06-07",
      "2024-06-10",
    ]);
  });

  it("step=7로 주간 날짜 생성", () => {
    const result = dateRange(new Date("2024-06-03"), new Date("2024-06-24"), 7);
    expect(result.map(ymd)).toEqual([
      "2024-06-03",
      "2024-06-10",
      "2024-06-17",
      "2024-06-24",
    ]);
  });

  it("step <= 0이면 에러를 던진다", () => {
    expect(() => dateRange(new Date("2024-06-01"), new Date("2024-06-10"), 0)).toThrow();
    expect(() => dateRange(new Date("2024-06-01"), new Date("2024-06-10"), -1)).toThrow();
  });

  it("반환된 Date 객체는 시각이 00:00:00.000으로 정규화된다", () => {
    const result = dateRange(
      new Date("2024-06-01T15:30:00"),
      new Date("2024-06-03T09:00:00")
    );
    for (const d of result) {
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
    }
  });

  it("원본 Date를 변경하지 않는다", () => {
    const start = new Date("2024-06-01T10:00:00");
    const end = new Date("2024-06-03T10:00:00");
    dateRange(start, end);
    expect(start.getHours()).toBe(10); // 원본 시각 유지
  });

  it("월 경계를 올바르게 처리한다", () => {
    const result = dateRange(new Date("2024-01-30"), new Date("2024-02-02"));
    expect(result.map(ymd)).toEqual([
      "2024-01-30",
      "2024-01-31",
      "2024-02-01",
      "2024-02-02",
    ]);
  });

  it("실사용: 캘린더 월간 뷰 날짜 생성", () => {
    // 2024년 6월: 1일~30일
    const june1 = new Date("2024-06-01");
    const june30 = new Date("2024-06-30");
    const days = dateRange(june1, june30);
    expect(days).toHaveLength(30);
    expect(ymd(days[0])).toBe("2024-06-01");
    expect(ymd(days[29])).toBe("2024-06-30");
  });

  it("실사용: 최근 7일 차트 X축", () => {
    const today = new Date("2024-06-10");
    const sevenDaysAgo = new Date("2024-06-04");
    const result = dateRange(sevenDaysAgo, today);
    expect(result).toHaveLength(7);
    expect(ymd(result[0])).toBe("2024-06-04");
    expect(ymd(result[6])).toBe("2024-06-10");
  });
});

describe("monthRange", () => {
  it("시작월부터 종료월까지 월 배열을 반환한다", () => {
    const result = monthRange(new Date("2024-01-15"), new Date("2024-04-10"));
    expect(result.map(ymd)).toEqual([
      "2024-01-01",
      "2024-02-01",
      "2024-03-01",
      "2024-04-01",
    ]);
  });

  it("같은 달이면 하나만 반환한다", () => {
    const result = monthRange(new Date("2024-06-01"), new Date("2024-06-30"));
    expect(result).toHaveLength(1);
    expect(ymd(result[0])).toBe("2024-06-01");
  });

  it("시작 > 종료이면 빈 배열을 반환한다", () => {
    expect(monthRange(new Date("2024-06-01"), new Date("2024-05-01"))).toEqual([]);
  });

  it("연도 경계를 올바르게 처리한다", () => {
    const result = monthRange(new Date("2023-11-01"), new Date("2024-02-01"));
    expect(result.map(ymd)).toEqual([
      "2023-11-01",
      "2023-12-01",
      "2024-01-01",
      "2024-02-01",
    ]);
  });

  it("각 날짜는 해당 월의 1일로 정규화된다", () => {
    const result = monthRange(new Date("2024-01-31"), new Date("2024-03-15"));
    for (const d of result) {
      expect(d.getDate()).toBe(1);
    }
  });

  it("실사용: 연간 12개월 배열", () => {
    const result = monthRange(new Date("2024-01-01"), new Date("2024-12-31"));
    expect(result).toHaveLength(12);
    expect(ymd(result[0])).toBe("2024-01-01");
    expect(ymd(result[11])).toBe("2024-12-01");
  });
});
