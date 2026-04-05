/**
 * 두 값을 재귀적으로 비교해 경로 기반 변경 목록을 반환한다.
 *
 * ## 기존 `diff`와의 차이
 * - `diff(a, b)` — 최상위 키만 비교 (얕은 비교). `{ added, removed, changed }` 반환
 * - `deepDiff(a, b)` — 중첩 객체와 배열을 재귀 탐색. `Change[]` 반환 (경로 포함)
 *
 * ## Change 경로 형식
 * - 객체 키: `"user.name"`, `"config.db.host"`
 * - 배열 인덱스: `"tags[0]"`, `"items[2].price"`
 * - 루트 값 교체: `"(root)"`
 *
 * ## 주요 용도
 * - **폼 dirty 감지** — `deepDiff(savedForm, currentForm).length > 0`
 * - **감사 로그** — `deepDiff(before, after)` → DB에 Change[] 저장
 * - **undo/redo** — 변경을 Change[]로 쌓고 `deepPatch(state, invertChanges(changes))`로 롤백
 * - **낙관적 업데이트** — 서버 실패 시 `deepPatch(optimistic, diff(optimistic, original))`
 *
 * @example
 * const changes = deepDiff(
 *   { user: { name: "Alice", age: 30 }, tags: ["ts"] },
 *   { user: { name: "Alice", age: 31 }, tags: ["ts", "js"] },
 * );
 * // [
 * //   { type: "update", path: "user.age", oldValue: 30, newValue: 31 },
 * //   { type: "add",    path: "tags[1]",  newValue: "js" },
 * // ]
 *
 * @example
 * // 변경 사항을 원본 객체에 적용
 * const updated = deepPatch(original, changes);
 *
 * @example
 * // undo — 변경 방향을 뒤집어 원래 값으로 복원
 * const undoChanges = invertChanges(changes);
 * const restored = deepPatch(updated, undoChanges);
 */

export type ChangeType = "add" | "remove" | "update";

export interface Change {
  /** 변경 종류 */
  type: ChangeType;
  /** 점(.) 구분 경로. 배열 인덱스는 `[n]` 표기 (예: `"user.tags[2].name"`) */
  path: string;
  /** 변경 전 값 (`add`일 때는 `undefined`) */
  oldValue?: unknown;
  /** 변경 후 값 (`remove`일 때는 `undefined`) */
  newValue?: unknown;
}

// ─── 내부 유틸 ───────────────────────���─────────────────────────────���──────────

function joinPath(parent: string, key: string | number): string {
  if (typeof key === "number") {
    return parent === "" ? `[${key}]` : `${parent}[${key}]`;
  }
  return parent === "" ? key : `${parent}.${key}`;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === "object" &&
    val !== null &&
    !Array.isArray(val) &&
    !(val instanceof Date) &&
    !(val instanceof RegExp) &&
    !(val instanceof Map) &&
    !(val instanceof Set)
  );
}

function leafEqual(a: unknown, b: unknown): boolean {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;
  return Object.is(a, b);
}

function collect(a: unknown, b: unknown, path: string, result: Change[]): void {
  if (leafEqual(a, b)) return;

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = new Set(Object.keys(a));
    const keysB = new Set(Object.keys(b));
    for (const key of keysA) {
      if (!keysB.has(key)) {
        result.push({ type: "remove", path: joinPath(path, key), oldValue: a[key] });
      } else {
        collect(a[key], b[key], joinPath(path, key), result);
      }
    }
    for (const key of keysB) {
      if (!keysA.has(key)) {
        result.push({ type: "add", path: joinPath(path, key), newValue: b[key] });
      }
    }
    return;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= a.length) {
        result.push({ type: "add", path: joinPath(path, i), newValue: b[i] });
      } else if (i >= b.length) {
        result.push({ type: "remove", path: joinPath(path, i), oldValue: a[i] });
      } else {
        collect(a[i], b[i], joinPath(path, i), result);
      }
    }
    return;
  }

  // 타입 변경 or 원시값 변경
  result.push({
    type: "update",
    path: path === "" ? "(root)" : path,
    oldValue: a,
    newValue: b,
  });
}

// ─── 공개 API ────────────────────────────────────────────────────────────���────

