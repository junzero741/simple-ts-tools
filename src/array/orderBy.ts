type KeyFn<T> = (item: T) => string | number | bigint | boolean | null | undefined;
type Order = "asc" | "desc";

/**
 * 여러 키 기준으로 순서대로 정렬된 새 배열을 반환한다.
 * 첫 번째 키가 같으면 두 번째 키로, 두 번째도 같으면 세 번째 키로 비교한다.
 * 원본 배열은 변경하지 않으며 동일 키값이면 원래 순서를 유지한다 (stable sort).
 *
 * `sortBy`와의 차이: `sortBy`는 단일 키, `orderBy`는 여러 키를 우선순위 순서로 지정.
 *
 * @example
 * // 부서 오름차순 → 이름 오름차순
 * orderBy(employees, [e => e.dept, e => e.name])
 *
 * // 점수 내림차순 → 이름 오름차순 (동점자는 이름순)
 * orderBy(players, [p => p.score, p => p.name], ["desc", "asc"])
 *
 * // 상태 우선순위 정렬 (null/undefined는 맨 뒤)
 * orderBy(tasks, [t => t.priority, t => t.dueDate], ["asc", "asc"])
 *
 * @param arr 정렬할 배열
 * @param keys 키 추출 함수 배열 (앞쪽일수록 우선순위 높음)
 * @param orders 각 키의 정렬 방향. 미지정 시 모두 "asc"
 * @complexity Time: O(n log n) | Space: O(n)
 */
export function orderBy<T>(
  arr: T[],
  keys: KeyFn<T>[],
  orders?: Order[]
): T[] {
  if (keys.length === 0) return [...arr];

  return [...arr].sort((a, b) => {
    for (let i = 0; i < keys.length; i++) {
      const keyFn = keys[i];
      const order = orders?.[i] ?? "asc";
      const factor = order === "asc" ? 1 : -1;

      const ka = keyFn(a);
      const kb = keyFn(b);

      // null / undefined는 항상 맨 뒤 (방향 무관)
      if (ka == null && kb == null) continue;
      if (ka == null) return 1;
      if (kb == null) return -1;

      if (ka < kb) return -factor;
      if (ka > kb) return factor;
      // 같으면 다음 키로
    }
    return 0;
  });
}
