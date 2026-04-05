/**
 * 날짜를 포맷 문자열에 따라 변환한다.
 * 토큰은 한 번의 정규식 치환으로 처리하므로 중첩 치환 문제가 없다.
 *
 * 지원 토큰:
 * | 토큰  | 설명              | 예시  |
 * |-------|-------------------|-------|
 * | YYYY  | 4자리 연도        | 2024  |
 * | YY    | 2자리 연도        | 24    |
 * | MM    | 2자리 월 (01~12)  | 06    |
 * | M     | 월 (1~12)         | 6     |
 * | DD    | 2자리 일 (01~31)  | 07    |
 * | D     | 일 (1~31)         | 7     |
 * | HH    | 24시간제 시 (00~23) | 09  |
 * | H     | 24시간제 시 (0~23)  | 9   |
 * | hh    | 12시간제 시 (01~12) | 09  |
 * | h     | 12시간제 시 (1~12)  | 9   |
 * | mm    | 분 (00~59)        | 05    |
 * | ss    | 초 (00~59)        | 03    |
 * | A     | AM / PM           | AM    |
 * | a     | am / pm           | am    |
 *
 * @example
 * formatDate(new Date("2024-06-07T09:05:03"), "YYYY-MM-DD")       // "2024-06-07"
 * formatDate(new Date("2024-06-07T09:05:03"), "YYYY년 M월 D일")   // "2024년 6월 7일"
 * formatDate(new Date("2024-06-07T09:05:03"), "HH:mm:ss")         // "09:05:03"
 * formatDate(new Date("2024-06-07T14:05:03"), "h:mm A")           // "2:05 PM"
 *
 * @complexity Time: O(k) — k: 포맷 문자열 길이
 */
export function formatDate(date: Date, format: string): string {
  const y = date.getFullYear();
  const M = date.getMonth() + 1;
  const d = date.getDate();
  const H = date.getHours();
  const h = H % 12 || 12;
  const m = date.getMinutes();
  const s = date.getSeconds();

  const pad = (n: number) => String(n).padStart(2, "0");

  const tokens: Record<string, string> = {
    YYYY: String(y),
    YY: String(y).slice(-2),
    MM: pad(M),
    M: String(M),
    DD: pad(d),
    D: String(d),
    HH: pad(H),
    H: String(H),
    hh: pad(h),
    h: String(h),
    mm: pad(m),
    ss: pad(s),
    A: H < 12 ? "AM" : "PM",
    a: H < 12 ? "am" : "pm",
  };

  // 긴 토큰이 먼저 매칭되도록 내림차순 정렬 (YYYY > YY, MM > M, DD > D 등)
  const pattern = new RegExp(
    Object.keys(tokens)
      .sort((a, b) => b.length - a.length)
      .join("|"),
    "g"
  );

  return format.replace(pattern, (token) => tokens[token] ?? token);
}
