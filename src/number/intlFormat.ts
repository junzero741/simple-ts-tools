/**
 * Intl 기반 숫자/통화/퍼센트/단위 포매터.
 *
 * 브라우저/Node 내장 Intl API를 활용한 로케일 인식 포맷.
 * 반복 사용 시 Intl.NumberFormat 인스턴스를 캐시하여 성능 최적화.
 *
 * @example
 * formatCurrency(1234.5, "USD");          // "$1,234.50"
 * formatCurrency(1234.5, "KRW", "ko-KR"); // "₩1,235"
 *
 * formatCompact(1_500_000);               // "1.5M"
 * formatCompact(1_500_000, "ko-KR");      // "150만"
 *
 * formatPercent(0.1234);                   // "12%"
 * formatPercent(0.1234, { decimals: 1 });  // "12.3%"
 *
 * formatOrdinal(1, "en");                 // "1st"
 * formatOrdinal(3, "en");                 // "3rd"
 *
 * formatList(["a", "b", "c"]);            // "a, b, and c"
 * formatList(["a", "b", "c"], "ko-KR");   // "a, b 및 c"
 *
 * @complexity Time: O(1) per call (캐시 후). Space: O(k) 캐시 크기.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getCached(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, options);
    formatterCache.set(key, fmt);
  }
  return fmt;
}

/**
 * 통화 포맷.
 * @param value 금액
 * @param currency ISO 4217 통화 코드 (예: "USD", "KRW", "EUR")
 * @param locale 로케일 (기본: "en-US")
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string = "en-US",
): string {
  return getCached(locale, { style: "currency", currency }).format(value);
}

/**
 * 간결한 숫자 포맷 (1K, 1.5M, 150만).
 * @param value 숫자
 * @param locale 로케일 (기본: "en-US")
 */
export function formatCompact(
  value: number,
  locale: string = "en-US",
): string {
  return getCached(locale, { notation: "compact" }).format(value);
}

export interface PercentOptions {
  /** 소수점 자릿수 (기본: 0) */
  decimals?: number;
}

/**
 * 퍼센트 포맷. 입력은 비율 (0.12 → "12%").
 */
export function formatPercent(
  value: number,
  options: PercentOptions & { locale?: string } = {},
): string {
  const { decimals = 0, locale = "en-US" } = options;
  return getCached(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 단위 포맷.
 * @param value 숫자
 * @param unit Intl 단위 (예: "kilometer", "kilogram", "liter", "celsius")
 * @param locale 로케일 (기본: "en-US")
 */
export function formatUnit(
  value: number,
  unit: string,
  locale: string = "en-US",
): string {
  return getCached(locale, {
    style: "unit",
    unit,
    unitDisplay: "short",
  }).format(value);
}

/**
 * 서수 포맷 (1st, 2nd, 3rd...).
 * @param value 정수
 * @param locale 로케일 (기본: "en")
 */
export function formatOrdinal(value: number, locale: string = "en"): string {
  const pr = new Intl.PluralRules(locale, { type: "ordinal" });
  const rule = pr.select(value);

  const suffixes: Record<string, Record<string, string>> = {
    en: { one: "st", two: "nd", few: "rd", other: "th" },
  };

  const localeSuffixes = suffixes[locale];
  if (localeSuffixes) {
    return `${value}${localeSuffixes[rule] || localeSuffixes.other}`;
  }

  // 지원하지 않는 로케일은 숫자만 반환
  return `${value}`;
}

/**
 * 리스트 포맷 ("a, b, and c").
 * @param items 문자열 배열
 * @param locale 로케일 (기본: "en-US")
 * @param type "conjunction" (and) | "disjunction" (or) (기본: "conjunction")
 */
export function formatList(
  items: string[],
  locale: string = "en-US",
  type: "conjunction" | "disjunction" = "conjunction",
): string {
  return new Intl.ListFormat(locale, { style: "long", type }).format(items);
}
