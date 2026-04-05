/**
 * 함수를 커리화한다. 인자를 하나씩 받아 마지막 인자까지 받으면 실행한다.
 * `pipe`와 조합하면 데이터 변환 파이프라인을 선언적으로 작성할 수 있다.
 *
 * 최대 4인자 함수까지 완전한 타입 추론을 지원한다.
 * 그 이상은 런타임 동작은 올바르지만 타입은 unknown으로 폴백된다.
 *
 * @example
 * const add = curry((a: number, b: number) => a + b);
 * const add10 = add(10);
 * add10(5);  // 15
 *
 * const clamp = curry((min: number, max: number, v: number) => Math.min(Math.max(v, min), max));
 * const clamp0to100 = clamp(0)(100);
 * clamp0to100(150);  // 100
 */

// 2인자
export function curry<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R;
// 3인자
export function curry<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (a: A) => (b: B) => (c: C) => R;
// 4인자
export function curry<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R
): (a: A) => (b: B) => (c: C) => (d: D) => R;
// 폴백
export function curry(fn: (...args: unknown[]) => unknown): unknown;

export function curry(fn: (...args: unknown[]) => unknown) {
  const arity = fn.length;

  function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...more: unknown[]) => curried(...args, ...more);
  }

  return curried;
}
