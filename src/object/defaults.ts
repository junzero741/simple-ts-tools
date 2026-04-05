/**
 * target 객체에서 `undefined`인 속성을 sources에서 채워 새 객체를 반환한다.
 *
 * deepMerge와의 차이:
 * - deepMerge: source 값이 target을 덮어씀 (source 우선)
 * - defaults:  target의 기존 값(null 포함)은 유지, undefined만 채움 (target 우선)
 *
 * 얕은 병합(shallow)만 수행한다. 복수의 source를 왼쪽부터 순서대로 적용한다.
 * 원본 객체를 변경하지 않는다.
 *
 * @example
 * defaults({ a: 1, b: undefined }, { a: 99, b: 2, c: 3 })
 * // { a: 1, b: 2, c: 3 }
 * // a: target 값 유지(undefined가 아님), b: source에서 채움, c: source에서 추가
 *
 * // null은 "명시적으로 없음"이므로 덮어쓰지 않는다
 * defaults({ a: null }, { a: 42 })
 * // { a: null }
 *
 * // 여러 source — 왼쪽부터 적용 (먼저 나오는 source가 우선)
 * defaults({ a: undefined }, { a: 1 }, { a: 2 })
 * // { a: 1 }
 *
 * @complexity Time: O(n * m) n=소스 수, m=키 수 | Space: O(n)
 */
export function defaults<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  const result = { ...target } as Record<string, unknown>;

  for (const source of sources) {
    for (const key of Object.keys(source) as (keyof T)[]) {
      if (result[key as string] === undefined) {
        result[key as string] = (source as Record<string, unknown>)[key as string];
      }
    }
  }

  return result as T;
}
