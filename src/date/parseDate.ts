/**
 * 다양한 형식의 날짜 문자열을 Date 객체로 파싱한다.
 *
 * 지원 형식:
 * - ISO 8601:  "2024-06-07", "2024-06-07T14:30:00", "2024-06-07T14:30:00.000Z"
 * - 슬래시:   "2024/06/07"
 * - 점:       "2024.06.07"
 * - 한국어:   "2024년 6월 7일", "2024년6월7일"
 * - US 형식:  "06/07/2024" (MM/DD/YYYY, locale: "en-US")
 * - EU 형식:  "07/06/2024" (DD/MM/YYYY, locale: "en-GB")
 *
 * @returns 파싱에 실패하면 `null`을 반환한다.
 */
export function parseDate(input: string, locale?: "en-US" | "en-GB"): Date | null {
  if (!input || typeof input !== "string") return null;

  const s = input.trim();

  // ISO 8601 및 ISO-like (YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD)
  const isoMatch = s.match(
    /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?(Z|[+-]\d{2}:?\d{2})?)?$/
  );
  if (isoMatch) {
    const [, year, month, day, hh = "0", mm = "0", ss = "0", ms = "0", tz] = isoMatch;
    if (tz !== undefined) {
      // timezone 정보가 있으면 Date.parse에 위임 (원본 보존)
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    // timezone 없음 → 로컬 시각으로 해석
    const d = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hh),
      Number(mm),
      Number(ss),
      Number(ms.padEnd(3, "0").slice(0, 3))
    );
    return isValidDate(d, Number(year), Number(month), Number(day)) ? d : null;
  }

  // 한국어: "2024년 6월 7일"
  const koMatch = s.match(/^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일?$/);
  if (koMatch) {
    const [, year, month, day] = koMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isValidDate(d, Number(year), Number(month), Number(day)) ? d : null;
  }

  // 슬래시 두 자리: MM/DD/YYYY (en-US) vs DD/MM/YYYY (en-GB)
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    const [month, day] = locale === "en-GB" ? [b, a] : [a, b]; // default en-US
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isValidDate(d, Number(year), Number(month), Number(day)) ? d : null;
  }

  return null;
}

function isValidDate(d: Date, year: number, month: number, day: number): boolean {
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}
