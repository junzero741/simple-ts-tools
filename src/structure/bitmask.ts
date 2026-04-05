// 이름 기반 비트마스크 (Named Bitmask).
//
// BitSet이 숫자 인덱스 기반이라면, 이건 문자열 이름으로 플래그를
// 관리한다. 권한 시스템, 피처 플래그, 상태 조합 등에 활용.
//
// const Perms = defineBitmask(["READ", "WRITE", "DELETE", "ADMIN"] as const);
//
// const user = Perms.of("READ", "WRITE");
// user.has("READ");       // true
// user.has("ADMIN");      // false
// user.hasAll("READ", "WRITE"); // true
// user.hasAny("ADMIN", "WRITE"); // true
//
// const admin = user.add("ADMIN", "DELETE");
// const reader = admin.remove("WRITE", "DELETE", "ADMIN");
//
// Perms.serialize(user);    // 3 (비트값)
// Perms.deserialize(3);     // Bitmask { READ, WRITE }

export interface Bitmask<T extends string> {
  has(flag: T): boolean;
  hasAll(...flags: T[]): boolean;
  hasAny(...flags: T[]): boolean;
  add(...flags: T[]): Bitmask<T>;
  remove(...flags: T[]): Bitmask<T>;
  toggle(...flags: T[]): Bitmask<T>;
  toArray(): T[];
  readonly value: number;
  readonly isEmpty: boolean;
  equals(other: Bitmask<T>): boolean;
}

export interface BitmaskFactory<T extends string> {
  /** 플래그들로 비트마스크를 생성한다. */
  of(...flags: T[]): Bitmask<T>;

  /** 비트값에서 비트마스크를 복원한다. */
  deserialize(value: number): Bitmask<T>;

  /** 비트마스크를 비트값으로 직렬화한다. */
  serialize(mask: Bitmask<T>): number;

  /** 모든 플래그가 설정된 비트마스크. */
  all(): Bitmask<T>;

  /** 빈 비트마스크. */
  none(): Bitmask<T>;

  /** 등록된 플래그 이름 목록. */
  readonly flags: readonly T[];
}

export function defineBitmask<T extends string>(
  flags: readonly T[],
): BitmaskFactory<T> {
  if (flags.length > 31) throw new Error("Maximum 31 flags supported (32-bit integer)");
  if (new Set(flags).size !== flags.length) throw new Error("Duplicate flag names");

  const flagBit = new Map<T, number>();
  for (let i = 0; i < flags.length; i++) {
    flagBit.set(flags[i], 1 << i);
  }

  const allBits = flags.reduce((acc, f) => acc | flagBit.get(f)!, 0);

  function createMask(value: number): Bitmask<T> {
    const mask: Bitmask<T> = {
      has(flag) {
        const bit = flagBit.get(flag);
        if (bit === undefined) return false;
        return (value & bit) !== 0;
      },

      hasAll(...fs) {
        return fs.every((f) => mask.has(f));
      },

      hasAny(...fs) {
        return fs.some((f) => mask.has(f));
      },

      add(...fs) {
        let v = value;
        for (const f of fs) {
          const bit = flagBit.get(f);
          if (bit !== undefined) v |= bit;
        }
        return createMask(v);
      },

      remove(...fs) {
        let v = value;
        for (const f of fs) {
          const bit = flagBit.get(f);
          if (bit !== undefined) v &= ~bit;
        }
        return createMask(v);
      },

      toggle(...fs) {
        let v = value;
        for (const f of fs) {
          const bit = flagBit.get(f);
          if (bit !== undefined) v ^= bit;
        }
        return createMask(v);
      },

      toArray() {
        return flags.filter((f) => (value & flagBit.get(f)!) !== 0);
      },

      get value() { return value; },
      get isEmpty() { return value === 0; },

      equals(other) { return value === other.value; },
    };

    return mask;
  }

  return {
    of(...fs) {
      let v = 0;
      for (const f of fs) {
        const bit = flagBit.get(f);
        if (bit === undefined) throw new Error(`Unknown flag: "${f}"`);
        v |= bit;
      }
      return createMask(v);
    },

    deserialize(v) { return createMask(v & allBits); },
    serialize(mask) { return mask.value; },
    all() { return createMask(allBits); },
    none() { return createMask(0); },

    get flags() { return flags; },
  };
}
