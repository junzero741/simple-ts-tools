/**
 * 객체를 [키, 값] 튜플 배열로 변환한다. Object.entries의 타입 안전 버전.
 *
 * @example toPairs({ a: 1, b: 2 })  // [["a", 1], ["b", 2]]
 * @complexity Time: O(n) | Space: O(n)
 */
export function toPairs<T extends object>(
  obj: T
): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  return Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][];
}

/**
 * [키, 값] 튜플 배열을 객체로 변환한다. Object.fromEntries의 타입 안전 버전.
 *
 * @example fromPairs([["a", 1], ["b", 2]])  // { a: 1, b: 2 }
 * @complexity Time: O(n) | Space: O(n)
 */
export function fromPairs<K extends string, V>(
  pairs: [K, V][]
): Record<K, V> {
  return Object.fromEntries(pairs) as Record<K, V>;
}
