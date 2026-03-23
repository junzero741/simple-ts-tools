/**
 * 인자들을 튜플 타입으로 추론한다.
 * TypeScript가 배열 대신 튜플로 타입을 좁혀준다.
 * @example tuple(1, 'hello', true) // [number, string, boolean]
 * @complexity Time: O(1) | Space: O(n)
 */
export function tuple<T extends unknown[]>(...args: T): T {
  return args;
}
