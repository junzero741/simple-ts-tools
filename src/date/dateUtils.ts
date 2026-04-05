/**
 * 날짜에 n일을 더한 새 Date 객체를 반환한다.
 * @example addDays(new Date("2024-01-30"), 3)  // 2024-02-02
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 날짜에서 n일을 뺀 새 Date 객체를 반환한다.
 * @example subDays(new Date("2024-02-02"), 3)  // 2024-01-30
 */
export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

/**
 * 날짜의 시작 시각(00:00:00.000)을 반환한다.
 * @example startOfDay(new Date("2024-06-07T14:30:00"))  // 2024-06-07T00:00:00.000
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * 날짜의 마지막 시각(23:59:59.999)을 반환한다.
 * @example endOfDay(new Date("2024-06-07T14:30:00"))  // 2024-06-07T23:59:59.999
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * 두 날짜가 같은 날(연·월·일)인지 확인한다. 시각은 무시한다.
 * @example isSameDay(new Date("2024-06-07T09:00"), new Date("2024-06-07T23:59"))  // true
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 두 날짜 사이의 일수 차이를 반환한다 (절댓값, 시각 무시).
 * @example diffDays(new Date("2024-01-01"), new Date("2024-01-10"))  // 9
 */
export function diffDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.abs(
    Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / msPerDay)
  );
}

/**
 * 날짜에 n개월을 더한 새 Date 객체를 반환한다.
 * 월말 날짜 오버플로우는 해당 월의 마지막 날로 clamp된다.
 * (예: 1월 31일 + 1개월 → 2월 28일)
 * @example addMonths(new Date("2024-01-31"), 1)  // 2024-02-29 (윤년)
 * @example addMonths(new Date("2024-03-31"), -1) // 2024-02-29
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1); // 일시적으로 1일로 설정해 월 오버플로우 방지
  result.setMonth(result.getMonth() + months);
  // 해당 월의 마지막 날로 clamp
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/**
 * 날짜에 n년을 더한 새 Date 객체를 반환한다.
 * 2월 29일(윤년) + 1년처럼 대상 연도에 해당 날이 없으면 2월 28일로 조정한다.
 * @example addYears(new Date("2024-02-29"), 1)  // 2025-02-28
 * @example addYears(new Date("2024-01-15"), 2)  // 2026-01-15
 */
export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

/**
 * 날짜가 주말(토요일 또는 일요일)인지 확인한다.
 * @example isWeekend(new Date("2024-06-08"))  // true  (토요일)
 * @example isWeekend(new Date("2024-06-07"))  // false (금요일)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0=일요일, 6=토요일
}

/**
 * 날짜가 평일(월~금)인지 확인한다.
 * @example isWeekday(new Date("2024-06-07"))  // true  (금요일)
 * @example isWeekday(new Date("2024-06-08"))  // false (토요일)
 */
export function isWeekday(date: Date): boolean {
  return !isWeekend(date);
}
