/**
 * 문자열이 유효한 URL인지 확인한다.
 * `new URL()`을 사용해 파싱하므로 브라우저 / Node.js 양쪽에서 동작한다.
 *
 * @param value           검증할 문자열
 * @param allowedProtocols 허용할 프로토콜 목록 (기본: ["http:", "https:"])
 *
 * @example isUrl("https://example.com")        // true
 * @example isUrl("ftp://files.example.com")    // false  (기본 프로토콜 제한)
 * @example isUrl("ftp://files.example.com", ["ftp:"])  // true
 * @example isUrl("not a url")                  // false
 */
export function isUrl(
  value: string,
  allowedProtocols: string[] = ["http:", "https:"]
): boolean {
  try {
    const url = new URL(value);
    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}
