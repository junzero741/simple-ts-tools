/**
 * 값을 재귀적으로 깊게 복사한다.
 * 원시값은 그대로 반환하고, 객체/배열/Date/Map/Set은 새 인스턴스를 생성한다.
 * 함수와 심볼은 참조를 그대로 유지한다.
 * 순환 참조는 지원하지 않는다.
 *
 * @example
 * const original = { a: [1, 2], b: new Date() };
 * const clone = deepClone(original);
 * clone.a.push(3); // original.a는 변하지 않음
 *
 * @complexity Time: O(n) — n은 전체 노드 수 | Space: O(n)
 */
export function deepClone<T>(value: T): T {
  // 원시값, null, 함수, 심볼
  if (value === null || typeof value !== "object" && typeof value !== "function") {
    return value;
  }

  // 함수 — 참조 유지
  if (typeof value === "function") {
    return value;
  }

  // Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  // RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Map
  if (value instanceof Map) {
    const clone = new Map();
    for (const [k, v] of value) {
      clone.set(deepClone(k), deepClone(v));
    }
    return clone as unknown as T;
  }

  // Set
  if (value instanceof Set) {
    const clone = new Set();
    for (const v of value) {
      clone.add(deepClone(v));
    }
    return clone as unknown as T;
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(deepClone) as unknown as T;
  }

  // 일반 객체
  const clone = Object.create(Object.getPrototypeOf(value)) as Record<string, unknown>;
  for (const key of Object.keys(value as object)) {
    clone[key] = deepClone((value as Record<string, unknown>)[key]);
  }
  return clone as T;
}
