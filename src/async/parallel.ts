/**
 * 서로 다른 비동기 함수들을 동시에 실행하고 결과를 튜플로 반환한다.
 *
 * mapAsync가 "하나의 함수를 N개의 항목에 적용"한다면,
 * parallel은 "N개의 서로 다른 함수를 동시에 실행"한다.
 *
 * concurrency를 지정하면 동시에 실행되는 함수 수를 제한한다.
 * 지정하지 않으면 모두 동시에 실행된다 (Promise.all과 동일).
 *
 * @example
 * // 세 API를 동시에 호출하고 타입 안전하게 결과를 받는다
 * const [user, posts, config] = await parallel([
 *   () => fetchUser(id),
 *   () => fetchPosts(id),
 *   () => fetchAppConfig(),
 * ]);
 *
 * // concurrency: 2 — 동시에 최대 2개만 실행
 * const [a, b, c] = await parallel(
 *   [() => slowApi1(), () => slowApi2(), () => slowApi3()],
 *   { concurrency: 2 }
 * );
 */

export type AsyncFn<T> = () => Promise<T>;

// 타입 추론 오버로드 (최대 8개까지 타입 추론)
export function parallel<A>(fns: [AsyncFn<A>], options?: { concurrency?: number }): Promise<[A]>;
export function parallel<A, B>(fns: [AsyncFn<A>, AsyncFn<B>], options?: { concurrency?: number }): Promise<[A, B]>;
export function parallel<A, B, C>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>], options?: { concurrency?: number }): Promise<[A, B, C]>;
export function parallel<A, B, C, D>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>, AsyncFn<D>], options?: { concurrency?: number }): Promise<[A, B, C, D]>;
export function parallel<A, B, C, D, E>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>, AsyncFn<D>, AsyncFn<E>], options?: { concurrency?: number }): Promise<[A, B, C, D, E]>;
export function parallel<A, B, C, D, E, F>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>, AsyncFn<D>, AsyncFn<E>, AsyncFn<F>], options?: { concurrency?: number }): Promise<[A, B, C, D, E, F]>;
export function parallel<A, B, C, D, E, F, G>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>, AsyncFn<D>, AsyncFn<E>, AsyncFn<F>, AsyncFn<G>], options?: { concurrency?: number }): Promise<[A, B, C, D, E, F, G]>;
export function parallel<A, B, C, D, E, F, G, H>(fns: [AsyncFn<A>, AsyncFn<B>, AsyncFn<C>, AsyncFn<D>, AsyncFn<E>, AsyncFn<F>, AsyncFn<G>, AsyncFn<H>], options?: { concurrency?: number }): Promise<[A, B, C, D, E, F, G, H]>;
export function parallel<T>(fns: AsyncFn<T>[], options?: { concurrency?: number }): Promise<T[]>;
export async function parallel(
  fns: (() => Promise<unknown>)[],
  options: { concurrency?: number } = {}
): Promise<unknown[]> {
  if (fns.length === 0) return [];

  const concurrency = options.concurrency ?? fns.length;
  if (concurrency <= 0) throw new Error("concurrency must be > 0");

  // concurrency가 없거나 함수 수보다 크면 모두 동시에 실행
  if (concurrency >= fns.length) {
    return Promise.all(fns.map(fn => fn()));
  }

  // concurrency 제한: worker 풀로 순서 보장하며 처리
  const results = new Array<unknown>(fns.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < fns.length) {
      const current = index++;
      results[current] = await fns[current]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
