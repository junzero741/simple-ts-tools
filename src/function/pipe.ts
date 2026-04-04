/**
 * 값을 함수들에 왼쪽→오른쪽으로 순서대로 통과시킨다.
 * 각 함수의 반환값이 다음 함수의 입력이 된다.
 * 모든 단계의 입출력 타입이 컴파일 타임에 검증된다.
 *
 * @example
 * const result = pipe(
 *   [3, 1, 2, 1, 3],
 *   arr => unique(arr),        // [3, 1, 2]
 *   arr => arr.map(x => x * 2) // [6, 2, 4]
 * );
 * @complexity Time: O(n) — n은 단계 수 | Space: O(1)
 */
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
export function pipe<A, B, C, D, E>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E): E;
export function pipe<A, B, C, D, E, F>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F): F;
export function pipe<A, B, C, D, E, F, G>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F, fn6: (f: F) => G): G;
export function pipe<A, B, C, D, E, F, G, H>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F, fn6: (f: F) => G, fn7: (g: G) => H): H;
export function pipe<A, B, C, D, E, F, G, H, I>(value: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D, fn4: (d: D) => E, fn5: (e: E) => F, fn6: (f: F) => G, fn7: (g: G) => H, fn8: (h: H) => I): I;
export function pipe(value: unknown, ...fns: ((x: unknown) => unknown)[]): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}
