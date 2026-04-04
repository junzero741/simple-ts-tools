/**
 * 두 값을 재귀적으로 깊게 비교한다.
 * 원시값은 ===, 객체/배열은 구조와 값, Date/RegExp/Map/Set은 의미적으로 비교한다.
 *
 * @example deepEqual({ a: [1, 2] }, { a: [1, 2] }) // true
 * @example deepEqual(new Date("2024-01-01"), new Date("2024-01-01")) // true
 * @example deepEqual([1, 2, 3], [1, 2])  // false
 * @complexity Time: O(n) — n은 전체 노드 수 | Space: O(d) — d는 최대 깊이
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // 1. 같은 참조 또는 원시값 동등
  if (a === b) return true;

  // 2. null / undefined
  if (a == null || b == null) return a === b;

  // 3. 타입이 다르면 false
  if (typeof a !== typeof b) return false;

  // 4. Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // 5. RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.source === b.source && a.flags === b.flags;
  }

  // 6. Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
      if (!b.has(key) || !deepEqual(val, b.get(key))) return false;
    }
    return true;
  }

  // 7. Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const val of a) {
      if (!b.has(val)) return false;
    }
    return true;
  }

  // 8. Array — 한쪽만 배열이면 false
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // 9. 일반 객체
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (
        !Object.prototype.hasOwnProperty.call(b, key) ||
        !deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}
