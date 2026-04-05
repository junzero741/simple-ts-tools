export interface DiffResult {
  /** b에만 있는 키와 값 */
  added: Record<string, unknown>;
  /** a에만 있는 키와 값 */
  removed: Record<string, unknown>;
  /** 양쪽에 있지만 값이 바뀐 키 */
  changed: Record<string, { from: unknown; to: unknown }>;
}

/**
 * 두 plain 객체의 얕은 차이를 계산한다.
 *
 * - added: b에 있고 a에 없는 키
 * - removed: a에 있고 b에 없는 키
 * - changed: 양쪽에 있지만 값이 다른 키 (deepEqual 기준)
 *
 * @example
 * diff(
 *   { a: 1, b: 2, c: 3 },
 *   { a: 1, b: 9, d: 4 }
 * )
 * // {
 * //   added:   { d: 4 },
 * //   removed: { c: 3 },
 * //   changed: { b: { from: 2, to: 9 } }
 * // }
 */
export function diff(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): DiffResult {
  const added: Record<string, unknown> = {};
  const removed: Record<string, unknown> = {};
  const changed: Record<string, { from: unknown; to: unknown }> = {};

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    const inA = Object.prototype.hasOwnProperty.call(a, key);
    const inB = Object.prototype.hasOwnProperty.call(b, key);

    if (inA && !inB) {
      removed[key] = a[key];
    } else if (!inA && inB) {
      added[key] = b[key];
    } else if (inA && inB && !deepEqual(a[key], b[key])) {
      changed[key] = { from: a[key], to: b[key] };
    }
  }

  return { added, removed, changed };
}

/**
 * diff()의 결과가 비어 있는지(변경사항이 없는지) 확인한다.
 *
 * @example
 * isDiffEmpty(diff({ a: 1 }, { a: 1 }))  // true
 * isDiffEmpty(diff({ a: 1 }, { a: 2 }))  // false
 */
export function isDiffEmpty(result: DiffResult): boolean {
  return (
    Object.keys(result.added).length === 0 &&
    Object.keys(result.removed).length === 0 &&
    Object.keys(result.changed).length === 0
  );
}

// ─── 내부 deepEqual (object/deepEqual에서 순환 의존 없이 사용) ─────────────────
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }

  return false;
}
