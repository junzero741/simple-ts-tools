/**
 * 안전한 JSON 파싱/직렬화.
 *
 * - `safeJsonParse` — 예외 대신 Result 타입 반환. reviver 지원.
 * - `safeJsonStringify` — 순환 참조를 자동 처리. replacer, space 지원.
 *
 * @example
 * // 안전한 파싱 — 실패해도 예외 없음
 * const result = safeJsonParse<{ name: string }>('{"name":"alice"}');
 * if (result.ok) {
 *   console.log(result.value.name); // "alice"
 * } else {
 *   console.error(result.error);
 * }
 *
 * @example
 * // 순환 참조가 있는 객체도 안전하게 직렬화
 * const obj: any = { a: 1 };
 * obj.self = obj;
 * safeJsonStringify(obj); // '{"a":1,"self":"[Circular]"}'
 *
 * @example
 * // 실패 시 기본값
 * const data = safeJsonParse<number[]>("not json");
 * const arr = data.ok ? data.value : [];
 */

export type JsonParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: SyntaxError };

/**
 * 예외를 던지지 않는 JSON.parse.
 * 성공 시 `{ ok: true, value }`, 실패 시 `{ ok: false, error }`.
 */
export function safeJsonParse<T = unknown>(
  text: string,
  reviver?: (key: string, value: unknown) => unknown,
): JsonParseResult<T> {
  try {
    const value = JSON.parse(text, reviver) as T;
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error as SyntaxError };
  }
}

export interface StringifyOptions {
  /** JSON.stringify의 replacer */
  replacer?: (key: string, value: unknown) => unknown;
  /** 들여쓰기 (숫자 또는 문자열) */
  space?: number | string;
  /** 순환 참조 대체 문자열 (기본값: "[Circular]") */
  circularValue?: string;
}

/**
 * 순환 참조를 안전하게 처리하는 JSON.stringify.
 * 순환 참조 위치에 `"[Circular]"`(또는 지정된 문자열)을 삽입한다.
 */
export function safeJsonStringify(
  value: unknown,
  options: StringifyOptions = {},
): string {
  const { replacer, space, circularValue = "[Circular]" } = options;
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    function (key: string, val: unknown) {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return circularValue;
        seen.add(val);
      }
      return replacer ? replacer.call(this, key, val) : val;
    },
    space,
  );
}
