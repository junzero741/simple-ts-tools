/**
 * 점(.) 구분자 경로로 중첩 객체의 값을 읽고 쓰는 유틸리티.
 *
 * 배열 인덱스도 지원한다: "items.0.name"
 */

type Primitive = string | number | boolean | null | undefined;
type NestedValue = Primitive | NestedObject | NestedValue[];
interface NestedObject { [key: string]: NestedValue }

/**
 * 점 구분자 경로로 중첩 객체의 값을 읽는다.
 * 경로가 존재하지 않으면 `undefined`를 반환한다.
 *
 * @example
 * getIn({ user: { address: { city: "Seoul" } } }, "user.address.city")
 * // "Seoul"
 *
 * getIn({ items: [{ name: "A" }, { name: "B" }] }, "items.1.name")
 * // "B"
 *
 * getIn({ a: 1 }, "a.b.c")
 * // undefined
 */
export function getIn(obj: unknown, path: string): unknown {
  if (obj == null) return undefined;
  if (path === "") return obj;
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * 점 구분자 경로에 값을 설정한 새 객체를 반환한다 (불변 — 원본 수정 없음).
 * 중간 경로가 없으면 빈 객체를 생성한다.
 *
 * @example
 * setIn({ user: { name: "Alice" } }, "user.age", 30)
 * // { user: { name: "Alice", age: 30 } }
 *
 * setIn({}, "a.b.c", 1)
 * // { a: { b: { c: 1 } } }
 */
export function setIn<T extends object>(obj: T, path: string, value: unknown): T {
  if (path === "") return obj;
  const parts = path.split(".");
  return setRecursive(obj, parts, value) as T;
}

function setRecursive(current: unknown, parts: string[], value: unknown): unknown {
  const [head, ...rest] = parts;
  const isArrayIndex = /^\d+$/.test(head);

  if (rest.length === 0) {
    if (isArrayIndex) {
      const arr = Array.isArray(current) ? [...current] : [];
      arr[Number(head)] = value;
      return arr;
    }
    return { ...(isObject(current) ? current : {}), [head]: value };
  }

  if (isArrayIndex) {
    const arr = Array.isArray(current) ? [...current] : [];
    arr[Number(head)] = setRecursive(arr[Number(head)], rest, value);
    return arr;
  }

  const existing = isObject(current) ? (current as Record<string, unknown>)[head] : undefined;
  return {
    ...(isObject(current) ? current : {}),
    [head]: setRecursive(existing, rest, value),
  };
}

/**
 * 점 구분자 경로가 중첩 객체에 존재하는지 확인한다.
 * 값이 `undefined`여도 키가 존재하면 `true`를 반환한다.
 *
 * @example
 * hasIn({ user: { name: "Alice" } }, "user.name") // true
 * hasIn({ user: { name: "Alice" } }, "user.age")  // false
 * hasIn({ a: undefined }, "a")                    // true  — 키는 존재함
 */
export function hasIn(obj: unknown, path: string): boolean {
  if (obj == null || path === "") return false;
  const parts = path.split(".");
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null || typeof current !== "object") return false;
    current = (current as Record<string, unknown>)[parts[i]];
  }
  if (current == null || typeof current !== "object") return false;
  return Object.prototype.hasOwnProperty.call(current, parts[parts.length - 1]);
}

function isObject(value: unknown): boolean {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
