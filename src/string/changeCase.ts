/**
 * 문자열을 단어 단위로 분리한다.
 * 공백, 하이픈, 언더스코어, camelCase/PascalCase 경계를 모두 처리한다.
 *
 * @internal
 */
function splitIntoWords(str: string): string[] {
  return (
    str
      // 연속 대문자 뒤에 대문자+소문자: "XMLParser" → "XML Parser"
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      // 소문자/숫자 뒤에 대문자: "camelCase" → "camel Case"
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      // 하이픈·언더스코어를 공백으로
      .replace(/[-_]+/g, " ")
      // 공백 기준 분리 후 빈 문자열 제거
      .split(/\s+/)
      .filter(Boolean)
  );
}

/**
 * 어떤 형식의 문자열이든 Title Case로 변환한다.
 * 각 단어의 첫 글자를 대문자, 나머지를 소문자로 변환한다.
 *
 * @example
 * toTitleCase("hello world")    // "Hello World"
 * toTitleCase("hello-world")    // "Hello World"
 * toTitleCase("hello_world")    // "Hello World"
 * toTitleCase("helloWorld")     // "Hello World"
 * toTitleCase("XMLParser")      // "Xml Parser"
 */
export function toTitleCase(str: string): string {
  return splitIntoWords(str)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * 어떤 형식의 문자열이든 camelCase로 변환한다.
 *
 * @example
 * toCamelCase("hello world")    // "helloWorld"
 * toCamelCase("hello-world")    // "helloWorld"
 * toCamelCase("hello_world")    // "helloWorld"
 * toCamelCase("HelloWorld")     // "helloWorld"
 * toCamelCase("XMLParser")      // "xmlParser"
 * toCamelCase("get-user-id")    // "getUserId"
 */
export function toCamelCase(str: string): string {
  const ws = splitIntoWords(str);
  if (ws.length === 0) return "";
  return (
    ws[0].toLowerCase() +
    ws
      .slice(1)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

/**
 * 어떤 형식의 문자열이든 PascalCase로 변환한다.
 *
 * @example
 * toPascalCase("hello world")   // "HelloWorld"
 * toPascalCase("hello-world")   // "HelloWorld"
 * toPascalCase("hello_world")   // "HelloWorld"
 * toPascalCase("helloWorld")    // "HelloWorld"
 * toPascalCase("XMLParser")     // "XmlParser"
 * toPascalCase("get-user-id")   // "GetUserId"
 */
export function toPascalCase(str: string): string {
  return splitIntoWords(str)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/**
 * 어떤 형식의 문자열이든 SCREAMING_SNAKE_CASE로 변환한다.
 *
 * @example
 * toScreamingSnake("hello world")   // "HELLO_WORLD"
 * toScreamingSnake("hello-world")   // "HELLO_WORLD"
 * toScreamingSnake("helloWorld")    // "HELLO_WORLD"
 * toScreamingSnake("XMLParser")     // "XML_PARSER"
 */
export function toScreamingSnake(str: string): string {
  return splitIntoWords(str)
    .map(w => w.toUpperCase())
    .join("_");
}
