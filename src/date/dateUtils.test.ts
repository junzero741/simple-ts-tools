import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  addYears,
  diffDays,
  endOfDay,
  isSameDay,
  isWeekday,
  isWeekend,
  startOfDay,
  subDays,
} from "./dateUtils";

const d = new Date("2024-06-07T14:30:00.000Z");

describe("addDays", () => {
  it("n일을 더한 날짜를 반환한다", () => {
    const result = addDays(new Date("2024-01-28"), 5);
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(1); // 2월 (0-indexed)
    expect(result.getFullYear()).toBe(2024);
  });

  it("월말을 넘어가도 올바르게 처리한다", () => {
    const result = addDays(new Date("2024-01-31"), 1);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(1);
  });

  it("윤년 2월을 처리한다", () => {
    const result = addDays(new Date("2024-02-28"), 1);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29); // 2024년은 윤년
  });

  it("원본 날짜를 변경하지 않는다", () => {
    const original = new Date("2024-06-07");
    addDays(original, 10);
    expect(original.getDate()).toBe(7);
  });

  it("음수 인자는 날짜를 뺀다", () => {
    expect(addDays(new Date("2024-06-07"), -3).getDate()).toBe(4);
  });
});

describe("subDays", () => {
  it("n일을 뺀 날짜를 반환한다", () => {
    const result = subDays(new Date("2024-06-10"), 5);
    expect(result.getDate()).toBe(5);
    expect(result.getMonth()).toBe(5); // 6월
  });

  it("월초를 넘어가도 올바르게 처리한다", () => {
    const result = subDays(new Date("2024-03-01"), 1);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(29); // 2024년은 윤년
  });
});

describe("startOfDay", () => {
  it("00:00:00.000으로 시각을 초기화한다", () => {
    const result = startOfDay(new Date("2024-06-07T14:30:45.123"));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(7); // 날짜는 유지
  });

  it("원본을 변경하지 않는다", () => {
    const original = new Date("2024-06-07T14:30:00");
    startOfDay(original);
    expect(original.getHours()).toBe(14);
  });
});

describe("endOfDay", () => {
  it("23:59:59.999로 시각을 설정한다", () => {
    const result = endOfDay(new Date("2024-06-07T09:00:00"));
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
    expect(result.getMilliseconds()).toBe(999);
    expect(result.getDate()).toBe(7);
  });
});

describe("isSameDay", () => {
  it("같은 날짜이면 true를 반환한다", () => {
    expect(
      isSameDay(new Date("2024-06-07T09:00"), new Date("2024-06-07T23:59"))
    ).toBe(true);
  });

  it("다른 날짜이면 false를 반환한다", () => {
    expect(
      isSameDay(new Date("2024-06-07"), new Date("2024-06-08"))
    ).toBe(false);
  });

  it("같은 날이지만 다른 월이면 false를 반환한다", () => {
    expect(
      isSameDay(new Date("2024-01-07"), new Date("2024-02-07"))
    ).toBe(false);
  });

  it("같은 날이지만 다른 연도이면 false를 반환한다", () => {
    expect(
      isSameDay(new Date("2023-06-07"), new Date("2024-06-07"))
    ).toBe(false);
  });
});

describe("diffDays", () => {
  it("두 날짜의 일수 차이를 반환한다", () => {
    expect(diffDays(new Date("2024-01-01"), new Date("2024-01-10"))).toBe(9);
  });

  it("순서에 상관없이 항상 양수를 반환한다", () => {
    expect(diffDays(new Date("2024-01-10"), new Date("2024-01-01"))).toBe(9);
  });

  it("같은 날이면 0을 반환한다", () => {
    expect(
      diffDays(new Date("2024-06-07T09:00"), new Date("2024-06-07T23:59"))
    ).toBe(0);
  });

  it("시각을 무시하고 날짜만 비교한다", () => {
    expect(
      diffDays(new Date("2024-01-01T23:59:59"), new Date("2024-01-02T00:00:01"))
    ).toBe(1);
  });

  it("월을 넘어가는 차이를 계산한다", () => {
    expect(diffDays(new Date("2024-01-31"), new Date("2024-03-01"))).toBe(30);
  });
});

describe("addMonths", () => {
  it("n개월을 더한 날짜를 반환한다", () => {
    const result = addMonths(new Date("2024-03-15"), 2);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(4); // 5월 (0-indexed)
    expect(result.getDate()).toBe(15);
  });

  it("연도를 넘어가도 처리한다", () => {
    const result = addMonths(new Date("2024-11-15"), 3);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1); // 2월
  });

  it("월말 날짜는 대상 월의 마지막 날로 clamp한다", () => {
    // 1월 31일 + 1개월 → 2월 마지막 날
    const result = addMonths(new Date("2024-01-31"), 1);
    expect(result.getMonth()).toBe(1); // 2월
    expect(result.getDate()).toBe(29); // 2024년은 윤년
  });

  it("음수 개월로 뺄 수 있다", () => {
    const result = addMonths(new Date("2024-06-15"), -3);
    expect(result.getMonth()).toBe(2); // 3월
    expect(result.getDate()).toBe(15);
  });

  it("원본 날짜를 변경하지 않는다", () => {
    const original = new Date("2024-06-07");
    addMonths(original, 2);
    expect(original.getMonth()).toBe(5); // 6월 유지
  });
});

describe("addYears", () => {
  it("n년을 더한 날짜를 반환한다", () => {
    const result = addYears(new Date("2024-06-07"), 2);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(7);
  });

  it("윤년 2월 29일 + 1년 → 2월 28일", () => {
    const result = addYears(new Date("2024-02-29"), 1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });

  it("음수로 뺄 수 있다", () => {
    const result = addYears(new Date("2024-06-07"), -3);
    expect(result.getFullYear()).toBe(2021);
  });
});

describe("isWeekend / isWeekday", () => {
  it("토요일은 주말로 판별한다", () => {
    expect(isWeekend(new Date("2024-06-08"))).toBe(true); // 토
    expect(isWeekday(new Date("2024-06-08"))).toBe(false);
  });

  it("일요일은 주말로 판별한다", () => {
    expect(isWeekend(new Date("2024-06-09"))).toBe(true); // 일
    expect(isWeekday(new Date("2024-06-09"))).toBe(false);
  });

  it("평일은 isWeekday가 true를 반환한다", () => {
    expect(isWeekday(new Date("2024-06-07"))).toBe(true);  // 금
    expect(isWeekday(new Date("2024-06-03"))).toBe(true);  // 월
    expect(isWeekend(new Date("2024-06-07"))).toBe(false);
  });
});
