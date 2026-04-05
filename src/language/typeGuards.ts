/**
 * 값이 null 또는 undefined인지 확인한다.
 * @example isNil(null)       // true
 * @example isNil(undefined)  // true
 * @example isNil(0)          // false
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 값이 null도 undefined도 아닌지 확인한다. isNil의 반전.
 * 반환 타입이 `NonNullable<T>`로 좁혀진다.
 * @example isDefined("hello")   // true
 * @example isDefined(null)      // false
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * 값이 string인지 확인한다.
 * @example isString("hello")  // true
 * @example isString(42)       // false
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * 값이 number인지 확인한다. NaN은 false로 처리한다.
 * @example isNumber(42)    // true
 * @example isNumber(NaN)   // false
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * 값이 boolean인지 확인한다.
 * @example isBoolean(true)   // true
 * @example isBoolean(1)      // false
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * 값이 배열인지 확인한다.
 * @example isArray([1, 2, 3])  // true
 * @example isArray({})         // false
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * 값이 plain 객체인지 확인한다.
 * null, 배열, Date, Map 등은 false로 처리한다.
 * @example isObject({ a: 1 })       // true
 * @example isObject(null)           // false
 * @example isObject([1, 2, 3])      // false
 * @example isObject(new Date())     // false
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 값이 함수인지 확인한다.
 * @example isFunction(() => {})  // true
 * @example isFunction(42)        // false
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}
