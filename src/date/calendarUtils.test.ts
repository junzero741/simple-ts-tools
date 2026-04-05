import { describe, expect, it } from "vitest";
import {
  endOfMonth,
  endOfWeek,
  getQuarter,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "./dateUtils";

describe("startOfMonth", () => {
  it("해당 월의 1일 00:00:00.000을 반환한다", () => {
    const result = startOfMonth(new Date("2024-06-15T14:30:00"));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5); // 6월 (0-indexed)
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("이미 1일인 경우에도 올바르게 반환한다", () => {
    const result = startOfMonth(new Date("2024-06-01T23:59:59"));
    expect(result.getDate()).toBe(1);
    expect(result.getHours()).toBe(0);
  });

  it("원본을 변경하지 않는다", () => {
    const original = new Date("2024-06-15");
    startOfMonth(original);
    expect(original.getDate()).toBe(15);
  });
});

describe("endOfMonth", () => {
  it("해당 월의 마지막 날 23:59:59.999를 반환한다", () => {
    const result = endOfMonth(new Date("2024-06-15"));
    expect(result.getDate()).toBe(30); // 6월은 30일
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("윤년 2월의 마지막 날은 29일", () => {
    const result = endOfMonth(new Date("2024-02-10"));
    expect(result.getDate()).toBe(29);
  });

  it("평년 2월의 마지막 날은 28일", () => {
    const result = endOfMonth(new Date("2025-02-10"));
    expect(result.getDate()).toBe(28);
  });

  it("31일 있는 달 처리", () => {
    expect(endOfMonth(new Date("2024-01-15")).getDate()).toBe(31);
    expect(endOfMonth(new Date("2024-03-15")).getDate()).toBe(31);
  });
});

describe("startOfWeek", () => {
  // 2024-06-05는 수요일

  it("기본(일요일 시작) — 해당 주 일요일을 반환한다", () => {
    const result = startOfWeek(new Date("2024-06-05")); // 수요일
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5); // 6월
    expect(result.getDate()).toBe(2); // 2024-06-02 (일)
    expect(result.getHours()).toBe(0);
  });

  it("weekStart: 1 (월요일 시작) — 해당 주 월요일을 반환한다", () => {
    const result = startOfWeek(new Date("2024-06-05"), 1); // 수요일
    expect(result.getDate()).toBe(3); // 2024-06-03 (월)
  });

  it("이미 시작 요일인 경우 그 날을 반환한다", () => {
    // 2024-06-02는 일요일
    const result = startOfWeek(new Date("2024-06-02"), 0);
    expect(result.getDate()).toBe(2);
  });

  it("월 경계를 넘어가는 경우", () => {
    // 2024-06-01은 토요일 → 일요일 시작 주의 시작은 5/26(일)
    const result = startOfWeek(new Date("2024-06-01"), 0);
    expect(result.getMonth()).toBe(4); // 5월
    expect(result.getDate()).toBe(26);
  });
});

describe("endOfWeek", () => {
  it("기본(일요일 시작) — 해당 주 토요일 23:59:59.999를 반환한다", () => {
    const result = endOfWeek(new Date("2024-06-05")); // 수요일
    expect(result.getDate()).toBe(8); // 2024-06-08 (토)
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
  });

  it("weekStart: 1 (월요일 시작) — 해당 주 일요일을 반환한다", () => {
    const result = endOfWeek(new Date("2024-06-05"), 1); // 수요일
    expect(result.getDate()).toBe(9); // 2024-06-09 (일)
  });
});

describe("getQuarter", () => {
  it("1월~3월 → 1분기", () => {
    expect(getQuarter(new Date("2024-01-01"))).toBe(1);
    expect(getQuarter(new Date("2024-02-15"))).toBe(1);
    expect(getQuarter(new Date("2024-03-31"))).toBe(1);
  });

  it("4월~6월 → 2분기", () => {
    expect(getQuarter(new Date("2024-04-01"))).toBe(2);
    expect(getQuarter(new Date("2024-06-30"))).toBe(2);
  });

  it("7월~9월 → 3분기", () => {
    expect(getQuarter(new Date("2024-07-01"))).toBe(3);
    expect(getQuarter(new Date("2024-09-30"))).toBe(3);
  });

  it("10월~12월 → 4분기", () => {
    expect(getQuarter(new Date("2024-10-01"))).toBe(4);
    expect(getQuarter(new Date("2024-12-31"))).toBe(4);
  });
});

describe("isSameMonth", () => {
  it("같은 연월이면 true", () => {
    expect(isSameMonth(new Date("2024-06-01"), new Date("2024-06-30"))).toBe(true);
  });

  it("다른 월이면 false", () => {
    expect(isSameMonth(new Date("2024-06-01"), new Date("2024-07-01"))).toBe(false);
  });

  it("같은 월이지만 다른 연도이면 false", () => {
    expect(isSameMonth(new Date("2023-06-01"), new Date("2024-06-01"))).toBe(false);
  });

  it("시각은 무시한다", () => {
    expect(
      isSameMonth(new Date("2024-06-01T00:00:00"), new Date("2024-06-30T23:59:59"))
    ).toBe(true);
  });
});
