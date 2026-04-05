// 객체 변경 감사 로그 (Audit Changelog).
//
// === 예상 사용처 ===
// - 관리자 패널 — 누가 언제 어떤 필드를 변경했는지 기록 (GDPR 감사 추적)
// - CMS 콘텐츠 변경 이력 — 편집자별 수정 내역 조회
// - 설정 변경 추적 — 운영 설정 변경 시 변경 전/후 값 기록
// - 디버깅 — 상태가 언제 어떻게 바뀌었는지 시간순 추적
// - 규정 준수 — 금융/의료 시스템의 데이터 변경 감사 로그
// - Undo 지원 — 변경 이력에서 특정 시점의 값을 복원
//
// const log = createChangelog<User>();
//
// log.record(user, updatedUser, { actor: "admin@co.com", reason: "typo fix" });
// log.entries;
// → [{ timestamp, actor, reason, changes: [{ field: "name", from: "Alce", to: "Alice" }] }]

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ChangeEntry<TMeta = Record<string, unknown>> {
  timestamp: number;
  changes: FieldChange[];
  meta: TMeta;
}

export interface ChangelogOptions {
  /** 최대 기록 수. 초과 시 오래된 것 제거 (기본: 무제한). */
  maxEntries?: number;
  /** 무시할 필드 목록. */
  ignoreFields?: string[];
  /** 시간 함수 (테스트용). */
  now?: () => number;
}

export interface Changelog<T extends Record<string, unknown>, TMeta = Record<string, unknown>> {
  /** 두 상태를 비교하고 변경 사항을 기록한다. 변경이 없으면 기록하지 않는다. */
  record(before: T, after: T, meta?: TMeta): FieldChange[];

  /** 전체 변경 이력. */
  readonly entries: ReadonlyArray<ChangeEntry<TMeta>>;

  /** 특정 필드의 변경 이력만 추출한다. */
  fieldHistory(field: keyof T & string): Array<{ from: unknown; to: unknown; timestamp: number; meta: TMeta }>;

  /** 특정 시점의 상태를 복원한다 (base + 해당 시점까지의 변경 적용). */
  reconstruct(base: T, atIndex: number): T;

  /** 이력을 초기화한다. */
  clear(): void;

  /** 이력 수. */
  readonly size: number;
}

export function createChangelog<
  T extends Record<string, unknown>,
  TMeta = Record<string, unknown>,
>(options: ChangelogOptions = {}): Changelog<T, TMeta> {
  const { maxEntries, ignoreFields = [], now = Date.now } = options;
  const ignoreSet = new Set(ignoreFields);
  const log: ChangeEntry<TMeta>[] = [];

  const changelog: Changelog<T, TMeta> = {
    record(before, after, meta?) {
      const changes: FieldChange[] = [];
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

      for (const field of allKeys) {
        if (ignoreSet.has(field)) continue;
        const fromVal = before[field];
        const toVal = (after as Record<string, unknown>)[field];
        if (!Object.is(fromVal, toVal)) {
          changes.push({ field, from: fromVal, to: toVal });
        }
      }

      if (changes.length === 0) return [];

      log.push({
        timestamp: now(),
        changes,
        meta: (meta ?? {}) as TMeta,
      });

      if (maxEntries !== undefined && log.length > maxEntries) {
        log.shift();
      }

      return changes;
    },

    get entries() { return log; },

    fieldHistory(field) {
      const result: Array<{ from: unknown; to: unknown; timestamp: number; meta: TMeta }> = [];
      for (const entry of log) {
        for (const change of entry.changes) {
          if (change.field === field) {
            result.push({
              from: change.from,
              to: change.to,
              timestamp: entry.timestamp,
              meta: entry.meta,
            });
          }
        }
      }
      return result;
    },

    reconstruct(base, atIndex) {
      const result = { ...base };
      const limit = Math.min(atIndex + 1, log.length);
      for (let i = 0; i < limit; i++) {
        for (const change of log[i].changes) {
          (result as Record<string, unknown>)[change.field] = change.to;
        }
      }
      return result;
    },

    clear() { log.length = 0; },
    get size() { return log.length; },
  };

  return changelog;
}
