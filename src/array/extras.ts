/**
 * 배열의 첫 번째 요소를 반환한다. 빈 배열이면 `undefined`.
 * @example first([1, 2, 3])  // 1
 * @example first([])         // undefined
 */
export function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

/**
 * 배열의 마지막 요소를 반환한다. 빈 배열이면 `undefined`.
 * `arr[arr.length - 1]` 보다 안전하고 표현력이 높다.
 * @example last([1, 2, 3])  // 3
 * @example last([])         // undefined
 */
export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

/**
 * 요소를 from 인덱스에서 to 인덱스로 이동한 새 배열을 반환한다 (비파괴).
 * drag-and-drop 순서 변경, 우선순위 조정에 유용하다.
 *
 * - 인덱스가 배열 범위를 벗어나면 0 또는 arr.length-1로 clamp된다.
 * - from === to이면 원본과 동일한 복사본을 반환한다.
 *
 * @example
 * move([1, 2, 3, 4], 0, 2)  // [2, 3, 1, 4]
 * move([1, 2, 3, 4], 3, 0)  // [4, 1, 2, 3]
 */
export function move<T>(arr: T[], from: number, to: number): T[] {
  if (arr.length === 0) return [];
  const clamp = (n: number) => Math.max(0, Math.min(arr.length - 1, n));
  const f = clamp(from);
  const t = clamp(to);
  const result = [...arr];
  const [item] = result.splice(f, 1);
  result.splice(t, 0, item);
  return result;
}

/**
 * 요소가 배열에 있으면 제거하고, 없으면 추가한 새 배열을 반환한다 (비파괴).
 * 체크박스·태그·멀티셀렉트 UI에서 선택 상태를 토글할 때 유용하다.
 *
 * @param keyFn 동등 비교 키 함수 (기본: ===). 객체 배열에서 id 기준 토글 등에 사용.
 *
 * @example
 * toggle([1, 2, 3], 2)         // [1, 3]   (제거)
 * toggle([1, 3], 2)            // [1, 3, 2] (추가)
 * toggle(selected, item, i => i.id)  // id 기준 토글
 */
export function toggle<T>(
  arr: T[],
  item: T,
  keyFn: (item: T) => unknown = (x) => x
): T[] {
  const key = keyFn(item);
  const idx = arr.findIndex((x) => keyFn(x) === key);
  if (idx === -1) return [...arr, item];
  return [...arr.slice(0, idx), ...arr.slice(idx + 1)];
}
