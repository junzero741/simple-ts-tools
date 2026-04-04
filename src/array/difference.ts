/**
 * 첫 번째 배열에는 있지만 두 번째 배열에는 없는 요소를 반환한다 (차집합).
 * keyFn을 제공하면 반환값 기준으로 비교한다.
 * 결과는 첫 번째 배열의 순서를 따르며 중복은 제거된다.
 *
 * @example difference([1, 2, 3], [2, 3])                // [1]
 * @example difference(prevIds, nextIds)                  // 삭제된 ID 목록
 * @example difference(allUsers, activeUsers, u => u.id) // 비활성 유저
 * @complexity Time: O(n + m) | Space: O(m) — n, m은 각 배열 길이
 */
export function difference<T>(
  a: T[],
  b: T[],
  keyFn?: (item: T) => unknown
): T[] {
  const setB = new Set(keyFn ? b.map(keyFn) : b);
  const seen = new Set<unknown>();
  const result: T[] = [];

  for (const item of a) {
    const key = keyFn ? keyFn(item) : item;
    if (!setB.has(key) && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
