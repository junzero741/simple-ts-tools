/**
 * 배열을 무작위로 섞은 새 배열을 반환한다 (Fisher-Yates 알고리즘).
 * 원본 배열은 변경하지 않는다.
 *
 * @example shuffle([1, 2, 3, 4, 5])  // [3, 1, 5, 2, 4] (무작위)
 * @complexity Time: O(n) | Space: O(n)
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 배열에서 무작위로 하나의 요소를 반환한다.
 * 빈 배열이면 undefined를 반환한다.
 *
 * @example sample([1, 2, 3, 4, 5])  // 1~5 중 하나
 * @complexity Time: O(1) | Space: O(1)
 */
export function sample<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 배열에서 무작위로 n개의 요소를 중복 없이 반환한다.
 * n이 배열 길이보다 크면 전체를 섞어 반환한다.
 *
 * @example sampleSize([1, 2, 3, 4, 5], 3)  // [3, 1, 4] (무작위 3개)
 * @complexity Time: O(n) | Space: O(n)
 */
export function sampleSize<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.max(0, n));
}
