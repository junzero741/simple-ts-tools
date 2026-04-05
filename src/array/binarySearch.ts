/**
 * 정렬된 배열에서 이진 탐색으로 값을 찾는다.
 *
 * - 배열은 compareFn 기준으로 **오름차순 정렬**되어 있어야 한다.
 * - compareFn 미지정 시 숫자/문자열의 자연 순서를 사용한다.
 * - 중복 값이 있을 경우 그 중 **하나**의 인덱스를 반환한다 (어느 것인지 보장 없음).
 * - 값이 없으면 `-1`을 반환한다.
 *
 * @example
 * binarySearch([1, 3, 5, 7, 9], 5)   // 2
 * binarySearch([1, 3, 5, 7, 9], 4)   // -1
 * binarySearch(["a", "b", "c"], "b") // 1
 *
 * // 커스텀 비교 함수 (객체 배열)
 * const users = [{ age: 20 }, { age: 25 }, { age: 30 }];
 * binarySearch(users, { age: 25 }, (a, b) => a.age - b.age); // 1
 *
 * @complexity Time: O(log n) | Space: O(1)
 */
export function binarySearch<T>(
  arr: readonly T[],
  value: T,
  compareFn?: (a: T, b: T) => number
): number {
  const compare = compareFn ?? defaultCompare;
  let lo = 0;
  let hi = arr.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = compare(arr[mid], value);
    if (cmp === 0) return mid;
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }

  return -1;
}

/**
 * 정렬된 배열에서 값을 삽입해도 정렬이 유지되는 **가장 왼쪽** 인덱스를 반환한다.
 * (lower bound — 동일한 값이 여러 개면 첫 번째 위치)
 *
 * - 값이 이미 배열에 있으면 그 값의 인덱스를 반환한다.
 * - 값이 모든 원소보다 크면 `arr.length`를 반환한다.
 *
 * @example
 * sortedIndex([1, 3, 5, 7], 4)  // 2  → [1, 3, _4_, 5, 7]
 * sortedIndex([1, 3, 5, 7], 3)  // 1  → 기존 3의 위치 (left boundary)
 * sortedIndex([1, 3, 5, 7], 0)  // 0  → 맨 앞에 삽입
 * sortedIndex([1, 3, 5, 7], 9)  // 4  → 맨 뒤에 삽입
 *
 * // 정렬된 배열에 O(log n) 탐색 + O(n) 삽입
 * const sorted = [...arr];
 * sorted.splice(sortedIndex(sorted, newVal), 0, newVal);
 *
 * // 커스텀 비교 함수
 * const items = [{ v: 1 }, { v: 3 }, { v: 5 }];
 * sortedIndex(items, { v: 2 }, (a, b) => a.v - b.v); // 1
 *
 * @complexity Time: O(log n) | Space: O(1)
 */
export function sortedIndex<T>(
  arr: readonly T[],
  value: T,
  compareFn?: (a: T, b: T) => number
): number {
  const compare = compareFn ?? defaultCompare;
  let lo = 0;
  let hi = arr.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(arr[mid], value) < 0) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}

/**
 * 정렬된 배열에서 값을 삽입해도 정렬이 유지되는 **가장 오른쪽** 인덱스를 반환한다.
 * (upper bound — 동일한 값이 여러 개면 마지막 값 **다음** 위치)
 *
 * @example
 * sortedLastIndex([1, 3, 3, 3, 5], 3)  // 4  → 마지막 3 다음
 * sortedLastIndex([1, 3, 5, 7], 4)     // 2
 * sortedLastIndex([1, 3, 5, 7], 3)     // 2  → 3 바로 다음
 *
 * // 중복 값의 범위를 구할 때 유용
 * const lo = sortedIndex(arr, 3);      // 첫 3의 인덱스
 * const hi = sortedLastIndex(arr, 3);  // 마지막 3 다음 인덱스
 * const threes = arr.slice(lo, hi);
 *
 * @complexity Time: O(log n) | Space: O(1)
 */
export function sortedLastIndex<T>(
  arr: readonly T[],
  value: T,
  compareFn?: (a: T, b: T) => number
): number {
  const compare = compareFn ?? defaultCompare;
  let lo = 0;
  let hi = arr.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (compare(arr[mid], value) <= 0) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}

function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
