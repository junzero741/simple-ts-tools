import { describe, expect, it } from "vitest";
import { addBusinessDays, getBusinessDayCount, nextBusinessDay, prevBusinessDay } from "./businessDays";

// 기준 날짜 헬퍼 — 시각 정보 없이 날짜만
const d = (str: string) => new Date(str + "T00:00:00");

// 날짜 문자열 변환 (로컬 시각 기준)
const ymd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

describe("addBusinessDays", () => {
  // 2024-06-10 = 월요일
  // 2024-06-07 = 금요일
  // 2024-06-08 = 토요일
  // 2024-06-09 = 일요일

  it("영업일 + 양수 — 주말을 건너뛴다", () => {
    // 금 + 1 = 월
    expect(ymd(addBusinessDays(d("2024-06-07"), 1))).toBe("2024-06-10");
    // 금 + 2 = 화
    expect(ymd(addBusinessDays(d("2024-06-07"), 2))).toBe("2024-06-11");
    // 월 + 5 = 다음 주 월
    expect(ymd(addBusinessDays(d("2024-06-10"), 5))).toBe("2024-06-17");
  });

  it("영업일 + 음수 — 이전 영업일로 이동", () => {
    // 월 - 1 = 금
    expect(ymd(addBusinessDays(d("2024-06-10"), -1))).toBe("2024-06-07");
    // 월 - 3 = 수
    expect(ymd(addBusinessDays(d("2024-06-10"), -3))).toBe("2024-06-05");
  });

  it("0이면 날짜를 그대로 반환한다", () => {
    expect(ymd(addBusinessDays(d("2024-06-10"), 0))).toBe("2024-06-10");
    // 주말이어도 그대로
    expect(ymd(addBusinessDays(d("2024-06-08"), 0))).toBe("2024-06-08");
  });

  it("주말(토요일)에서 시작해도 다음 영업일부터 카운트한다", () => {
    // 토 + 1 = 월 (일요일 건너뜀)
    expect(ymd(addBusinessDays(d("2024-06-08"), 1))).toBe("2024-06-10");
    // 일 + 1 = 월
    expect(ymd(addBusinessDays(d("2024-06-09"), 1))).toBe("2024-06-10");
  });

  it("여러 주를 넘는 경우", () => {
    // 월 + 10 = 2주 뒤 월
    expect(ymd(addBusinessDays(d("2024-06-10"), 10))).toBe("2024-06-24");
    // 월 + 15 = 3주 뒤 월
    expect(ymd(addBusinessDays(d("2024-06-10"), 15))).toBe("2024-07-01");
  });

  it("원본 Date를 변경하지 않는다", () => {
    const original = d("2024-06-10");
    addBusinessDays(original, 5);
    expect(ymd(original)).toBe("2024-06-10");
  });

  it("실사용: 배송 예상일 (금요일 주문, 3 영업일)", () => {
    const orderDate = d("2024-06-07"); // 금
    expect(ymd(addBusinessDays(orderDate, 3))).toBe("2024-06-12"); // 수
  });

  it("실사용: 계약 만료 30 영업일 전 알림", () => {
    const expiry = d("2024-08-30"); // 금
    const notifyDate = addBusinessDays(expiry, -30);
    expect(ymd(notifyDate)).toBe("2024-07-19"); // 금
  });
});

describe("getBusinessDayCount", () => {
  it("월~금 = 5 영업일", () => {
    expect(getBusinessDayCount(d("2024-06-10"), d("2024-06-14"))).toBe(5);
  });

  it("주말이 포함된 1주 구간 = 6 영업일 (월~다음 주 월)", () => {
    expect(getBusinessDayCount(d("2024-06-10"), d("2024-06-17"))).toBe(6);
  });

  it("같은 날 (영업일이면 1)", () => {
    expect(getBusinessDayCount(d("2024-06-10"), d("2024-06-10"))).toBe(1);
  });

  it("같은 날 (주말이면 0)", () => {
    expect(getBusinessDayCount(d("2024-06-08"), d("2024-06-08"))).toBe(0);
  });

  it("a > b여도 절댓값으로 계산한다", () => {
    expect(getBusinessDayCount(d("2024-06-14"), d("2024-06-10"))).toBe(5);
  });

  it("주말만 포함된 구간 = 0", () => {
    expect(getBusinessDayCount(d("2024-06-08"), d("2024-06-09"))).toBe(0);
  });

  it("실사용: 프로젝트 영업일 수 계산", () => {
    // 2주 (월~금 × 2) = 10 영업일
    expect(getBusinessDayCount(d("2024-06-10"), d("2024-06-21"))).toBe(10);
  });
});

describe("nextBusinessDay", () => {
  it("이미 영업일이면 그 날짜를 반환한다", () => {
    expect(ymd(nextBusinessDay(d("2024-06-10")))).toBe("2024-06-10"); // 월
    expect(ymd(nextBusinessDay(d("2024-06-07")))).toBe("2024-06-07"); // 금
  });

  it("토요일 → 월요일", () => {
    expect(ymd(nextBusinessDay(d("2024-06-08")))).toBe("2024-06-10");
  });

  it("일요일 → 월요일", () => {
    expect(ymd(nextBusinessDay(d("2024-06-09")))).toBe("2024-06-10");
  });

  it("원본 Date를 변경하지 않는다", () => {
    const sat = d("2024-06-08");
    nextBusinessDay(sat);
    expect(ymd(sat)).toBe("2024-06-08");
  });
});

describe("prevBusinessDay", () => {
  it("이미 영업일이면 그 날짜를 반환한다", () => {
    expect(ymd(prevBusinessDay(d("2024-06-10")))).toBe("2024-06-10"); // 월
    expect(ymd(prevBusinessDay(d("2024-06-07")))).toBe("2024-06-07"); // 금
  });

  it("토요일 → 금요일", () => {
    expect(ymd(prevBusinessDay(d("2024-06-08")))).toBe("2024-06-07");
  });

  it("일요일 → 금요일", () => {
    expect(ymd(prevBusinessDay(d("2024-06-09")))).toBe("2024-06-07");
  });
});
