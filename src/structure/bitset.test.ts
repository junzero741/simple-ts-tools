import { describe, it, expect } from "vitest";
import { BitSet } from "./bitset";

describe("BitSet", () => {
  describe("set / has / clear", () => {
    it("비트를 설정하고 확인한다", () => {
      const bs = new BitSet();
      bs.set(0).set(5).set(31);

      expect(bs.has(0)).toBe(true);
      expect(bs.has(5)).toBe(true);
      expect(bs.has(31)).toBe(true);
      expect(bs.has(1)).toBe(false);
    });

    it("비트를 해제한다", () => {
      const bs = new BitSet();
      bs.set(3);
      expect(bs.has(3)).toBe(true);

      bs.clear(3);
      expect(bs.has(3)).toBe(false);
    });

    it("용량을 초과하면 자동 확장한다", () => {
      const bs = new BitSet(8);
      bs.set(100);
      expect(bs.has(100)).toBe(true);
      expect(bs.has(99)).toBe(false);
    });

    it("미할당 인덱스에 has는 false", () => {
      const bs = new BitSet(8);
      expect(bs.has(999)).toBe(false);
    });
  });

  describe("toggle", () => {
    it("비트를 토글한다", () => {
      const bs = new BitSet();
      bs.toggle(5);
      expect(bs.has(5)).toBe(true);

      bs.toggle(5);
      expect(bs.has(5)).toBe(false);
    });
  });

  describe("count", () => {
    it("설정된 비트 수를 반환한다", () => {
      const bs = BitSet.from([0, 3, 7, 15, 31]);
      expect(bs.count()).toBe(5);
    });

    it("빈 BitSet은 0", () => {
      expect(new BitSet().count()).toBe(0);
    });
  });

  describe("isEmpty / clearAll", () => {
    it("isEmpty — 빈 상태 확인", () => {
      const bs = new BitSet();
      expect(bs.isEmpty()).toBe(true);

      bs.set(0);
      expect(bs.isEmpty()).toBe(false);
    });

    it("clearAll — 모든 비트 해제", () => {
      const bs = BitSet.from([1, 5, 10]);
      bs.clearAll();
      expect(bs.isEmpty()).toBe(true);
    });
  });

  describe("집합 연산", () => {
    const a = BitSet.from([1, 2, 3, 4]);
    const b = BitSet.from([3, 4, 5, 6]);

    it("union — 합집합", () => {
      expect(a.union(b).toArray()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("intersection — 교집합", () => {
      expect(a.intersection(b).toArray()).toEqual([3, 4]);
    });

    it("difference — 차집합", () => {
      expect(a.difference(b).toArray()).toEqual([1, 2]);
    });

    it("symmetricDifference — 대칭 차집합", () => {
      expect(a.symmetricDifference(b).toArray()).toEqual([1, 2, 5, 6]);
    });
  });

  describe("contains", () => {
    it("부분 집합 확인", () => {
      const a = BitSet.from([1, 2, 3, 4, 5]);
      const b = BitSet.from([2, 4]);

      expect(a.contains(b)).toBe(true);
      expect(b.contains(a)).toBe(false);
    });
  });

  describe("equals", () => {
    it("같은 BitSet을 비교한다", () => {
      const a = BitSet.from([1, 3, 5]);
      const b = BitSet.from([1, 3, 5]);
      const c = BitSet.from([1, 3]);

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });

  describe("toArray / from", () => {
    it("설정된 인덱스를 배열로 반환한다", () => {
      expect(BitSet.from([0, 2, 5, 10]).toArray()).toEqual([0, 2, 5, 10]);
    });

    it("빈 BitSet은 빈 배열", () => {
      expect(new BitSet().toArray()).toEqual([]);
    });
  });

  describe("이터레이터", () => {
    it("for...of로 순회한다", () => {
      const bs = BitSet.from([1, 4, 7]);
      const result: number[] = [];
      for (const i of bs) result.push(i);
      expect(result).toEqual([1, 4, 7]);
    });

    it("스프레드 연산자", () => {
      expect([...BitSet.from([2, 3])]).toEqual([2, 3]);
    });
  });

  describe("체이닝", () => {
    it("set/clear/toggle을 체이닝한다", () => {
      const bs = new BitSet()
        .set(0)
        .set(1)
        .set(2)
        .clear(1)
        .toggle(3);

      expect(bs.toArray()).toEqual([0, 2, 3]);
    });
  });

  describe("원본 불변", () => {
    it("집합 연산은 새 BitSet을 반환한다", () => {
      const a = BitSet.from([1, 2]);
      const b = BitSet.from([2, 3]);

      a.union(b);
      expect(a.toArray()).toEqual([1, 2]);
    });
  });
});
