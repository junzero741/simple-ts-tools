// 3-way 병합 (Three-Way Merge).
//
// === 예상 사용처 ===
// - 실시간 협업 편집 (Google Docs, Notion 스타일 동시 편집 충돌 해결)
// - Git 스타일 설정 병합 (base → mine/theirs 분기 후 자동 병합)
// - 오프라인 동기화 (모바일 앱이 오프라인 변경 후 서버와 병합)
// - CMS 콘텐츠 버전 병합 (두 편집자가 같은 문서를 동시 편집)
// - 분산 시스템 상태 수렴 (CRDT 대안으로 간단한 객체 병합)
// - 폼 자동 저장 충돌 해결 (브라우저 탭 간)
//
// const base   = { name: "Alice", age: 30, city: "Seoul" };
// const mine   = { name: "Alice", age: 31, city: "Seoul" };
// const theirs = { name: "Alice", age: 30, city: "Busan" };
//
// merge3(base, mine, theirs)
// → { merged: { name: "Alice", age: 31, city: "Busan" }, conflicts: [] }
//
// // 충돌 시
// const mine2   = { name: "Bob" };
// const theirs2 = { name: "Charlie" };
// merge3(base, mine2, theirs2)
// → { merged: { name: "Bob" }, conflicts: [{ key: "name", mine: "Bob", theirs: "Charlie" }] }

export interface MergeConflict {
  key: string;
  base: unknown;
  mine: unknown;
  theirs: unknown;
}

export interface MergeResult<T> {
  merged: T;
  conflicts: MergeConflict[];
  hasConflicts: boolean;
}

export type ConflictStrategy = "mine" | "theirs" | "base";

export interface Merge3Options {
  /** 충돌 시 기본 전략 (기본: "mine"). */
  defaultStrategy?: ConflictStrategy;
  /** 키별 충돌 전략. */
  strategies?: Record<string, ConflictStrategy>;
  /** 키별 커스텀 병합 함수. */
  resolvers?: Record<string, (base: unknown, mine: unknown, theirs: unknown) => unknown>;
}

/**
 * 3-way 병합을 수행한다.
 * base에서 mine과 theirs가 각각 변경한 부분을 자동 병합.
 * 같은 키를 둘 다 변경했으면 충돌.
 */
export function merge3<T extends Record<string, unknown>>(
  base: T,
  mine: T,
  theirs: T,
  options: Merge3Options = {},
): MergeResult<T> {
  const { defaultStrategy = "mine", strategies = {}, resolvers = {} } = options;
  const merged: Record<string, unknown> = {};
  const conflicts: MergeConflict[] = [];

  const allKeys = new Set([
    ...Object.keys(base),
    ...Object.keys(mine),
    ...Object.keys(theirs),
  ]);

  for (const key of allKeys) {
    const bVal = base[key];
    const mVal = (mine as Record<string, unknown>)[key];
    const tVal = (theirs as Record<string, unknown>)[key];

    const mChanged = !Object.is(bVal, mVal);
    const tChanged = !Object.is(bVal, tVal);

    if (!mChanged && !tChanged) {
      // 둘 다 안 변경 → base 유지
      merged[key] = bVal;
    } else if (mChanged && !tChanged) {
      // mine만 변경
      merged[key] = mVal;
    } else if (!mChanged && tChanged) {
      // theirs만 변경
      merged[key] = tVal;
    } else if (Object.is(mVal, tVal)) {
      // 둘 다 같은 값으로 변경 → 충돌 아님
      merged[key] = mVal;
    } else {
      // 충돌!
      conflicts.push({ key, base: bVal, mine: mVal, theirs: tVal });

      // 해결
      if (resolvers[key]) {
        merged[key] = resolvers[key](bVal, mVal, tVal);
      } else {
        const strategy = strategies[key] ?? defaultStrategy;
        switch (strategy) {
          case "mine": merged[key] = mVal; break;
          case "theirs": merged[key] = tVal; break;
          case "base": merged[key] = bVal; break;
        }
      }
    }
  }

  return {
    merged: merged as T,
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
}

/**
 * 두 변경 세트(diff)를 base에 적용한다.
 * merge3의 간편 버전 — partial 변경만 전달.
 */
export function applyChanges<T extends Record<string, unknown>>(
  base: T,
  ...patches: Partial<T>[]
): T {
  const result = { ...base };
  for (const patch of patches) {
    for (const [key, value] of Object.entries(patch)) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}
