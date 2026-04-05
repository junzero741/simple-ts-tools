import { describe, it, expect } from "vitest";
import { IntervalTree } from "./intervalTree";

describe("IntervalTree", () => {
  describe("insert / size", () => {
    it("구간을 삽입한다", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A").insert(3, 8, "B");
      expect(tree.size).toBe(2);
    });

    it("low > high면 에러", () => {
      const tree = new IntervalTree<string>();
      expect(() => tree.insert(5, 1, "X")).toThrow("low must not exceed high");
    });
  });

  describe("query", () => {
    it("겹치는 구간을 반환한다", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(3, 8, "B");
      tree.insert(10, 15, "C");
      tree.insert(20, 25, "D");

      expect(tree.query(4, 6).sort()).toEqual(["A", "B"]);
    });

    it("경계에서 겹침", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(5, 10, "B");

      expect(tree.query(5, 5).sort()).toEqual(["A", "B"]);
    });

    it("안 겹치면 빈 배열", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(10, 15, "B");

      expect(tree.query(6, 9)).toEqual([]);
    });

    it("모두 겹치면 전부 반환", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 100, "A");
      tree.insert(50, 200, "B");
      tree.insert(0, 300, "C");

      expect(tree.query(60, 70).sort()).toEqual(["A", "B", "C"]);
    });
  });

  describe("queryPoint", () => {
    it("점을 포함하는 구간을 반환한다", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(3, 8, "B");
      tree.insert(10, 15, "C");

      expect(tree.queryPoint(3).sort()).toEqual(["A", "B"]);
      expect(tree.queryPoint(10)).toEqual(["C"]);
      expect(tree.queryPoint(9)).toEqual([]);
    });
  });

  describe("hasOverlap", () => {
    it("겹침 존재 여부", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(10, 15, "B");

      expect(tree.hasOverlap(3, 4)).toBe(true);
      expect(tree.hasOverlap(6, 9)).toBe(false);
      expect(tree.hasOverlap(14, 20)).toBe(true);
    });
  });

  describe("findOverlaps", () => {
    it("겹치는 구간 쌍을 반환한다", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(3, 8, "B");
      tree.insert(10, 15, "C");

      const overlaps = tree.findOverlaps();
      expect(overlaps.length).toBe(1);
      expect(overlaps[0][0].data).toBe("A");
      expect(overlaps[0][1].data).toBe("B");
    });

    it("겹침이 없으면 빈 배열", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.insert(10, 15, "B");

      expect(tree.findOverlaps()).toEqual([]);
    });

    it("여러 겹침 쌍", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 10, "A");
      tree.insert(5, 15, "B");
      tree.insert(8, 20, "C");

      const overlaps = tree.findOverlaps();
      expect(overlaps.length).toBe(3); // A-B, A-C, B-C
    });
  });

  describe("remove", () => {
    it("구간을 제거한다", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A").insert(3, 8, "B");

      expect(tree.remove(1, 5)).toBe(true);
      expect(tree.size).toBe(1);
      expect(tree.query(1, 5)).toEqual(["B"]);
    });

    it("데이터까지 매칭하여 제거", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A").insert(1, 5, "B");

      tree.remove(1, 5, "A");
      expect(tree.size).toBe(1);
      expect(tree.query(1, 5)).toEqual(["B"]);
    });

    it("없는 구간 제거는 false", () => {
      const tree = new IntervalTree<string>();
      expect(tree.remove(1, 5)).toBe(false);
    });
  });

  describe("all / clear", () => {
    it("all — 모든 구간 반환", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A").insert(3, 8, "B");
      expect(tree.all().length).toBe(2);
    });

    it("clear — 모든 구간 제거", () => {
      const tree = new IntervalTree<string>();
      tree.insert(1, 5, "A");
      tree.clear();
      expect(tree.size).toBe(0);
    });
  });

  describe("실전: 캘린더 충돌 감지", () => {
    it("일정 충돌을 감지한다", () => {
      const cal = new IntervalTree<string>();
      cal.insert(9, 10, "회의 A");
      cal.insert(10, 12, "회의 B");
      cal.insert(11, 13, "점심");
      cal.insert(14, 16, "발표");

      // 10시~12시 회의 B와 11시~13시 점심이 충돌
      const conflicts = cal.findOverlaps();
      const conflictPairs = conflicts.map(([a, b]) => [a.data, b.data]);

      expect(conflictPairs).toContainEqual(["회의 B", "점심"]);
    });

    it("새 일정이 기존 일정과 충돌하는지 확인", () => {
      const cal = new IntervalTree<string>();
      cal.insert(9, 10, "회의");
      cal.insert(14, 16, "발표");

      expect(cal.hasOverlap(11, 13)).toBe(false); // 11시~13시 비어있음
      expect(cal.hasOverlap(9, 11)).toBe(true);   // 회의와 충돌
    });
  });
});
