/**
 * 배열을 왼쪽(양수) 또는 오른쪽(음수)으로 n 위치만큼 회전한 새 배열을 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * rotate([1,2,3,4,5], 2)  → [3,4,5,1,2]  (왼쪽으로 2칸)
 * rotate([1,2,3,4,5], -1) → [5,1,2,3,4]  (오른쪽으로 1칸)
 *
 * n이 배열 길이의 배수이면 원본과 동일한 배열을 반환한다.
 * 빈 배열이면 빈 배열을 반환한다.
 *
 * @example
 * rotate([1, 2, 3, 4, 5], 2)   // [3, 4, 5, 1, 2]
 * rotate([1, 2, 3, 4, 5], -1)  // [5, 1, 2, 3, 4]
 * rotate([1, 2, 3, 4, 5], 7)   // [3, 4, 5, 1, 2]  — 7 % 5 = 2
 *
 * // 라운드로빈 — 다음 담당자 배정
 * rotate(workers, currentIndex + 1)[0]
 *
 * // 캐러셀 — 첫 슬라이드를 끝으로 이동
 * rotate(slides, 1)
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function rotate<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return [];

  const len = arr.length;
  // 음수 처리 및 배열 길이 이상의 n 정규화
  const shift = ((n % len) + len) % len;

  if (shift === 0) return [...arr];
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}
