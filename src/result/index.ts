/**
 * 성공(Ok) 또는 실패(Err)를 명시적으로 표현하는 타입.
 * 함수가 throw 대신 Result를 반환하면 호출자가 에러를 반드시 처리해야 한다.
 *
 * @example
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) return err("division by zero");
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

/** Ok 값을 생성한다. */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/** Err 값을 생성한다. */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * 동기 함수를 실행하고 결과를 Result로 감싼다.
 * throw가 발생하면 Err로, 정상 반환이면 Ok로 변환한다.
 */
export function tryCatch<T>(fn: () => T): Result<T, unknown> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e);
  }
}

/**
 * 비동기 함수를 실행하고 결과를 Result로 감싼다.
 * reject되면 Err로, resolve되면 Ok로 변환한다.
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, unknown>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e);
  }
}

/**
 * Result가 Ok이면 mapFn을 적용한 새 Ok를 반환한다. Err이면 그대로 전파한다.
 * 파이프라인에서 Ok 값을 변환할 때 사용한다.
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  mapFn: (value: T) => U
): Result<U, E> {
  return result.ok ? ok(mapFn(result.value)) : result;
}

/**
 * Result에서 Ok의 값을 꺼낸다. Err이면 fallback을 반환한다.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}
