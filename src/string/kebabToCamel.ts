/**
 * kebab-case 문자열을 camelCase로 변환한다.
 * @example kebabToCamel("background-color")    // "backgroundColor"
 * @example kebabToCamel("my-component-name")   // "myComponentName"
 * @example kebabToCamel("already")             // "already"
 * @complexity Time: O(n) | Space: O(n)
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}
