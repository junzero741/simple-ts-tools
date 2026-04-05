/**
 * 배열을 predicate 기준으로 두 배열로 분리한다.
 * 첫 번째 배열은 통과한 요소, 두 번째는 통과하지 못한 요소.
 *
 * TypeScript 타입 가드를 predicate로 전달하면 반환 타입이 자동으로 좁혀진다.
 *
 * @example
 * partition([1, 2, 3, 4, 5], n => n % 2 === 0)  // [[2, 4], [1, 3, 5]]
 * partition(users, u => u.isActive)              // [activeUsers, inactiveUsers]
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function partition<T, U extends T>(
  arr: T[],
  predicate: (item: T) => item is U
): [U[], Exclude<T, U>[]];
export function partition<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]];
export function partition<T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}
