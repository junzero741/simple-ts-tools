/**
 * 문자열이 maxLength를 초과하면 잘라내고 suffix를 붙인다.
 * suffix 기본값은 "…" (U+2026). suffix도 maxLength에 포함된다.
 * @example truncate("Hello, World!", 8)        // "Hello, …"
 * @example truncate("Hello", 10)               // "Hello"
 * @example truncate("Hello, World!", 8, "...") // "Hello..."
 * @complexity Time: O(n) | Space: O(n)
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "…"
): string {
  if (maxLength < suffix.length) {
    throw new Error("maxLength must be >= suffix.length");
  }
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
