const SEC = 1;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * 두 날짜의 차이를 "3분 전", "2일 후" 같은 사람이 읽기 좋은 상대 시간으로 반환한다.
 *
 * 경계값 기준:
 * - 45초 미만 → "방금 전"
 * - 1시간 미만 → "N분 전/후"
 * - 24시간 미만 → "N시간 전/후"
 * - 30일 미만 → "N일 전/후"
 * - 365일 미만 → "N개월 전/후"
 * - 그 이상 → "N년 전/후"
 *
 * @param date   기준이 되는 날짜
 * @param base   비교 기준 날짜 (기본: 현재 시각)
 * @param locale 언어 설정 (기본: "ko")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3 * 60 * 1000))        // "3분 전"
 * formatRelativeTime(new Date(Date.now() + 2 * 60 * 60 * 1000))   // "2시간 후"
 * formatRelativeTime(past, now, "en")                              // "3 minutes ago"
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function formatRelativeTime(
  date: Date,
  base: Date = new Date(),
  locale: "ko" | "en" = "ko"
): string {
  const diffSec = (date.getTime() - base.getTime()) / 1000;
  const abs = Math.abs(diffSec);
  const past = diffSec < 0;

  if (abs < 45 * SEC) return locale === "ko" ? "방금 전" : "just now";

  let value: number;
  let unit: string;

  if (abs < HOUR) {
    value = Math.round(abs / MIN);
    unit = "minute";
  } else if (abs < DAY) {
    value = Math.round(abs / HOUR);
    unit = "hour";
  } else if (abs < MONTH) {
    value = Math.round(abs / DAY);
    unit = "day";
  } else if (abs < YEAR) {
    value = Math.round(abs / MONTH);
    unit = "month";
  } else {
    value = Math.round(abs / YEAR);
    unit = "year";
  }

  if (locale === "en") {
    const plural = value !== 1 ? "s" : "";
    return past ? `${value} ${unit}${plural} ago` : `in ${value} ${unit}${plural}`;
  }

  const unitKo: Record<string, string> = {
    minute: "분",
    hour: "시간",
    day: "일",
    month: "개월",
    year: "년",
  };
  return past ? `${value}${unitKo[unit]} 전` : `${value}${unitKo[unit]} 후`;
}
