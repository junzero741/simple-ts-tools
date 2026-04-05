import { addMonths } from "./dateUtils";

/**
 * 두 날짜 사이의 날짜 배열을 반환한다 (양 끝 포함).
 * step은 일(day) 단위이며 기본값은 1이다.
 *
 * @param start 시작 날짜
 * @param end   종료 날짜 (start보다 이전이면 빈 배열)
 * @param step  다음 날짜까지의 간격 (일 단위, 기본: 1)
 *
 * @example
 * dateRange(new Date("2024-06-01"), new Date("2024-06-05"))
 * // [Jun1, Jun2, Jun3, Jun4, Jun5]
 *
 * dateRange(new Date("2024-06-01"), new Date("2024-06-10"), 3)
 * // [Jun1, Jun4, Jun7, Jun10]
 *
 * // 캘린더 월간 뷰
 * dateRange(startOfMonth(now), endOfMonth(now))
 * // [1일, 2일, ..., 30일]
 *
 * // 최근 7일 차트 X축
 * dateRange(subDays(new Date(), 6), new Date())
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function dateRange(start: Date, end: Date, step = 1): Date[] {
  if (step <= 0) throw new Error("step must be >= 1");

  const result: Date[] = [];
  const endTime = end.getTime();

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current.getTime() <= endNorm.getTime()) {
    result.push(new Date(current));
    current.setDate(current.getDate() + step);
  }

  void endTime; // suppress unused warning
  return result;
}

/**
 * 두 날짜 사이의 월(month) 배열을 반환한다 (양 끝 포함).
 * 각 날짜는 해당 월의 1일 00:00:00.000이다.
 *
 * @example
 * monthRange(new Date("2024-01-15"), new Date("2024-04-10"))
 * // [Jan 1, Feb 1, Mar 1, Apr 1]
 *
 * // 연간 월별 매출 차트 X축
 * monthRange(startOfYear, endOfYear)
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function monthRange(start: Date, end: Date): Date[] {
  const result: Date[] = [];

  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current.getTime() <= endMonth.getTime()) {
    result.push(new Date(current));
    const next = addMonths(current, 1);
    current.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
  }

  return result;
}
