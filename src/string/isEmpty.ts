/**
 * 문자열이 비어 있거나 공백만으로 구성됐는지 확인한다.
 * null / undefined도 빈 값으로 간주한다.
 * @example isEmpty("")        // true
 * @example isEmpty("   ")     // true
 * @example isEmpty(null)      // true
 * @example isEmpty("hello")   // false
 * @complexity Time: O(n) | Space: O(1)
 */
export function isEmpty(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}
