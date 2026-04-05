/**
 * 중첩 객체를 점(.) 구분자의 평탄한 키-값 쌍으로 변환한다.
 *
 * - 배열은 인덱스를 키로 사용한다: `items.0`, `items.1`
 * - null/undefined 값은 그대로 유지된다
 * - 빈 객체/배열은 키를 생성하지 않는다
 *
 * @example
 * flattenObject({ a: { b: { c: 1 }, d: 2 } })
 * // { "a.b.c": 1, "a.d": 2 }
 *
 * flattenObject({ items: ["x", "y"] })
 * // { "items.0": "x", "items.1": "y" }
 */
export function flattenObject(
  obj: Record<string, unknown>,
  separator = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function traverse(current: unknown, prefix: string): void {
    if (isPlainObject(current)) {
      const keys = Object.keys(current as object);
      if (keys.length === 0 && prefix) {
        result[prefix] = current;
        return;
      }
      for (const key of keys) {
        traverse((current as Record<string, unknown>)[key], prefix ? `${prefix}${separator}${key}` : key);
      }
    } else if (Array.isArray(current)) {
      if (current.length === 0 && prefix) {
        result[prefix] = current;
        return;
      }
      for (let i = 0; i < current.length; i++) {
        traverse(current[i], prefix ? `${prefix}${separator}${i}` : String(i));
      }
    } else {
      result[prefix] = current;
    }
  }

  traverse(obj, "");
  return result;
}

/**
 * 점(.) 구분자로 평탄화된 객체를 중첩 구조로 복원한다.
 *
 * @example
 * unflattenObject({ "a.b.c": 1, "a.d": 2 })
 * // { a: { b: { c: 1 }, d: 2 } }
 *
 * unflattenObject({ "items.0": "x", "items.1": "y" })
 * // { items: ["x", "y"] }
 */
export function unflattenObject(
  obj: Record<string, unknown>,
  separator = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const flatKey of Object.keys(obj)) {
    const parts = flatKey.split(separator);
    let current: Record<string, unknown> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const nextIsIndex = /^\d+$/.test(nextPart);

      if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
        current[part] = nextIsIndex ? [] : {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = obj[flatKey];
  }

  return result;
}

function isPlainObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
