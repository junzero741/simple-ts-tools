/**
 * 타입 가드 조합기 (Type Guard Combinators).
 *
 * 런타임 타입 검증을 선언적으로 조합한다.
 * 기본 가드(`is.string` 등)를 `and`, `or`, `arrayOf`, `shape` 등으로
 * 합성하여 복잡한 타입 가드를 만든다.
 *
 * @example
 * // 기본 타입 가드
 * is.string("hello");    // true
 * is.number(42);          // true
 * is.nil(null);           // true
 *
 * @example
 * // 배열 가드
 * is.arrayOf(is.number)([1, 2, 3]);   // true
 * is.arrayOf(is.string)([1, "a"]);    // false
 *
 * @example
 * // 객체 shape 가드
 * const isUser = is.shape({
 *   name: is.string,
 *   age: is.number,
 *   email: is.optional(is.string),
 * });
 *
 * isUser({ name: "alice", age: 30 });          // true
 * isUser({ name: "alice", age: "thirty" });    // false
 *
 * @example
 * // 조합: or, and
 * const isStringOrNumber = is.or(is.string, is.number);
 * isStringOrNumber("hi");  // true
 * isStringOrNumber(42);    // true
 * isStringOrNumber(true);  // false
 */

export type Guard<T> = (value: unknown) => value is T;

function createGuard<T>(fn: (value: unknown) => boolean): Guard<T> {
  return fn as Guard<T>;
}

export const is = {
  string: createGuard<string>((v): v is string => typeof v === "string"),

  number: createGuard<number>((v): v is number => typeof v === "number" && !Number.isNaN(v)),

  boolean: createGuard<boolean>((v): v is boolean => typeof v === "boolean"),

  bigint: createGuard<bigint>((v): v is bigint => typeof v === "bigint"),

  symbol: createGuard<symbol>((v): v is symbol => typeof v === "symbol"),

  function: createGuard<Function>((v): v is Function => typeof v === "function"),

  undefined: createGuard<undefined>((v): v is undefined => v === undefined),

  null: createGuard<null>((v): v is null => v === null),

  nil: createGuard<null | undefined>((v): v is null | undefined => v == null),

  defined: createGuard<NonNullable<unknown>>((v) => v != null),

  object: createGuard<Record<string, unknown>>(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v),
  ),

  array: createGuard<unknown[]>((v): v is unknown[] => Array.isArray(v)),

  date: createGuard<Date>((v): v is Date => v instanceof Date && !isNaN(v.getTime())),

  regexp: createGuard<RegExp>((v): v is RegExp => v instanceof RegExp),

  promise: createGuard<Promise<unknown>>((v): v is Promise<unknown> =>
    typeof v === "object" && v !== null && typeof (v as any).then === "function",
  ),

  /** 특정 리터럴 값과 일치하는 가드 */
  literal<T extends string | number | boolean>(expected: T): Guard<T> {
    return createGuard<T>((v) => v === expected);
  },

  /** 배열의 모든 요소가 가드를 만족하는지 검사 */
  arrayOf<T>(guard: Guard<T>): Guard<T[]> {
    return createGuard<T[]>((v) => Array.isArray(v) && v.every(guard));
  },

  /** 값이 undefined이거나 가드를 만족하는지 검사 */
  optional<T>(guard: Guard<T>): Guard<T | undefined> {
    return createGuard<T | undefined>((v) => v === undefined || guard(v));
  },

  /** 값이 null/undefined이거나 가드를 만족하는지 검사 */
  nullable<T>(guard: Guard<T>): Guard<T | null | undefined> {
    return createGuard<T | null | undefined>((v) => v == null || guard(v));
  },

  /** 하나라도 만족하면 통과 (union) */
  or<T extends Guard<unknown>[]>(...guards: T): Guard<T[number] extends Guard<infer U> ? U : never> {
    return createGuard((v) => guards.some((g) => g(v))) as any;
  },

  /** 모두 만족해야 통과 (intersection) */
  and<T extends Guard<unknown>[]>(...guards: T): Guard<unknown> {
    return createGuard((v) => guards.every((g) => g(v)));
  },

  /** 가드를 반전시킨다 */
  not<T>(guard: Guard<T>): Guard<Exclude<unknown, T>> {
    return createGuard<Exclude<unknown, T>>((v) => !guard(v));
  },

  /** 객체 shape 검증. 모든 프로퍼티가 대응하는 가드를 만족해야 한다. */
  shape<T extends Record<string, Guard<unknown>>>(
    schema: T,
  ): Guard<{ [K in keyof T]: T[K] extends Guard<infer U> ? U : never }> {
    type Result = { [K in keyof T]: T[K] extends Guard<infer U> ? U : never };
    return createGuard<Result>((v) => {
      if (typeof v !== "object" || v === null) return false;
      const obj = v as Record<string, unknown>;
      return Object.entries(schema).every(([key, guard]) => guard(obj[key]));
    });
  },

  /** enum 값 중 하나인지 검사 */
  oneOf<T extends readonly (string | number | boolean)[]>(
    ...values: T
  ): Guard<T[number]> {
    return createGuard<T[number]>((v) => (values as readonly unknown[]).includes(v));
  },

  /** 인스턴스 검사 */
  instanceOf<T>(ctor: new (...args: any[]) => T): Guard<T> {
    return createGuard<T>((v) => v instanceof ctor);
  },

  /** Record<string, V> 가드 */
  recordOf<V>(valueGuard: Guard<V>): Guard<Record<string, V>> {
    return createGuard<Record<string, V>>((v) => {
      if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
      return Object.values(v).every(valueGuard);
    });
  },

  /** 튜플 가드 */
  tuple<T extends Guard<unknown>[]>(
    ...guards: T
  ): Guard<{ [K in keyof T]: T[K] extends Guard<infer U> ? U : never }> {
    type Result = { [K in keyof T]: T[K] extends Guard<infer U> ? U : never };
    return createGuard<Result>((v) => {
      if (!Array.isArray(v) || v.length !== guards.length) return false;
      return guards.every((g, i) => g(v[i]));
    });
  },
};
