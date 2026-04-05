/**
 * camelCase/PascalCase 문자열을 snake_case로 변환한다.
 * 약어(XML, HTTP 등)도 올바르게 처리한다.
 *
 * @example camelToSnake("backgroundColor")   // "background_color"
 * @example camelToSnake("XMLParser")          // "xml_parser"
 * @example camelToSnake("getHTTPSResponse")   // "get_https_response"
 * @example camelToSnake("userId")             // "user_id"
 */
export function camelToSnake(str: string): string {
  return str
    // 연속된 대문자 다음에 소문자가 오는 경우: XMLParser → XML_Parser
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    // 소문자/숫자 뒤에 대문자가 오는 경우: camelCase → camel_Case
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * snake_case 문자열을 camelCase로 변환한다.
 *
 * @example snakeToCamel("background_color")   // "backgroundColor"
 * @example snakeToCamel("user_id")            // "userId"
 * @example snakeToCamel("get_https_response") // "getHttpsResponse"
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}
