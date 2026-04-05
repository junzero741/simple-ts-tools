/**
 * 숫자를 천 단위 구분 기호와 소수점 자릿수를 적용해 문자열로 반환한다.
 * 내부적으로 `Intl.NumberFormat`을 사용한다.
 *
 * @param value       포맷할 숫자
 * @param options     포맷 옵션
 * @param options.decimals      소수 자릿수 (기본: 0 — 정수로 반올림)
 * @param options.locale        로케일 (기본: "ko-KR")
 * @param options.currency      통화 코드 (예: "KRW", "USD") — 지정 시 통화 기호 포함
 * @param options.notation      "standard" | "compact" (기본: "standard")
 *
 * @example
 * formatNumber(1234567)                          // "1,234,567"
 * formatNumber(1234567.89, { decimals: 2 })      // "1,234,567.89"
 * formatNumber(1234567, { currency: "KRW" })     // "₩1,234,567"
 * formatNumber(9800000, { notation: "compact" }) // "980만" (ko-KR)
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function formatNumber(
  value: number,
  options: {
    decimals?: number;
    locale?: string;
    currency?: string;
    notation?: "standard" | "compact";
  } = {}
): string {
  const { decimals = 0, locale = "ko-KR", currency, notation = "standard" } = options;

  const fmt = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(currency
      ? { style: "currency", currency }
      : {}),
    ...(notation === "compact"
      ? { notation: "compact", compactDisplay: "short" }
      : {}),
  });

  return fmt.format(value);
}
