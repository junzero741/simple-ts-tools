/**
 * 객체에서 값이 `null` 또는 `undefined`인 키를 제외한 새 객체를 반환한다.
 *
 * `omitBy(obj, v => v == null)`의 의도를 명확히 드러내는 축약형.
 * API 요청 파라미터 정리, 폼 데이터 전송 전 처리에 자주 쓰인다.
 *
 * 0·false·"" 같은 falsy 값은 유지된다 (null·undefined만 제거).
 *
 * @example
 * omitNil({ a: 1, b: null, c: undefined, d: 0, e: "" })
 * // { a: 1, d: 0, e: "" }
 *
 * // API 파라미터 정리 — 없는 필터는 쿼리에서 자동 제외
 * const params = omitNil({
 *   page: 1,
 *   search: searchQuery || null,
 *   category: selectedCategory,  // 미선택이면 undefined
 * });
 * fetch(`/api/items?${buildQueryString(params)}`);
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function omitNil<T extends object>(
  obj: T
): { [K in keyof T as T[K] extends null | undefined ? never : K]: T[K] } {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] != null) {
      result[key as string] = obj[key];
    }
  }
  return result as ReturnType<typeof omitNil<T>>;
}

/**
 * 객체에서 falsy 값(null, undefined, false, 0, "")인 키를 모두 제외한다.
 *
 * `omitBy(obj, v => !v)`의 의도를 명확히 드러내는 축약형.
 * `omitNil`보다 더 공격적으로 정리할 때 사용한다.
 *
 * @example
 * omitFalsy({ a: 1, b: null, c: undefined, d: 0, e: "", f: false, g: "hello" })
 * // { a: 1, g: "hello" }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function omitFalsy<T extends object>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key]) {
      result[key as string] = obj[key];
    }
  }
  return result as Partial<T>;
}
