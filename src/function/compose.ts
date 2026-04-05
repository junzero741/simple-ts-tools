/**
 * 함수들을 오른쪽→왼쪽 순서로 합성해 새로운 함수를 반환한다.
 * `compose(f, g, h)(x)` ≡ `f(g(h(x)))`
 *
 * 값을 즉시 적용하는 `pipe(value, ...)` 와 달리,
 * `compose`는 재사용 가능한 변환 함수를 만든다.
 * 각 단계의 입출력 타입이 컴파일 타임에 검증된다.
 *
 * @example
 * const double = (n: number) => n * 2;
 * const addOne = (n: number) => n + 1;
 * const square = (n: number) => n * n;
 *
 * const transform = compose(double, addOne, square);
 * transform(3); // square(3)=9 → addOne(9)=10 → double(10)=20
 *
 * // .map()과 함께 사용 — 재사용 가능한 변환 함수
 * [1, 2, 3].map(compose(double, addOne)); // [4, 6, 8]
 *
 * @complexity Time: O(n) — n은 단계 수 | Space: O(1)
 */
export function compose<A>(fn1: (a: A) => A): (a: A) => A;
export function compose<A, B>(
  fn2: (b: B) => B,
  fn1: (a: A) => B
): (a: A) => B;
export function compose<A, B, C>(
  fn3: (c: C) => C,
  fn2: (b: B) => C,
  fn1: (a: A) => B
): (a: A) => C;
// Heterogeneous overloads with full type tracking
export function compose<A, B>(fn2: (b: B) => unknown, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C>(fn3: (c: C) => unknown, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C, D>(fn4: (d: D) => unknown, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C, D, E>(fn5: (e: E) => unknown, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C, D, E, F>(fn6: (f: F) => unknown, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C, D, E, F, G>(fn7: (g: G) => unknown, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose<A, B, C, D, E, F, G, H>(fn8: (h: H) => unknown, fn7: (g: G) => H, fn6: (f: F) => G, fn5: (e: E) => F, fn4: (d: D) => E, fn3: (c: C) => D, fn2: (b: B) => C, fn1: (a: A) => B): (a: A) => unknown;
export function compose(...fns: ((x: unknown) => unknown)[]): (x: unknown) => unknown {
  return (value: unknown) => fns.reduceRight((acc, fn) => fn(acc), value);
}
