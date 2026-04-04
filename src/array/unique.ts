/**
 * 배열에서 중복을 제거한 새 배열을 반환한다. 순서는 첫 등장 순서를 유지한다.
 * keyFn을 제공하면 반환값 기준으로 중복을 판단한다 (객체 배열에 유용).
 *
 * @example unique([1, 2, 2, 3, 1])                      // [1, 2, 3]
 * @example unique(users, u => u.id)                      // id 기준 중복 제거
 * @example unique(tags, t => t.toLowerCase())            // 대소문자 무시 중복 제거
 * @complexity Time: O(n) | Space: O(n)
 */
export function unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  const result: T[] = [];
  for (const item of arr) {
    const key = keyFn ? keyFn(item) : item;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
