/**
 * 배열을 키 추출 함수 기준으로 Record로 변환한다.
 * 동일한 키가 여러 개면 마지막 항목이 남는다.
 *
 * groupBy와의 차이: groupBy는 같은 키의 값을 배열로 모으지만,
 * keyBy는 키 하나에 값 하나를 대응시켜 O(1) 조회에 최적화된다.
 *
 * @example
 * keyBy([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], u => u.id)
 * // { 1: { id: 1, name: 'Alice' }, 2: { id: 2, name: 'Bob' } }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function keyBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of arr) {
    result[keyFn(item)] = item;
  }
  return result;
}
