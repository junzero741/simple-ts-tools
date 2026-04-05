const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

const UNESCAPE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ESCAPE_MAP).map(([k, v]) => [v, k])
);

const ESCAPE_REGEX = /[&<>"']/g;
const UNESCAPE_REGEX = /&(?:amp|lt|gt|quot|#x27);/g;

/**
 * HTML 특수 문자를 엔티티로 변환해 XSS를 방지한다.
 * innerHTML에 동적 데이터를 삽입하기 전에 반드시 적용한다.
 *
 * 변환 대상: & < > " '
 *
 * @example escapeHtml('<script>alert("xss")</script>')
 * // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char]);
}

/**
 * HTML 엔티티를 원래 문자로 복원한다. escapeHtml의 역연산.
 *
 * @example unescapeHtml('&lt;b&gt;hello&lt;/b&gt;')  // '<b>hello</b>'
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function unescapeHtml(str: string): string {
  return str.replace(UNESCAPE_REGEX, (entity) => UNESCAPE_MAP[entity] ?? entity);
}
