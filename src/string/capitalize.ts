/**
 * 문자열의 첫 글자를 대문자로, 나머지를 소문자로 변환한다.
 * @example capitalize("hello world")   // "Hello world"
 * @example capitalize("HELLO")         // "Hello"
 * @example capitalize("")              // ""
 * @complexity Time: O(n) | Space: O(n)
 */
export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
