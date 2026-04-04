/**
 * 배열에서 falsy 값(false, null, undefined, 0, NaN, "")을 제거한다.
 * 반환 타입에서 falsy 타입이 자동으로 제외된다.
 *
 * @example compact([0, 1, false, 2, '', 3, null, undefined]) // [1, 2, 3]
 * @example compact([1, null, 'hello', undefined])            // [1, 'hello']
 * @complexity Time: O(n) | Space: O(n)
 */
export function compact<T>(
  arr: (T | null | undefined | false | 0 | "")[]
): T[] {
  return arr.filter(Boolean) as T[];
}
