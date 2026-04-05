/**
 * 배열에서 keyFn 값이 가장 작은 요소를 반환한다.
 * 빈 배열이면 undefined를 반환한다.
 *
 * @example
 * minBy([{ price: 30 }, { price: 10 }, { price: 20 }], item => item.price)
 * // { price: 10 }
 *
 * @complexity Time: O(n) | Space: O(1)
 */
export function minBy<T>(
  arr: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (arr.length === 0) return undefined;
  let minItem = arr[0];
  let minVal = keyFn(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    const val = keyFn(arr[i]);
    if (val < minVal) {
      minVal = val;
      minItem = arr[i];
    }
  }
  return minItem;
}

/**
 * 배열에서 keyFn 값이 가장 큰 요소를 반환한다.
 * 빈 배열이면 undefined를 반환한다.
 *
 * @example
 * maxBy([{ score: 70 }, { score: 95 }, { score: 85 }], item => item.score)
 * // { score: 95 }
 *
 * @complexity Time: O(n) | Space: O(1)
 */
export function maxBy<T>(
  arr: T[],
  keyFn: (item: T) => number
): T | undefined {
  if (arr.length === 0) return undefined;
  let maxItem = arr[0];
  let maxVal = keyFn(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    const val = keyFn(arr[i]);
    if (val > maxVal) {
      maxVal = val;
      maxItem = arr[i];
    }
  }
  return maxItem;
}
