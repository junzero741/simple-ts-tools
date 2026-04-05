/**
 * 런타임 계약 검증 (Assertions).
 *
 * 함수 진입점, 불변 조건, 불가능한 코드 경로를 명시적으로 표현한다.
 * TypeScript의 asserts 타입 가드와 결합하여 이후 코드에서
 * 타입이 자동 좁혀진다.
 *
 * @example
 * function divide(a: number, b: number): number {
 *   assert(b !== 0, "divisor must not be zero");
 *   return a / b;
 * }
 *
 * @example
 * // assertDefined — null/undefined 제거
 * const el = document.getElementById("app");
 * assertDefined(el, "app element not found");
 * el.textContent = "hello"; // el은 HTMLElement로 좁혀짐
 *
 * @example
 * // unreachable — 불가능한 코드 경로
 * type Shape = "circle" | "rect";
 * function area(shape: Shape): number {
 *   switch (shape) {
 *     case "circle": return Math.PI * r * r;
 *     case "rect": return w * h;
 *     default: unreachable(shape); // exhaustive check
 *   }
 * }
 *
 * @example
 * // assertInstanceOf — 타입 좁히기
 * assertInstanceOf(err, TypeError);
 * err.message; // TypeError로 좁혀짐
 */

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

/**
 * 조건이 참인지 검증한다. 거짓이면 AssertionError를 던진다.
 * TypeScript asserts 키워드로 이후 코드에서 타입이 좁혀진다.
 */
export function assert(
  condition: unknown,
  message: string = "Assertion failed",
): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

/**
 * 값이 null/undefined가 아닌지 검증한다.
 * 통과하면 NonNullable<T>로 좁혀진다.
 */
export function assertDefined<T>(
  value: T,
  message: string = "Expected value to be defined",
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new AssertionError(message);
  }
}

/**
 * 값이 특정 타입의 인스턴스인지 검증한다.
 */
export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  message?: string,
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new AssertionError(
      message ?? `Expected instance of ${constructor.name}, got ${typeof value}`,
    );
  }
}

/**
 * 값이 특정 typeof 타입인지 검증한다.
 */
export function assertType(
  value: unknown,
  type: "string" | "number" | "boolean" | "bigint" | "symbol" | "function" | "object",
  message?: string,
): void {
  if (typeof value !== type) {
    throw new AssertionError(
      message ?? `Expected typeof ${type}, got ${typeof value}`,
    );
  }
}

/**
 * 도달해서는 안 되는 코드 경로를 표시한다.
 * exhaustive switch/if 검사에 사용. never 타입을 받아 컴파일 타임에도 검증.
 */
export function unreachable(value: never, message?: string): never {
  throw new AssertionError(
    message ?? `Unreachable code reached with value: ${JSON.stringify(value)}`,
  );
}

/**
 * 조건이 참인지 검증하되, 프로덕션에서 제거 가능한 소프트 어설션.
 * 실패 시 throw 대신 console.error를 호출하고 false를 반환한다.
 */
export function softAssert(
  condition: unknown,
  message: string = "Soft assertion failed",
): boolean {
  if (!condition) {
    console.error(`[SoftAssert] ${message}`);
    return false;
  }
  return true;
}

/**
 * 범위 검증. min <= value <= max.
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  label: string = "value",
): void {
  if (value < min || value > max) {
    throw new AssertionError(
      `${label} must be between ${min} and ${max}, got ${value}`,
    );
  }
}
