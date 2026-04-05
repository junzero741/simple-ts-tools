// 타임존 변환 유틸 (Timezone Utilities).
//
// === 예상 사용처 ===
// - 글로벌 서비스에서 사용자별 타임존 표시 (SaaS 대시보드, 채팅 앱)
// - 서버(UTC)와 클라이언트(로컬) 간 시간 변환
// - 스케줄러에서 "뉴욕 시간 오전 9시" 같은 로컬 시각 처리
// - 국제 회의 시간 조율 도구 (여러 타임존 동시 표시)
// - 로그 분석 시 UTC → 로컬 변환
//
// toTimezone(new Date(), "Asia/Seoul")         → "2024-06-15 21:30:00"
// toTimezone(new Date(), "America/New_York")   → "2024-06-15 08:30:00"
// getTimezoneOffset("Asia/Tokyo")              → 540 (분)
// listTimezones()                              → ["Africa/Abidjan", ...]
// convertBetween(date, "UTC", "Asia/Seoul")    → Date

/**
 * Date를 특정 타임존 문자열로 포맷한다.
 * @param date 변환할 날짜
 * @param timezone IANA 타임존 (예: "Asia/Seoul", "America/New_York")
 * @param options Intl.DateTimeFormat 옵션
 */
export function toTimezone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  },
): string {
  return new Intl.DateTimeFormat("en-CA", { ...options, timeZone: timezone }).format(date);
}

/**
 * 특정 타임존의 현재 UTC 오프셋(분)을 반환한다.
 * Asia/Seoul → 540, America/New_York → -240 (EDT)
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return (tzDate.getTime() - utcDate.getTime()) / 60_000;
}

/**
 * 두 타임존 간 시간 차이(시간)를 반환한다.
 * timeDifference("Asia/Seoul", "America/New_York") → 13 또는 14 (DST에 따라)
 */
export function timeDifference(
  timezone1: string,
  timezone2: string,
  date: Date = new Date(),
): number {
  const offset1 = getTimezoneOffset(timezone1, date);
  const offset2 = getTimezoneOffset(timezone2, date);
  return (offset1 - offset2) / 60;
}

/**
 * 특정 타임존의 현재 시각을 Date로 반환한다.
 * 주의: 반환된 Date의 내부 UTC 값이 조정됨 (표시용).
 */
export function nowIn(timezone: string): Date {
  const str = new Date().toLocaleString("en-US", { timeZone: timezone });
  return new Date(str);
}

/**
 * 특정 타임존이 현재 DST(서머타임) 중인지 확인한다.
 */
export function isDST(timezone: string, date: Date = new Date()): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const janOffset = getTimezoneOffset(timezone, jan);
  const julOffset = getTimezoneOffset(timezone, jul);
  const stdOffset = Math.min(janOffset, julOffset);
  const currentOffset = getTimezoneOffset(timezone, date);
  return currentOffset !== stdOffset;
}

/**
 * IANA 타임존 약어를 반환한다 (예: "KST", "EDT", "JST").
 */
export function getTimezoneAbbr(timezone: string, date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "short",
  }).formatToParts(date);

  const tzPart = parts.find((p) => p.type === "timeZoneName");
  return tzPart?.value ?? timezone;
}

/**
 * 여러 타임존의 현재 시각을 한 번에 반환한다 (월드 클록).
 */
export function worldClock(
  timezones: string[],
  date: Date = new Date(),
): Array<{ timezone: string; abbr: string; time: string; offset: number }> {
  return timezones.map((tz) => ({
    timezone: tz,
    abbr: getTimezoneAbbr(tz, date),
    time: toTimezone(date, tz),
    offset: getTimezoneOffset(tz, date),
  }));
}
