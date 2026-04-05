// 구간 트리 (Interval Tree).
//
// 겹치는 구간(interval)을 효율적으로 탐색하는 자료구조.
// 정렬 배열 + 이진 탐색 기반의 단순하고 실용적인 구현.
//
// 캘린더 일정 충돌, 시간 범위 쿼리, IP 범위 매칭,
// 게임 충돌 감지(1D), 예약 시스템 겹침 검사 등에 활용.
//
// const tree = new IntervalTree<string>();
// tree.insert(1, 5, "A");
// tree.insert(3, 8, "B");
// tree.insert(10, 15, "C");
//
// tree.query(4, 6);     // ["A", "B"] — 4~6과 겹치는 구간
// tree.queryPoint(3);   // ["A", "B"] — 점 3을 포함하는 구간
// tree.hasOverlap(6, 9); // true

export interface Interval<T> {
  low: number;
  high: number;
  data: T;
}

export class IntervalTree<T> {
  private intervals: Interval<T>[] = [];
  private sorted = false;

  /** 구간을 삽입한다. */
  insert(low: number, high: number, data: T): this {
    if (low > high) throw new Error("low must not exceed high");
    this.intervals.push({ low, high, data });
    this.sorted = false;
    return this;
  }

  /** 구간을 제거한다 (첫 번째 일치). */
  remove(low: number, high: number, data?: T): boolean {
    const idx = this.intervals.findIndex(
      (iv) => iv.low === low && iv.high === high && (data === undefined || iv.data === data),
    );
    if (idx === -1) return false;
    this.intervals.splice(idx, 1);
    this.sorted = false;
    return true;
  }

  /** [queryLow, queryHigh]와 겹치는 모든 구간의 데이터를 반환한다. */
  query(queryLow: number, queryHigh: number): T[] {
    this.ensureSorted();
    const result: T[] = [];

    for (const iv of this.intervals) {
      // 정렬 활용: iv.low > queryHigh면 이후 구간도 안 겹침
      if (iv.low > queryHigh) break;
      if (iv.high >= queryLow) {
        result.push(iv.data);
      }
    }

    return result;
  }

  /** 점(point)을 포함하는 모든 구간의 데이터를 반환한다. */
  queryPoint(point: number): T[] {
    return this.query(point, point);
  }

  /** [queryLow, queryHigh]와 겹치는 구간이 있는지 확인한다. */
  hasOverlap(queryLow: number, queryHigh: number): boolean {
    this.ensureSorted();
    for (const iv of this.intervals) {
      if (iv.low > queryHigh) break;
      if (iv.high >= queryLow) return true;
    }
    return false;
  }

  /** 모든 구간 중 겹치는 쌍을 반환한다. */
  findOverlaps(): Array<[Interval<T>, Interval<T>]> {
    this.ensureSorted();
    const overlaps: Array<[Interval<T>, Interval<T>]> = [];

    for (let i = 0; i < this.intervals.length; i++) {
      for (let j = i + 1; j < this.intervals.length; j++) {
        const a = this.intervals[i];
        const b = this.intervals[j];
        if (b.low > a.high) break;
        overlaps.push([a, b]);
      }
    }

    return overlaps;
  }

  /** 모든 구간을 반환한다. */
  all(): Interval<T>[] {
    return [...this.intervals];
  }

  /** 구간 수. */
  get size(): number {
    return this.intervals.length;
  }

  /** 모든 구간을 제거한다. */
  clear(): void {
    this.intervals.length = 0;
    this.sorted = true;
  }

  private ensureSorted(): void {
    if (this.sorted) return;
    this.intervals.sort((a, b) => a.low - b.low || a.high - b.high);
    this.sorted = true;
  }
}
