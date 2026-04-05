// VersionedMap — 변경 히스토리를 추적하는 맵.
//
// 모든 set/delete 연산을 버전으로 기록하고,
// snapshot(특정 버전 상태 복원), diff(버전 간 차이),
// history(키별 변경 이력) 조회를 지원한다.
//
// const m = new VersionedMap<string, number>();
// m.set("a", 1);  // v1
// m.set("b", 2);  // v2
// m.set("a", 10); // v3
// m.delete("b");   // v4
//
// m.version;           // 4
// m.snapshot(2);       // Map { "a" => 1, "b" => 2 }
// m.historyOf("a");    // [{ version: 1, value: 1 }, { version: 3, value: 10 }]
// m.diff(1, 3);        // [{ key: "a", from: 1, to: 10 }]

type ChangeEntry<K, V> = {
  version: number;
  key: K;
  type: "set" | "delete";
  value?: V;
  prev?: V;
};

export interface VersionedMap<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): VersionedMap<K, V>;
  delete(key: K): boolean;
  has(key: K): boolean;

  readonly size: number;
  readonly version: number;

  /** 특정 버전 시점의 스냅샷을 Map으로 반환한다. */
  snapshot(atVersion?: number): Map<K, V>;

  /** 키의 변경 이력을 반환한다. */
  historyOf(key: K): Array<{ version: number; type: "set" | "delete"; value?: V }>;

  /** 두 버전 사이의 변경 사항을 반환한다. */
  diff(fromVersion: number, toVersion: number): Array<{
    key: K;
    type: "set" | "delete";
    from?: V;
    to?: V;
  }>;

  /** 특정 버전으로 롤백한다. 롤백 자체도 새 버전으로 기록된다. */
  rollback(toVersion: number): void;

  /** 전체 변경 로그를 반환한다. */
  readonly changelog: ReadonlyArray<{
    version: number;
    key: K;
    type: "set" | "delete";
    value?: V;
    prev?: V;
  }>;

  keys(): K[];
  values(): V[];
  entries(): [K, V][];
  forEach(fn: (value: V, key: K) => void): void;
  clear(): void;
}

export function createVersionedMap<K, V>(): VersionedMap<K, V> {
  const data = new Map<K, V>();
  const log: ChangeEntry<K, V>[] = [];
  let ver = 0;

  function record(key: K, type: "set" | "delete", value?: V, prev?: V): void {
    ver++;
    log.push({ version: ver, key, type, value, prev });
  }

  const vmap: VersionedMap<K, V> = {
    get(key) { return data.get(key); },

    set(key, value) {
      const prev = data.get(key);
      record(key, "set", value, prev);
      data.set(key, value);
      return vmap;
    },

    delete(key) {
      if (!data.has(key)) return false;
      const prev = data.get(key);
      record(key, "delete", undefined, prev);
      data.delete(key);
      return true;
    },

    has(key) { return data.has(key); },

    get size() { return data.size; },
    get version() { return ver; },

    snapshot(atVersion?: number): Map<K, V> {
      const v = atVersion ?? ver;
      const snap = new Map<K, V>();
      for (const entry of log) {
        if (entry.version > v) break;
        if (entry.type === "set") {
          snap.set(entry.key, entry.value!);
        } else {
          snap.delete(entry.key);
        }
      }
      return snap;
    },

    historyOf(key) {
      return log
        .filter((e) => e.key === key)
        .map(({ version, type, value }) => ({ version, type, value }));
    },

    diff(fromVersion, toVersion) {
      const fromSnap = vmap.snapshot(fromVersion);
      const toSnap = vmap.snapshot(toVersion);
      const changes: Array<{ key: K; type: "set" | "delete"; from?: V; to?: V }> = [];
      const allKeys = new Set([...fromSnap.keys(), ...toSnap.keys()]);

      for (const key of allKeys) {
        const fromVal = fromSnap.get(key);
        const toVal = toSnap.get(key);
        const hadFrom = fromSnap.has(key);
        const hadTo = toSnap.has(key);

        if (hadFrom && hadTo && fromVal !== toVal) {
          changes.push({ key, type: "set", from: fromVal, to: toVal });
        } else if (hadFrom && !hadTo) {
          changes.push({ key, type: "delete", from: fromVal });
        } else if (!hadFrom && hadTo) {
          changes.push({ key, type: "set", to: toVal });
        }
      }

      return changes;
    },

    rollback(toVersion) {
      const snap = vmap.snapshot(toVersion);

      // 현재 상태와의 차이를 기록하며 롤백
      const allKeys = new Set([...data.keys(), ...snap.keys()]);
      for (const key of allKeys) {
        const current = data.get(key);
        const target = snap.get(key);
        const hasCurrent = data.has(key);
        const hasTarget = snap.has(key);

        if (hasCurrent && hasTarget && current !== target) {
          record(key, "set", target, current);
          data.set(key, target!);
        } else if (hasCurrent && !hasTarget) {
          record(key, "delete", undefined, current);
          data.delete(key);
        } else if (!hasCurrent && hasTarget) {
          record(key, "set", target, undefined);
          data.set(key, target!);
        }
      }
    },

    get changelog() { return log; },

    keys() { return [...data.keys()]; },
    values() { return [...data.values()]; },
    entries() { return [...data.entries()]; },
    forEach(fn) { data.forEach(fn); },

    clear() {
      for (const key of [...data.keys()]) {
        vmap.delete(key);
      }
    },
  };

  return vmap;
}
