/**
 * 객체의 모든 중첩 속성을 재귀적으로 동결(freeze)한다.
 * 반환 타입은 `DeepReadonly<T>`로, 컴파일 타임과 런타임 모두에서 불변성을 보장한다.
 *
 * - `Object.freeze()`의 얕은(shallow) 동결을 깊게(deep) 확장
 * - 원시 값(string, number, boolean 등)은 그대로 반환
 * - 배열, 중첩 객체 모두 재귀 동결
 * - 이미 동결된 객체는 그대로 반환 (중복 처리 방지)
 * - 순환 참조를 안전하게 처리
 *
 * @example
 * const config = deepFreeze({
 *   api: { url: "https://api.example.com", timeout: 5_000 },
 *   features: { darkMode: true },
 * });
 *
 * config.api.url = "x";       // TypeError: Cannot assign to read only property
 * config.api.timeout = 0;     // TypeError
 * // TypeScript: config.api.url의 타입은 string (readonly)
 *
 * @example
 * // 테스트 픽스처 — 테스트 간 데이터 오염 방지
 * const FIXTURE_USER = deepFreeze({ id: 1, name: "Alice", roles: ["admin"] });
 *
 * @example
 * // 상수 배열
 * const STATUSES = deepFreeze(["pending", "active", "inactive"] as const);
 *
 * @complexity Time: O(n) — n은 전체 프로퍼티 수 | Space: O(d) — d는 최대 깊이 (재귀 스택)
 */

// ─── DeepReadonly 유틸리티 타입 ────────────────────────────────────────────────

export type DeepReadonly<T> =
  T extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T extends Map<infer K, infer V>
    ? ReadonlyMap<K, DeepReadonly<V>>
    : T extends Set<infer V>
    ? ReadonlySet<DeepReadonly<V>>
    : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// ─── 구현 ─────────────────────────────────────────────────────────────────────

export function deepFreeze<T>(obj: T, seen = new Set<object>()): DeepReadonly<T> {
  // 원시 값 또는 null은 그대로 반환
  if (obj === null || typeof obj !== "object") {
    return obj as DeepReadonly<T>;
  }

  // 순환 참조 방지
  if (seen.has(obj)) return obj as DeepReadonly<T>;
  seen.add(obj);

  // 이미 동결된 객체는 재귀 없이 반환 (성능 최적화)
  if (Object.isFrozen(obj)) return obj as DeepReadonly<T>;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      deepFreeze(item, seen);
    }
  } else {
    for (const key of Object.keys(obj) as (keyof typeof obj)[]) {
      const value = obj[key];
      if (value !== null && typeof value === "object") {
        deepFreeze(value, seen);
      }
    }
  }

  return Object.freeze(obj) as DeepReadonly<T>;
}
