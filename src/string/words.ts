/**
 * 문자열의 단어 수를 반환한다.
 *
 * 연속 공백·탭·줄바꿈은 하나의 구분자로 처리한다.
 * 빈 문자열이나 공백만 있는 문자열은 0을 반환한다.
 *
 * @example
 * wordCount("Hello World");       // 2
 * wordCount("  Hello   World  "); // 2
 * wordCount("");                  // 0
 * wordCount("안녕 세상");          // 2
 */
export function wordCount(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * 문자열을 단어 배열로 분리한다.
 *
 * @example
 * words("Hello World");         // ["Hello", "World"]
 * words("  Hello   World  ");   // ["Hello", "World"]
 * words("");                    // []
 */
export function words(str: string): string[] {
  const trimmed = str.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
}

/**
 * 단어 수 기준으로 문자열을 잘라내고 suffix를 붙인다.
 *
 * `truncate`가 문자 수 기준인 것과 달리, 이 함수는 단어 기준으로 자른다.
 * 리치 텍스트 미리보기, 카드 요약 등에서 문장이 단어 중간에 잘리는 현상을 방지한다.
 *
 * @param suffix 초과 시 붙일 접미사 (기본: "…")
 *
 * @example
 * truncateWords("Hello World Foo Bar", 2);        // "Hello World…"
 * truncateWords("Hello World", 5);                // "Hello World"  (초과 없음)
 * truncateWords("Hello World Foo", 2, " [more]"); // "Hello World [more]"
 */
export function truncateWords(str: string, maxWords: number, suffix = "…"): string {
  const wordList = words(str);
  if (wordList.length <= maxWords) return str;
  return wordList.slice(0, maxWords).join(" ") + suffix;
}
