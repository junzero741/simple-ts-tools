/**
 * 값을 비동기 함수들에 왼쪽→오른쪽으로 순서대로 통과시킨다.
 * 각 단계는 동기 함수 또는 Promise를 반환하는 함수 모두 허용한다.
 * 모든 단계가 완료된 최종 결과를 Promise로 반환한다.
 *
 * - 동기·비동기 함수를 자유롭게 혼합할 수 있다
 * - 어느 단계에서든 throw/reject되면 전체 파이프라인이 reject된다
 * - `tap`과 함께 사용해 중간 단계를 관찰할 수 있다
 *
 * @example
 * // 인증 흐름: 동기 + 비동기 혼합
 * const user = await pipeAsync(
 *   rawInput,
 *   sanitize,              // 동기
 *   validateCredentials,   // async: DB 조회
 *   tap(u => logger.info("login", { id: u.id })), // 동기 (side-effect)
 *   enrichWithPermissions, // async: 권한 조회
 * );
 *
 * // 데이터 변환 파이프라인
 * const report = await pipeAsync(
 *   startDate,
 *   fetchRawData,    // async
 *   normalize,       // 동기
 *   aggregateByDay,  // 동기
 *   generatePDF,     // async
 * );
 *
 * @complexity Time: O(n) — n은 단계 수 | Space: O(1)
 */

type MaybePromise<T> = T | Promise<T>;

export function pipeAsync<A>(value: MaybePromise<A>): Promise<A>;
export function pipeAsync<A, B>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>
): Promise<B>;
export function pipeAsync<A, B, C>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>
): Promise<C>;
export function pipeAsync<A, B, C, D>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>
): Promise<D>;
export function pipeAsync<A, B, C, D, E>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>,
  fn4: (d: D) => MaybePromise<E>
): Promise<E>;
export function pipeAsync<A, B, C, D, E, F>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>,
  fn4: (d: D) => MaybePromise<E>,
  fn5: (e: E) => MaybePromise<F>
): Promise<F>;
export function pipeAsync<A, B, C, D, E, F, G>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>,
  fn4: (d: D) => MaybePromise<E>,
  fn5: (e: E) => MaybePromise<F>,
  fn6: (f: F) => MaybePromise<G>
): Promise<G>;
export function pipeAsync<A, B, C, D, E, F, G, H>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>,
  fn4: (d: D) => MaybePromise<E>,
  fn5: (e: E) => MaybePromise<F>,
  fn6: (f: F) => MaybePromise<G>,
  fn7: (g: G) => MaybePromise<H>
): Promise<H>;
export function pipeAsync<A, B, C, D, E, F, G, H, I>(
  value: MaybePromise<A>,
  fn1: (a: A) => MaybePromise<B>,
  fn2: (b: B) => MaybePromise<C>,
  fn3: (c: C) => MaybePromise<D>,
  fn4: (d: D) => MaybePromise<E>,
  fn5: (e: E) => MaybePromise<F>,
  fn6: (f: F) => MaybePromise<G>,
  fn7: (g: G) => MaybePromise<H>,
  fn8: (h: H) => MaybePromise<I>
): Promise<I>;
export async function pipeAsync(
  value: unknown,
  ...fns: ((x: unknown) => MaybePromise<unknown>)[]
): Promise<unknown> {
  let acc = await value;
  for (const fn of fns) {
    acc = await fn(acc);
  }
  return acc;
}
