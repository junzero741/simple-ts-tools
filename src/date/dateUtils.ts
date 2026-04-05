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
