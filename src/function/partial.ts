/**
 * 함수의 앞쪽 인자를 미리 바인딩한 새 함수를 반환한다.
 *
 * curry와의 차이:
 * - curry: 인자를 한 번에 하나씩 받는 함수 체인 생성
 * - partial: 여러 초기 인자를 한 번에 바인딩, 나머지는 호출 시 전달
 *
 * 최대 4인자 함수까지 완전한 타입 추론을 지원한다.
 *
 * @example
 * const multiply = (a: number, b: number, c: number) => a * b * c;
 * const double = partial(multiply, 2);
 * double(3, 4);  // 24
 *
 * const clamp = (min: number, max: number, v: number) => Math.min(Math.max(v, min), max);
 * const clamp0to100 = partial(clamp, 0, 100);
 * clamp0to100(150);  // 100
 * clamp0to100(-10);  // 0
 * [150, 50, -10].map(clamp0to100);  // [100, 50, 0]
 */

// 2인자 함수 — 1개 바인딩
export function partial<A, B, R>(fn: (a: A, b: B) => R, a: A): (b: B) => R;

// 3인자 함수 — 1개 바인딩
export function partial<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R,
  a: A
): (b: B, c: C) => R;

// 3인자 함수 — 2개 바인딩
export function partial<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R,
  a: A,
  b: B
): (c: C) => R;

// 4인자 함수 — 1개 바인딩
export function partial<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R,
  a: A
): (b: B, c: C, d: D) => R;

// 4인자 함수 — 2개 바인딩
export function partial<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R,
  a: A,
  b: B
): (c: C, d: D) => R;

// 4인자 함수 — 3개 바인딩
export function partial<A, B, C, D, R>(
  fn: (a: A, b: B, c: C, d: D) => R,
  a: A,
  b: B,
  c: C
): (d: D) => R;

// 5인자 함수 — 1개 바인딩
export function partial<A, B, C, D, E, R>(
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
  a: A
): (b: B, c: C, d: D, e: E) => R;

// 5인자 함수 — 2개 바인딩
export function partial<A, B, C, D, E, R>(
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
  a: A,
  b: B
): (c: C, d: D, e: E) => R;

// 5인자 함수 — 3개 바인딩
export function partial<A, B, C, D, E, R>(
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
  a: A,
  b: B,
  c: C
): (d: D, e: E) => R;

// 5인자 함수 — 4개 바인딩
export function partial<A, B, C, D, E, R>(
  fn: (a: A, b: B, c: C, d: D, e: E) => R,
  a: A,
  b: B,
  c: C,
  d: D
): (e: E) => R;

// 구현
export function partial(
  fn: (...args: unknown[]) => unknown,
  ...boundArgs: unknown[]
): (...remainingArgs: unknown[]) => unknown {
  return (...remainingArgs: unknown[]) => fn(...boundArgs, ...remainingArgs);
}
