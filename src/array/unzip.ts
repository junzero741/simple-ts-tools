/**
 * 튜플 배열을 개별 배열들로 분리한다 (zip의 역연산).
 * 가장 긴 튜플을 기준으로 하며 짧은 튜플의 빈 자리는 undefined가 된다.
 *
 * @example
 * unzip([[1, "a", true], [2, "b", false]])
 * // [[1, 2], ["a", "b"], [true, false]]
 *
 * // 매트릭스 전치 (transpose)
 * unzip([[1, 2, 3], [4, 5, 6]])
 * // [[1, 4], [2, 5], [3, 6]]
 *
 * // Object.entries 분리
 * const pairs = Object.entries({ a: 1, b: 2, c: 3 });
 * const [keys, values] = unzip(pairs);
 * keys;   // ["a", "b", "c"]
 * values; // [1, 2, 3]
 *
 * @complexity Time: O(n * k) | Space: O(n * k)
 */
export function unzip<T extends readonly unknown[]>(
  pairs: T[]
): { [K in keyof T]: T[K][] } {
  if (pairs.length === 0) return [] as unknown as { [K in keyof T]: T[K][] };

  const maxLen = Math.max(...pairs.map((p) => p.length));
  const result: unknown[][] = Array.from({ length: maxLen }, () => []);

  for (const tuple of pairs) {
    for (let i = 0; i < maxLen; i++) {
      result[i].push(tuple[i]);
    }
  }

  return result as { [K in keyof T]: T[K][] };
}

/**
 * 두 배열을 인덱스 기준으로 결합 함수에 적용하고 결과 배열을 반환한다.
 * `zip` 후 `.map()`을 한 번에 처리하는 축약형.
 * 가장 짧은 배열 길이에 맞춘다.
 *
 * @example
 * zipWith([1, 2, 3], [4, 5, 6], (a, b) => a + b)
 * // [5, 7, 9]
 *
 * // 두 날짜 배열의 차이 (일) 계산
 * zipWith(startDates, endDates, (s, e) => diffDays(s, e))
 *
 * // 벡터 내적
 * const dot = (v1: number[], v2: number[]) =>
 *   zipWith(v1, v2, (a, b) => a * b).reduce((s, n) => s + n, 0);
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function zipWith<A, B, R>(
  a: A[],
  b: B[],
  fn: (a: A, b: B) => R
): R[];
export function zipWith<A, B, C, R>(
  a: A[],
  b: B[],
  c: C[],
  fn: (a: A, b: B, c: C) => R
): R[];
export function zipWith(
  ...args: unknown[]
): unknown[] {
  const fn = args[args.length - 1] as (...items: unknown[]) => unknown;
  const arrays = args.slice(0, -1) as unknown[][];
  if (arrays.length === 0) return [];

  const minLen = Math.min(...arrays.map((a) => a.length));
  const result: unknown[] = [];
  for (let i = 0; i < minLen; i++) {
    result.push(fn(...arrays.map((a) => a[i])));
  }
  return result;
}
