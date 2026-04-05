/**
 * 블룸 필터 (Bloom Filter).
 *
 * 확률적 멤버십 테스트 자료구조.
 * "확실히 없음" 또는 "아마도 있음"을 O(1)로 판별한다.
 * false positive은 가능하지만 false negative은 절대 없다.
 *
 * URL 중복 검사, 스팸 필터, 캐시 워밍 판별, DB 쿼리 최적화 등에 활용.
 *
 * @example
 * const filter = new BloomFilter(1000, 0.01); // 1000개 예상, 1% 오탐률
 *
 * filter.add("hello");
 * filter.add("world");
 *
 * filter.has("hello"); // true  (확정)
 * filter.has("foo");   // false (확정적 미존재)
 * filter.has("bar");   // false 또는 true (false positive 가능)
 *
 * @example
 * // 대량 URL 중복 체크
 * const seen = new BloomFilter(1_000_000, 0.001);
 * for (const url of urls) {
 *   if (seen.has(url)) continue; // 이미 방문 (또는 극소 확률의 오탐)
 *   seen.add(url);
 *   await crawl(url);
 * }
 *
 * @complexity
 * - add: O(k), k = 해시 함수 수
 * - has: O(k)
 * - Space: O(m) bits, m = 비트 배열 크기
 */

export class BloomFilter {
  private readonly bits: Uint8Array;
  private readonly bitCount: number;
  private readonly hashCount: number;
  private _size = 0;

  /**
   * @param expectedItems 예상 삽입 개수
   * @param falsePositiveRate 원하는 오탐률 (0 < rate < 1)
   */
  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    if (expectedItems < 1) throw new Error("expectedItems must be at least 1");
    if (falsePositiveRate <= 0 || falsePositiveRate >= 1) {
      throw new Error("falsePositiveRate must be between 0 and 1");
    }

    // 최적 비트 수: m = -(n * ln(p)) / (ln(2)^2)
    this.bitCount = Math.ceil(
      -(expectedItems * Math.log(falsePositiveRate)) / (Math.LN2 * Math.LN2),
    );

    // 최적 해시 함수 수: k = (m/n) * ln(2)
    this.hashCount = Math.max(
      1,
      Math.round((this.bitCount / expectedItems) * Math.LN2),
    );

    this.bits = new Uint8Array(Math.ceil(this.bitCount / 8));
  }

  /** 요소를 추가한다. */
  add(value: string): this {
    const hashes = this.getHashes(value);
    for (const idx of hashes) {
      this.bits[idx >>> 3] |= 1 << (idx & 7);
    }
    this._size++;
    return this;
  }

  /** 요소가 존재할 수 있는지 확인한다. false면 확실히 없음. */
  has(value: string): boolean {
    const hashes = this.getHashes(value);
    for (const idx of hashes) {
      if ((this.bits[idx >>> 3] & (1 << (idx & 7))) === 0) {
        return false;
      }
    }
    return true;
  }

  /** 추가된 요소 수 (정확). */
  get size(): number {
    return this._size;
  }

  /** 비트 배열 크기. */
  get capacity(): number {
    return this.bitCount;
  }

  /** 해시 함수 수. */
  get hashFunctions(): number {
    return this.hashCount;
  }

  /** 현재 예상 오탐률. */
  get estimatedFalsePositiveRate(): number {
    // (1 - e^(-kn/m))^k
    const exponent = (-this.hashCount * this._size) / this.bitCount;
    return Math.pow(1 - Math.exp(exponent), this.hashCount);
  }

  /** 모든 비트를 초기화한다. */
  clear(): void {
    this.bits.fill(0);
    this._size = 0;
  }

  /**
   * 두 블룸 필터를 합친다 (OR). 같은 크기여야 한다.
   * 새 BloomFilter를 반환하지 않고 this를 변경한다.
   */
  merge(other: BloomFilter): this {
    if (this.bitCount !== other.bitCount || this.hashCount !== other.hashCount) {
      throw new Error("Cannot merge BloomFilters with different configurations");
    }
    for (let i = 0; i < this.bits.length; i++) {
      this.bits[i] |= other.bits[i];
    }
    this._size += other._size;
    return this;
  }

  /** MurmurHash3 기반 더블 해싱으로 k개의 해시를 생성한다. */
  private getHashes(value: string): number[] {
    const h1 = murmur3(value, 0);
    const h2 = murmur3(value, h1);
    const hashes: number[] = [];
    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(((h1 + i * h2) >>> 0) % this.bitCount);
    }
    return hashes;
  }
}

/** MurmurHash3 32-bit. */
function murmur3(key: string, seed: number): number {
  let h = seed >>> 0;
  const len = key.length;

  for (let i = 0; i < len; i++) {
    let k = key.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
  }

  h ^= len;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;

  return h >>> 0;
}
