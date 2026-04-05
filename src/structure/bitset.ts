/**
 * 비트 집합 (BitSet).
 *
 * 비트 단위로 boolean 상태를 관리한다. 권한 플래그, 피처 토글,
 * 블룸 필터, 상태 마스크 등에 활용. 일반 Set<number> 대비
 * 메모리 효율이 32배 높고, union/intersection 등이 O(n/32).
 *
 * @example
 * // 권한 관리
 * const READ = 0, WRITE = 1, DELETE = 2, ADMIN = 3;
 *
 * const perms = new BitSet();
 * perms.set(READ).set(WRITE);
 *
 * perms.has(READ);    // true
 * perms.has(DELETE);  // false
 *
 * // 합집합 — 권한 병합
 * const adminPerms = new BitSet().set(ADMIN).set(DELETE);
 * const merged = perms.union(adminPerms);
 * merged.has(ADMIN);  // true
 *
 * @example
 * // 피처 플래그
 * const flags = BitSet.from([0, 2, 5, 10]);
 * flags.toArray();  // [0, 2, 5, 10]
 * flags.count();    // 4
 *
 * @complexity
 * - set/clear/has/toggle: O(1)
 * - union/intersection/difference: O(n/32)
 * - count: O(n/32)
 */

export class BitSet {
  private words: Uint32Array;

  constructor(capacity: number = 32) {
    this.words = new Uint32Array(Math.ceil(capacity / 32));
  }

  /** 비트 인덱스에서 워드 인덱스와 비트 마스크를 구한다. */
  private locate(index: number): { word: number; mask: number } {
    return { word: index >>> 5, mask: 1 << (index & 31) };
  }

  /** 용량을 확장한다. */
  private grow(index: number): void {
    const needed = (index >>> 5) + 1;
    if (needed <= this.words.length) return;
    const next = new Uint32Array(Math.max(needed, this.words.length * 2));
    next.set(this.words);
    this.words = next;
  }

  /** 비트를 설정한다 (1로). */
  set(index: number): this {
    this.grow(index);
    const { word, mask } = this.locate(index);
    this.words[word] |= mask;
    return this;
  }

  /** 비트를 해제한다 (0으로). */
  clear(index: number): this {
    const { word, mask } = this.locate(index);
    if (word < this.words.length) {
      this.words[word] &= ~mask;
    }
    return this;
  }

  /** 비트가 설정되어 있는지 확인한다. */
  has(index: number): boolean {
    const { word, mask } = this.locate(index);
    if (word >= this.words.length) return false;
    return (this.words[word] & mask) !== 0;
  }

  /** 비트를 토글한다. */
  toggle(index: number): this {
    this.grow(index);
    const { word, mask } = this.locate(index);
    this.words[word] ^= mask;
    return this;
  }

  /** 설정된 비트 수를 반환한다 (popcount). */
  count(): number {
    let total = 0;
    for (let i = 0; i < this.words.length; i++) {
      total += popcount32(this.words[i]);
    }
    return total;
  }

  /** 설정된 비트가 없는지 확인한다. */
  isEmpty(): boolean {
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i] !== 0) return false;
    }
    return true;
  }

  /** 모든 비트를 해제한다. */
  clearAll(): this {
    this.words.fill(0);
    return this;
  }

  /** 합집합 (OR). */
  union(other: BitSet): BitSet {
    const maxLen = Math.max(this.words.length, other.words.length);
    const result = new BitSet(maxLen * 32);
    for (let i = 0; i < maxLen; i++) {
      result.words[i] = (this.words[i] || 0) | (other.words[i] || 0);
    }
    return result;
  }

  /** 교집합 (AND). */
  intersection(other: BitSet): BitSet {
    const minLen = Math.min(this.words.length, other.words.length);
    const result = new BitSet(minLen * 32);
    for (let i = 0; i < minLen; i++) {
      result.words[i] = this.words[i] & other.words[i];
    }
    return result;
  }

  /** 차집합 (AND NOT). */
  difference(other: BitSet): BitSet {
    const result = new BitSet(this.words.length * 32);
    for (let i = 0; i < this.words.length; i++) {
      result.words[i] = this.words[i] & ~(other.words[i] || 0);
    }
    return result;
  }

  /** 대칭 차집합 (XOR). */
  symmetricDifference(other: BitSet): BitSet {
    const maxLen = Math.max(this.words.length, other.words.length);
    const result = new BitSet(maxLen * 32);
    for (let i = 0; i < maxLen; i++) {
      result.words[i] = (this.words[i] || 0) ^ (other.words[i] || 0);
    }
    return result;
  }

  /** other의 모든 비트가 this에 포함되어 있는지 확인한다. */
  contains(other: BitSet): boolean {
    for (let i = 0; i < other.words.length; i++) {
      const w = other.words[i];
      if ((w & (this.words[i] || 0)) !== w) return false;
    }
    return true;
  }

  /** 두 BitSet이 같은지 비교한다. */
  equals(other: BitSet): boolean {
    const maxLen = Math.max(this.words.length, other.words.length);
    for (let i = 0; i < maxLen; i++) {
      if ((this.words[i] || 0) !== (other.words[i] || 0)) return false;
    }
    return true;
  }

  /** 설정된 비트 인덱스를 배열로 반환한다. */
  toArray(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.words.length; i++) {
      let word = this.words[i];
      while (word !== 0) {
        const bit = word & -word; // lowest set bit
        result.push(i * 32 + Math.log2(bit));
        word ^= bit;
      }
    }
    return result;
  }

  /** 이터레이터. */
  *[Symbol.iterator](): Iterator<number> {
    for (let i = 0; i < this.words.length; i++) {
      let word = this.words[i];
      while (word !== 0) {
        const bit = word & -word;
        yield i * 32 + Math.log2(bit);
        word ^= bit;
      }
    }
  }

  /** 배열에서 BitSet을 생성한다. */
  static from(indices: number[]): BitSet {
    const max = indices.length > 0 ? Math.max(...indices) + 1 : 32;
    const bs = new BitSet(max);
    for (const i of indices) bs.set(i);
    return bs;
  }
}

/** 32비트 정수의 1-bit 개수 (Hamming weight). */
function popcount32(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  n = (n + (n >>> 4)) & 0x0f0f0f0f;
  return (n * 0x01010101) >>> 24;
}
