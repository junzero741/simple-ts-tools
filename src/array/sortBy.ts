/**
 * keyFn의 반환값 기준으로 오름차순 정렬된 새 배열을 반환한다.
 * 원본 배열은 변경하지 않으며, 동일한 키값이면 원래 순서를 유지한다 (stable sort).
 * 내림차순이 필요하면 keyFn에서 숫자를 음수로 반환하거나 order: "desc"를 사용한다.
 *
 * @example sortBy(users, u => u.name)          // 이름 오름차순
 * @example sortBy(items, i => -i.price)         // 가격 내림차순
 * @example sortBy(users, u => u.name, "desc")   // 이름 내림차순
 * @complexity Time: O(n log n) | Space: O(n)
 */
export function sortBy<T>(
  arr: T[],
  keyFn: (item: T) => string | number | bigint,
  order: "asc" | "desc" = "asc"
): T[] {
  const factor = order === "asc" ? 1 : -1;
  return [...arr].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) return -factor;
    if (ka > kb) return factor;
    return 0;
  });
}