/**
 * `a`에서 `b`로의 재귀적 변경 내역을 반환한다.
 * 변경이 없으면 빈 배열을 반환한다.
 *
 * - 중첩 객체: 재귀 탐색 후 변경된 리프 경로 반환
 * - 배열: 인덱스 기준 비교 (추가/제거/변경)
 * - Date / RegExp: 값 동등 비교
 */
export function deepDiff(a: unknown, b: unknown): Change[] {
  const result: Change[] = [];
  collect(a, b, "", result);
  return result;
}

/**
 * 두 값이 하나라도 다른지 빠르게 확인한다.
 *
 * @example
 * if (hasDeepDiff(savedForm, currentForm)) showUnsavedIndicator();
 */
export function hasDeepDiff(a: unknown, b: unknown): boolean {
  return deepDiff(a, b).length > 0;
}

/**
 * `deepDiff()`가 반환한 변경 목록의 방향을 뒤집는다 (`a→b` → `b→a`).
 * undo/redo 구현 시 사용한다.
 *
 * @example
 * const changes = deepDiff(before, after);
 * const undone = deepPatch(after, invertChanges(changes)); // before와 동일
 */
export function invertChanges(changes: Change[]): Change[] {
  return changes.map((c) => {
    if (c.type === "add") {
      return { type: "remove", path: c.path, oldValue: c.newValue };
    }
    if (c.type === "remove") {
      return { type: "add", path: c.path, newValue: c.oldValue };
    }
    return { type: "update", path: c.path, oldValue: c.newValue, newValue: c.oldValue };
  });
}

// ─── deepPatch ──────────────────────────────────────────────���─────────────────

type Segment = { kind: "key"; key: string } | { kind: "index"; index: number };

function parsePath(path: string): Segment[] {
  if (path === "(root)") return [];
  const segments: Segment[] = [];
  // "user.tags[2].name" 형태를 파싱
  // 먼저 점으로 나누고, 각 파트에서 [] 인덱스를 추출
  for (const part of path.split(".")) {
    const bracketSplit = part.split(/(\[\d+\])/);
    for (const token of bracketSplit) {
      if (!token) continue;
      const idx = token.match(/^\[(\d+)\]$/);
      if (idx) {
        segments.push({ kind: "index", index: Number(idx[1]) });
      } else {
        segments.push({ kind: "key", key: token });
      }
    }
  }
  return segments;
}

function shallowClone(val: unknown): unknown {
  if (Array.isArray(val)) return [...val];
  if (isPlainObject(val)) return { ...val };
  return val;
}

function applyAtPath(
  root: unknown,
  segments: Segment[],
  value: unknown,
  remove: boolean,
): unknown {
  if (segments.length === 0) {
    return remove ? undefined : value;
  }

  const [head, ...tail] = segments;
  const copy = shallowClone(root);

  if (head.kind === "key") {
    const obj = copy as Record<string, unknown>;
    if (remove && tail.length === 0) {
      delete obj[head.key];
    } else {
      obj[head.key] = applyAtPath(obj[head.key], tail, value, remove);
    }
  } else {
    const arr = copy as unknown[];
    if (remove && tail.length === 0) {
      arr.splice(head.index, 1);
    } else {
      arr[head.index] = applyAtPath(arr[head.index], tail, value, remove);
    }
  }

  return copy;
}

/**
 * `deepDiff()`가 반환한 변경 목록을 `obj`에 적용해 새 객체를 반환한다 (비파괴).
 *
 * @example
 * const original = { user: { name: "Alice", age: 30 } };
 * const changes  = deepDiff(original, { user: { name: "Alice", age: 31 } });
 * const updated  = deepPatch(original, changes);
 * // { user: { name: "Alice", age: 31 } }
 *
 * @example
 * // undo
 * const restored = deepPatch(updated, invertChanges(changes));
 * // { user: { name: "Alice", age: 30 } }
 */
export function deepPatch<T>(obj: T, changes: Change[]): T {
  let result: unknown = obj;

  for (const change of changes) {
    if (change.path === "(root)") {
      result = change.type === "remove" ? undefined : change.newValue;
      continue;
    }
    const segments = parsePath(change.path);
    result = applyAtPath(
      result,
      segments,
      change.newValue,
      change.type === "remove",
    );
  }

  return result as T;
}
