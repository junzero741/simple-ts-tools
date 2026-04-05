// 입력 살균 (Sanitize).
//
// 사용자 입력에서 위험한 문자를 제거/치환한다.
// XSS 방지, SQL 특수문자 이스케이프, 파일명 안전화,
// 제어 문자 제거 등 보안 경계에서 필수적인 유틸.
//
// sanitizeFilename("../../etc/passwd")    → "etcpasswd"
// stripTags("<b>hello</b><script>alert(1)</script>") → "helloalert(1)"
// removeControlChars("hello\x00world")    → "helloworld"
// escapeRegExp("foo.bar[0]")              → "foo\\.bar\\[0\\]"

/**
 * 파일명에 사용할 수 없는 문자를 제거한다.
 * 디렉토리 순회(../ 등)도 방지한다.
 */
export function sanitizeFilename(name: string, replacement: string = ""): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, replacement)
    .replace(/\.\./g, replacement)
    .replace(/^\.+/, replacement)
    .trim()
    || "unnamed";
}

/**
 * HTML 태그를 모두 제거한다.
 * 주의: 이것은 sanitizer가 아닌 strip. 렌더링 전 XSS 방지에는
 * escapeHtml을 사용해야 한다.
 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * 제어 문자(0x00-0x1F, 0x7F)를 제거한다.
 * 탭/개행은 선택적으로 보존 가능.
 */
export function removeControlChars(
  str: string,
  options: { preserveNewlines?: boolean; preserveTabs?: boolean } = {},
): string {
  const { preserveNewlines = false, preserveTabs = false } = options;

  return str.replace(/[\x00-\x1f\x7f]/g, (char) => {
    if (preserveNewlines && (char === "\n" || char === "\r")) return char;
    if (preserveTabs && char === "\t") return char;
    return "";
  });
}

/**
 * 정규식 특수문자를 이스케이프한다.
 * 사용자 입력을 정규식 패턴에 안전하게 삽입할 때 사용.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 유니코드 제로 너비 문자(ZWJ, ZWNJ, ZWS 등)를 제거한다.
 * 복사 붙여넣기 공격, 가짜 동일 문자열 방지.
 */
export function removeZeroWidth(str: string): string {
  return str.replace(/[\u200B-\u200F\u2028-\u202F\u2060\uFEFF]/g, "");
}

/**
 * 문자열을 최대 길이로 제한하고 초과분을 잘라낸다.
 * truncate와 달리 말줄임 없이 정확한 길이 제한.
 */
export function limitLength(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength);
}

/**
 * 연속된 공백을 하나로 합치고 양끝 공백을 제거한다.
 */
export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * SQL 특수문자를 이스케이프한다.
 * 참고: Parameterized query를 우선 사용해야 하며,
 * 이 함수는 최후의 수단으로만 사용한다.
 */
export function escapeSql(str: string): string {
  return str.replace(/['\\]/g, "\\$&");
}
