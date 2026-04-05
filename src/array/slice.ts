/**
 * 배열의 앞에서 n개를 반환한다. n이 배열 길이보다 크면 전체를 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * take([1, 2, 3, 4, 5], 3)  // [1, 2, 3]
 * take([1, 2], 10)           // [1, 2]
 * take([], 3)                // []
 */
export function take<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [];
  return arr.slice(0, n);
}

/**
 * 배열의 앞에서 n개를 제거한 나머지를 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * drop([1, 2, 3, 4, 5], 2)  // [3, 4, 5]
 * drop([1, 2], 10)           // []
 * drop([1, 2, 3], 0)         // [1, 2, 3]
 */
export function drop<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [...arr];
  return arr.slice(n);
}

/**
 * predicate가 true인 동안 앞에서부터 요소를 수집한다.
 * 처음으로 false가 된 시점부터 수집을 멈춘다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * takeWhile([1, 2, 3, 4, 1], x => x < 3)  // [1, 2]
 * takeWhile([5, 6, 7], x => x < 3)         // []
 */
export function takeWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  const result: T[] = [];
  for (const item of arr) {
    if (!predicate(item)) break;
    result.push(item);
  }
  return result;
}

/**
 * predicate가 true인 동안 앞에서부터 요소를 건너뛴다.
 * 처음으로 false가 된 시점부터 나머지를 모두 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * dropWhile([1, 2, 3, 4, 1], x => x < 3)  // [3, 4, 1]
 * dropWhile([5, 6, 7], x => x > 0)         // []
 */
export function dropWhile<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  let i = 0;
  while (i < arr.length && predicate(arr[i])) i++;
  return arr.slice(i);
}

/**
 * 배열의 뒤에서 n개를 반환한다. n이 배열 길이보다 크면 전체를 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * takeLast([1, 2, 3, 4, 5], 2)  // [4, 5]
 * takeLast([1, 2], 10)           // [1, 2]
 */
export function takeLast<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [];
  return arr.slice(-n);
}

/**
 * 배열의 뒤에서 n개를 제거한 나머지를 반환한다.
 * 원본 배열을 변경하지 않는다.
 *
 * @example
 * dropLast([1, 2, 3, 4, 5], 2)  // [1, 2, 3]
 * dropLast([1, 2], 10)           // []
 */
export function dropLast<T>(arr: T[], n: number): T[] {
  if (n <= 0) return [...arr];
  return arr.slice(0, -n);
}
