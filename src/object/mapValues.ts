/**
 * 객체의 모든 값에 변환 함수를 적용한 새 객체를 반환한다.
 * 키는 그대로 유지되며 반환 타입이 정확히 추론된다.
 *
 * @example
 * mapValues({ a: "1", b: "2" }, Number)   // { a: 1, b: 2 }
 * mapValues({ a: 1, b: 2 }, x => x * 2)  // { a: 2, b: 4 }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function mapValues<T extends object, U>(
  obj: T,
  valueFn: (value: T[keyof T], key: string) => U
): Record<string, U> {
  const result = {} as Record<string, U>;
  for (const key of Object.keys(obj)) {
    result[key] = valueFn((obj as Record<string, T[keyof T]>)[key], key);
  }
  return result;
}
