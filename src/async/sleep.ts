/**
 * 지정한 시간(ms)만큼 대기한다.
 * @example await sleep(300); // 300ms 후 재개
 * @complexity Time: O(1) | Space: O(1)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
