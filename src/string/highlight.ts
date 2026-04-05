// 텍스트 하이라이트 / 검색 결과 마킹 (Text Highlight).
//
// === 예상 사용처 ===
// - 검색 결과 페이지 — 검색어를 <mark>로 감싸서 강조 표시
// - 자동완성 드롭다운 — 입력한 글자를 볼드/컬러로 구분
// - 코드 리뷰 — diff에서 변경된 부분 하이라이트
// - 로그 뷰어 — 키워드(ERROR, WARN)를 색상으로 구분
// - 텍스트 에디터 — 찾기/바꾸기에서 매치 위치 표시
// - CLI 출력 — grep 결과에서 매치 부분 강조
//
// highlight("Hello World", "world")
// → "Hello <mark>World</mark>"
//
// highlightAll("foo bar foo", "foo")
// → "<mark>foo</mark> bar <mark>foo</mark>"
//
// highlightWords("The quick brown fox", ["quick", "fox"])
// → "The <mark>quick</mark> brown <mark>fox</mark>"

export interface HighlightOptions {
  /** 하이라이트 태그 (기본: "mark"). */
  tag?: string;
  /** 태그에 추가할 클래스. */
  className?: string;
  /** 대소문자 무시 (기본: true). */
  caseSensitive?: boolean;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wrapMatch(text: string, tag: string, className?: string): string {
  const cls = className ? ` class="${className}"` : "";
  return `<${tag}${cls}>${escapeHtml(text)}</${tag}>`;
}

/**
 * 텍스트에서 첫 번째 매치를 하이라이트한다.
 */
export function highlight(
  text: string,
  query: string,
  options: HighlightOptions = {},
): string {
  if (!query) return escapeHtml(text);

  const { tag = "mark", className, caseSensitive = false } = options;
  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegex(query), flags);

  let result = "";
  let lastIndex = 0;
  const match = regex.exec(text);

  if (!match) return escapeHtml(text);

  result += escapeHtml(text.slice(0, match.index));
  result += wrapMatch(match[0], tag, className);
  result += escapeHtml(text.slice(match.index + match[0].length));

  return result;
}

/**
 * 텍스트에서 모든 매치를 하이라이트한다.
 */
export function highlightAll(
  text: string,
  query: string,
  options: HighlightOptions = {},
): string {
  if (!query) return escapeHtml(text);

  const { tag = "mark", className, caseSensitive = false } = options;
  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegex(query), flags);

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    result += wrapMatch(match[0], tag, className);
    lastIndex = match.index + match[0].length;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

/**
 * 여러 단어를 동시에 하이라이트한다.
 */
export function highlightWords(
  text: string,
  words: string[],
  options: HighlightOptions = {},
): string {
  if (words.length === 0) return escapeHtml(text);

  const { tag = "mark", className, caseSensitive = false } = options;
  const pattern = words.map(escapeRegex).join("|");
  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(pattern, flags);

  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    result += wrapMatch(match[0], tag, className);
    lastIndex = match.index + match[0].length;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

/**
 * 매치 위치(범위)를 반환한다 (UI 프레임워크에서 직접 렌더링용).
 */
export function findMatchRanges(
  text: string,
  query: string,
  caseSensitive: boolean = false,
): Array<{ start: number; end: number; text: string }> {
  if (!query) return [];

  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegex(query), flags);
  const ranges: Array<{ start: number; end: number; text: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[0],
    });
  }

  return ranges;
}
