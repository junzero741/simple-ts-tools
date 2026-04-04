/**
 * 두 객체를 재귀적으로 병합해 새 객체를 반환한다.
 * - 배열은 병합하지 않고 source 값으로 덮어쓴다.
 * - null / Date / RegExp / Map / Set 등 non-plain 객체도 source 값으로 덮어쓴다.
 * - plain 객체끼리만 재귀적으로 병합한다.
 *
 * @example
 * deepMerge({ a: 1, b: { x: 1, y: 2 } }, { b: { y: 99, z: 3 }, c: 4 })
 * // { a: 1, b: { x: 1, y: 99, z: 3 }, c: 4 }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function deepMerge<T extends object, S extends object>(
  target: T,
  source: S
): T & S {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source) as (keyof S)[]) {
    const srcVal = source[key];
    const tgtVal = (target as Record<string, unknown>)[key as string];

    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      result[key as string] = deepMerge(
        tgtVal as object,
        srcVal as object
      );
    } else {
      result[key as string] = srcVal;
    }
  }

  return result as T & S;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
