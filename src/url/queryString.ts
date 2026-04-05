type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue | QueryValue[]>;

/**
 * URL 쿼리 문자열을 파싱해 객체로 반환한다.
 * 같은 키가 여러 번 등장하면 배열로 반환한다.
 *
 * @param query  파싱할 쿼리 문자열 (앞의 `?`는 있어도 없어도 됨)
 *
 * @example
 * parseQueryString("?page=1&sort=name")
 * // { page: "1", sort: "name" }
 *
 * parseQueryString("tags=a&tags=b&tags=c")
 * // { tags: ["a", "b", "c"] }
 *
 * parseQueryString("?q=hello%20world")
 * // { q: "hello world" }
 */
export function parseQueryString(query: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  const params = new URLSearchParams(query);

  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }

  return result;
}

/**
 * 객체를 URL 쿼리 문자열로 변환한다.
 * 값이 배열이면 같은 키를 반복한다.
 * null / undefined 값은 제외된다.
 *
 * @param params  변환할 파라미터 객체
 *
 * @example
 * buildQueryString({ page: 1, sort: "name" })
 * // "page=1&sort=name"
 *
 * buildQueryString({ tags: ["a", "b", "c"] })
 * // "tags=a&tags=b&tags=c"
 *
 * buildQueryString({ q: "hello world" })
 * // "q=hello+world"
 */
export function buildQueryString(params: QueryParams): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) {
          search.append(key, String(item));
        }
      }
    } else {
      search.append(key, String(value));
    }
  }

  return search.toString();
}
