// 객체 변환 유틸 (Object Transform).
//
// 객체의 키/값을 일괄 변환하는 유틸 모음.
// renameKeys, selectKeys, groupEntries, zipObject,
// objectFromEntries, swapKeysValues 등.
//
// renameKeys({ user_name: "Alice" }, { user_name: "userName" })
// → { userName: "Alice" }
//
// zipObject(["a", "b"], [1, 2]) → { a: 1, b: 2 }

/**
 * 키 이름을 변경한다. 매핑에 없는 키는 그대로 유지.
 */
export function renameKeys<T extends Record<string, unknown>>(
  obj: T,
  mapping: Record<string, string>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[mapping[key] ?? key] = value;
  }
  return result;
}

/**
 * 지정된 키만 선택한다 (pick과 유사하지만 기본값 지원).
 */
export function selectKeys<T extends Record<string, unknown>>(
  obj: T,
  keys: string[],
  defaults?: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = key in obj ? obj[key] : defaults?.[key];
  }
  return result;
}

/**
 * 키 배열과 값 배열을 합쳐 객체를 만든다. _.zipObject.
 */
export function zipObject<K extends string, V>(
  keys: K[],
  values: V[],
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = values[i];
  }
  return result;
}

/**
 * 객체 배열을 특정 키의 값으로 인덱싱한다.
 * indexBy([{id:1,n:"a"},{id:2,n:"b"}], "id") → { 1: {id:1,n:"a"}, 2: {id:2,n:"b"} }
 */
export function indexBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T & string,
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const item of items) {
    result[String(item[key])] = item;
  }
  return result;
}

/**
 * 객체의 모든 값에 함수를 적용한다 (깊은 변환).
 */
export function mapValuesDeep(
  obj: unknown,
  fn: (value: unknown, key: string, path: string[]) => unknown,
  path: string[] = [],
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item, i) => mapValuesDeep(item, fn, [...path, String(i)]));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newPath = [...path, key];
      if (typeof value === "object" && value !== null) {
        result[key] = mapValuesDeep(value, fn, newPath);
      } else {
        result[key] = fn(value, key, newPath);
      }
    }
    return result;
  }
  return fn(obj, path[path.length - 1] ?? "", path);
}

/**
 * 두 객체의 같은 키에 대해 함수를 적용한다.
 * mergeWith({a:1,b:2}, {a:10,b:20}, (v1,v2) => v1+v2) → {a:11,b:22}
 */
export function mergeWith<T extends Record<string, unknown>>(
  a: T,
  b: T,
  fn: (aVal: unknown, bVal: unknown, key: string) => unknown,
): Record<string, unknown> {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const result: Record<string, unknown> = {};
  for (const key of allKeys) {
    if (key in a && key in b) {
      result[key] = fn(a[key], b[key], key);
    } else if (key in a) {
      result[key] = a[key];
    } else {
      result[key] = b[key];
    }
  }
  return result;
}

/**
 * camelCase 키를 snake_case로 변환한다.
 */
export function keysToSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

/**
 * snake_case 키를 camelCase로 변환한다.
 */
export function keysToCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * 객체에서 값이 조건을 만족하는 항목의 수를 반환한다.
 */
export function countValues<T extends Record<string, unknown>>(
  obj: T,
  predicate: (value: unknown, key: string) => boolean,
): number {
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (predicate(value, key)) count++;
  }
  return count;
}
