/**
 * 배열의 각 요소에 비동기 함수를 적용하고 결과 배열을 반환한다.
 * `concurrency` 옵션으로 동시에 실행할 최대 Promise 수를 제한한다.
 *
 * concurrency를 지정하지 않으면 Promise.all과 동일하게 동작한다.
 * 외부 API 호출 시 rate limit을 맞추거나, DB 커넥션 수를 제한할 때 유용하다.
 *
 * @param arr         처리할 배열
 * @param fn          각 요소에 적용할 비동기 함수 (value, index 전달)
 * @param concurrency 동시 실행 최대 수 (기본: 배열 길이, 즉 제한 없음)
 *
 * @example
 * // 3개씩 병렬 처리
 * const results = await mapAsync(userIds, id => fetchUser(id), { concurrency: 3 });
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export async function mapAsync<T, R>(
  arr: T[],
  fn: (value: T, index: number) => Promise<R>,
  options: { concurrency?: number } = {}
): Promise<R[]> {
  if (options.concurrency !== undefined && options.concurrency <= 0) {
    throw new Error("concurrency must be > 0");
  }
  if (arr.length === 0) return [];

  const concurrency = options.concurrency ?? arr.length;
  const results = new Array<R>(arr.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < arr.length) {
      const current = index++;
      results[current] = await fn(arr[current], current);
    }
  }

  const workerCount = Math.min(concurrency, arr.length);

  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
