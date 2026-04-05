// 숫자 인간화 (Number Humanize).
//
// === 예상 사용처 ===
// - SNS 팔로워 수 표시 — 12345 → "12.3K", 1500000 → "1.5M"
// - 파일 크기 표시 — 1536 → "1.5 KB" (formatBytes와 별도로 SI 접두사)
// - 경과 시간 표시 — 90초 → "1분 30초", 3661초 → "1시간 1분"
// - 대략적 수량 표시 — 1234 → "약 1,200개", 15 → "15개"
// - 순위/서수 표시 — 1 → "1st", 23 → "23rd" (영어)
// - 단수/복수 자동 처리 — 1 item, 3 items
// - 분수/비율 표시 — 0.75 → "3/4", 0.333 → "1/3"
//
// humanizeNumber(12345)     → "12.3K"
// humanizeDuration(90)      → "1분 30초"
// approximateNumber(1234)   → "약 1,200"
// toFraction(0.75)          → "3/4"

/**
 * 큰 숫자를 K/M/B/T 접미사로 축약한다.
 */
export function humanizeNumber(n: number, decimals: number = 1): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";

  if (abs < 1_000) return `${sign}${abs}`;
  if (abs < 1_000_000) return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  if (abs < 1_000_000_000) return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  if (abs < 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(decimals)}B`;
  return `${sign}${(abs / 1_000_000_000_000).toFixed(decimals)}T`;
}

/**
 * 초 단위를 사람이 읽기 쉬운 한국어 시간으로 변환한다.
 */
export function humanizeDuration(seconds: number): string {
  if (seconds < 0) return `-${humanizeDuration(-seconds)}`;
  if (seconds === 0) return "0초";

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}일`);
  if (h > 0) parts.push(`${h}시간`);
  if (m > 0) parts.push(`${m}분`);
  if (s > 0) parts.push(`${s}초`);

  return parts.join(" ");
}

/**
 * 숫자를 대략적인 값으로 표현한다.
 * 1234 → "약 1,200", 56 → "약 60", 5 → "5"
 */
export function approximateNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs < 10) return String(n);

  const magnitude = Math.pow(10, Math.floor(Math.log10(abs)));
  const factor = magnitude >= 100 ? magnitude / 10 : magnitude;
  const rounded = Math.round(n / factor) * factor;
  return `약 ${rounded.toLocaleString()}`;
}

/**
 * 소수를 가장 가까운 단순 분수로 변환한다.
 * 0.5 → "1/2", 0.75 → "3/4", 0.333 → "1/3"
 */
export function toFraction(decimal: number, maxDenominator: number = 100): string {
  if (Number.isInteger(decimal)) return String(decimal);

  const sign = decimal < 0 ? "-" : "";
  const abs = Math.abs(decimal);

  let bestNum = 1;
  let bestDen = 1;
  let bestError = Math.abs(abs - 1);

  for (let den = 1; den <= maxDenominator; den++) {
    const num = Math.round(abs * den);
    const error = Math.abs(abs - num / den);
    if (error < bestError) {
      bestError = error;
      bestNum = num;
      bestDen = den;
      if (error < 1e-10) break;
    }
  }

  if (bestDen === 1) return `${sign}${bestNum}`;
  return `${sign}${bestNum}/${bestDen}`;
}

/**
 * 숫자에 단위를 붙인다 (단수/복수 자동 처리).
 * pluralizeUnit(1, "item") → "1 item"
 * pluralizeUnit(3, "item") → "3 items"
 * pluralizeUnit(0, "item") → "0 items"
 */
export function pluralizeUnit(
  count: number,
  singular: string,
  plural?: string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

/**
 * 퍼센트를 시각적 바로 표현한다.
 * progressBar(0.75, 20) → "███████████████░░░░░ 75%"
 */
export function progressBar(
  ratio: number,
  width: number = 20,
  filled: string = "█",
  empty: string = "░",
): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  const filledCount = Math.round(clamped * width);
  const bar = filled.repeat(filledCount) + empty.repeat(width - filledCount);
  return `${bar} ${Math.round(clamped * 100)}%`;
}
