import { isWeekend } from "./dateUtils";

function cloneDate(date: Date): Date {
  return new Date(date.getTime());
}

function shiftDay(date: Date, direction: 1 | -1): Date {
  const d = cloneDate(date);
  d.setDate(d.getDate() + direction);
  return d;
}

/**
 * 주말(토·일)을 제외하고 n 영업일 후(양수) 또는 전(음수)의 날짜를 반환한다.
 * n이 0이면 날짜를 그대로 반환한다 (주말이어도 변환하지 않는다).
 * 원본 Date를 변경하지 않는다.
 *
 * @example
 * // 금요일 + 1 영업일 = 다음 주 월요일
 * addBusinessDays(new Date("2024-06-07"), 1)  // 2024-06-10 (월)
 *
 * // 월요일 + 5 영업일 = 다음 주 월요일
 * addBusinessDays(new Date("2024-06-10"), 5)  // 2024-06-17 (월)
 *
 * // 음수 — 3 영업일 전
 * addBusinessDays(new Date("2024-06-10"), -3) // 2024-06-05 (수)
 */
export function addBusinessDays(date: Date, days: number): Date {
  if (days === 0) return cloneDate(date);

  let result = cloneDate(date);
  let remaining = Math.abs(days);
  const direction: 1 | -1 = days > 0 ? 1 : -1;

  while (remaining > 0) {
    result = shiftDay(result, direction);
    if (!isWeekend(result)) remaining--;
  }

  return result;
}

/**
 * 두 날짜 사이의 영업일 수를 반환한다 (시작일·종료일 모두 포함).
 * 주말은 제외된다.
 * a > b 이면 절댓값으로 계산한다.
 *
 * @example
 * // 월~금 = 5 영업일
 * getBusinessDayCount(new Date("2024-06-10"), new Date("2024-06-14"))  // 5
 *
 * // 주말 포함 구간
 * getBusinessDayCount(new Date("2024-06-10"), new Date("2024-06-17"))  // 6
 *
 * // 같은 날 (영업일이면 1, 주말이면 0)
 * getBusinessDayCount(new Date("2024-06-10"), new Date("2024-06-10"))  // 1
 */
export function getBusinessDayCount(a: Date, b: Date): number {
  const start = new Date(Math.min(a.getTime(), b.getTime()));
  const end   = new Date(Math.max(a.getTime(), b.getTime()));

  // 날짜만 비교하도록 시각 초기화
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  let count = 0;
  const current = cloneDate(start);

  while (current <= end) {
    if (!isWeekend(current)) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * 주어진 날짜에서 가장 가까운 다음 영업일을 반환한다.
 * 이미 영업일이면 그 날짜를 그대로 반환한다.
 *
 * @example
 * nextBusinessDay(new Date("2024-06-07"))  // 2024-06-07 (금, 이미 영업일)
 * nextBusinessDay(new Date("2024-06-08"))  // 2024-06-10 (토 → 월)
 * nextBusinessDay(new Date("2024-06-09"))  // 2024-06-10 (일 → 월)
 */
export function nextBusinessDay(date: Date): Date {
  let result = cloneDate(date);
  while (isWeekend(result)) {
    result = shiftDay(result, 1);
  }
  return result;
}

/**
 * 주어진 날짜에서 가장 가까운 이전 영업일을 반환한다.
 * 이미 영업일이면 그 날짜를 그대로 반환한다.
 *
 * @example
 * prevBusinessDay(new Date("2024-06-07"))  // 2024-06-07 (금, 이미 영업일)
 * prevBusinessDay(new Date("2024-06-08"))  // 2024-06-07 (토 → 금)
 * prevBusinessDay(new Date("2024-06-09"))  // 2024-06-07 (일 → 금)
 */
export function prevBusinessDay(date: Date): Date {
  let result = cloneDate(date);
  while (isWeekend(result)) {
    result = shiftDay(result, -1);
  }
  return result;
}
