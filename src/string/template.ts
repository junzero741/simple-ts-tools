/**
 * 문자열 템플릿의 `{{변수명}}` 자리 표시자를 주어진 데이터로 치환한다.
 * 정의되지 않은 변수는 빈 문자열로 치환한다.
 *
 * @param str  템플릿 문자열 (`{{key}}` 형식의 자리 표시자 포함)
 * @param data 치환할 값들의 레코드
 *
 * @example
 * template("안녕하세요, {{name}}님!", { name: "Alice" })
 * // "안녕하세요, Alice님!"
 *
 * template("{{year}}년 {{month}}월 {{day}}일", { year: 2024, month: 6, day: 7 })
 * // "2024년 6월 7일"
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function template(
  str: string,
  data: Record<string, string | number | boolean | null | undefined>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = data[key];
    return value == null ? "" : String(value);
  });
}
