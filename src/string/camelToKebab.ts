/**
 * camelCase / PascalCase 문자열을 kebab-case로 변환한다.
 * @example camelToKebab("backgroundColor")   // "background-color"
 * @example camelToKebab("XMLParser")          // "xml-parser"
 * @example camelToKebab("getHTTPSResponse")   // "get-https-response"
 * @complexity Time: O(n) | Space: O(n)
 */
export function camelToKebab(str: string): string {
  return str
    // 연속 대문자 뒤에 대문자+소문자가 오는 경우: "XMLParser" → "XML-Parser"
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    // 소문자/숫자 뒤에 대문자가 오는 경우: "backgroundColor" → "background-Color"
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}
