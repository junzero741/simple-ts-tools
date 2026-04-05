import { describe, it, expect } from "vitest";
import { SortedArray } from "./sortedArray";

const numCmp = (a: number, b: number) => a - b;

describe("SortedArray", () => {
  describe("insert", () => {
    it("삽입 시 정렬을 유지한다", () => {
      const arr = new SortedArray<number>(numCmp);
      arr.insert(3).insert(1).insert(4).insert(1).insert(5).insert(2);
      expect(arr.toArray()).toEqual([1, 1, 2, 3, 4, 5]);
    });

    it("빈 배열에 삽입한다", () => {
      const arr = new SortedArray<number>(numCmp);
      arr.insert(42);
      expect(arr.toArray()).toEqual([42]);
    });

    it("문자열 정렬", () => {
      const arr = SortedArray.from(["banana", "apple", "cherry"], (a, b) => a.localeCompare(b));
      expect(arr.toArray()).toEqual(["apple", "banana", "cherry"]);
    });
  });

  describe("insertAll", () => {
    it("여러 값을 삽입한다", () => {
      const arr = new SortedArray<number>(numCmp);
      arr.insertAll([5, 3, 1, 4, 2]);
      expect(arr.toArray()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("remove", () => {
    it("값을 제거한다", () => {
      const arr = SortedArray.from([1, 2, 3, 4, 5], numCmp);
      expect(arr.remove(3)).toBe(true);
      expect(arr.toArray()).toEqual([1, 2, 4, 5]);
    });

    it("중복 값 중 하나만 제거한다", () => {
      const arr = SortedArray.from([1, 2, 2, 3], numCmp);
      arr.remove(2);
      expect(arr.toArray()).toEqual([1, 2, 3]);
    });

    it("없는 값은 false", () => {
      const arr = SortedArray.from([1, 2, 3], numCmp);
      expect(arr.remove(99)).toBe(false);
    });
  });

  describe("has / indexOf", () => {
    it("값 존재 여부 (O(log n))", () => {
      const arr = SortedArray.from([10, 20, 30, 40, 50], numCmp);
      expect(arr.has(30)).toBe(true);
      expect(arr.has(25)).toBe(false);
    });

    it("인덱스를 반환한다", () => {
      const arr = SortedArray.from([10, 20, 30], numCmp);
      expect(arr.indexOf(20)).toBe(1);
      expect(arr.indexOf(99)).toBe(-1);
    });
  });

  describe("at / min / max", () => {
    it("인덱스로 접근한다", () => {
      const arr = SortedArray.from([1, 2, 3, 4, 5], numCmp);
      expect(arr.at(0)).toBe(1);
      expect(arr.at(4)).toBe(5);
    });

    it("음수 인덱스", () => {
      const arr = SortedArray.from([1, 2, 3], numCmp);
      expect(arr.at(-1)).toBe(3);
      expect(arr.at(-2)).toBe(2);
    });

    it("min / max", () => {
      const arr = SortedArray.from([5, 1, 3], numCmp);
      expect(arr.min()).toBe(1);
      expect(arr.max()).toBe(5);
    });

    it("빈 배열에서 undefined", () => {
      const arr = new SortedArray<number>(numCmp);
      expect(arr.min()).toBeUndefined();
      expect(arr.max()).toBeUndefined();
    });
  });

  describe("range", () => {
    it("범위 내 값을 반환한다", () => {
      const arr = SortedArray.from([1, 3, 5, 7, 9, 11], numCmp);
      expect(arr.range(3, 9)).toEqual([3, 5, 7, 9]);
    });

    it("범위에 값이 없으면 빈 배열", () => {
      const arr = SortedArray.from([1, 5, 10], numCmp);
      expect(arr.range(6, 9)).toEqual([]);
    });

    it("정확한 경계", () => {
      const arr = SortedArray.from([1, 2, 3, 4, 5], numCmp);
      expect(arr.range(2, 4)).toEqual([2, 3, 4]);
    });
  });

  describe("lowerBound / upperBound", () => {
    const arr = SortedArray.from([1, 2, 2, 3, 5], numCmp);

    it("lowerBound — 이상인 첫 인덱스", () => {
      expect(arr.lowerBound(2)).toBe(1);
      expect(arr.lowerBound(4)).toBe(4);
      expect(arr.lowerBound(0)).toBe(0);
    });

    it("upperBound — 초과인 첫 인덱스", () => {
      expect(arr.upperBound(2)).toBe(3);
      expect(arr.upperBound(3)).toBe(4);
      expect(arr.upperBound(5)).toBe(5);
    });
  });

  describe("rank / select", () => {
    it("rank — 이하 요소 수", () => {
      const arr = SortedArray.from([1, 3, 5, 7, 9], numCmp);
      expect(arr.rank(5)).toBe(3);
      expect(arr.rank(6)).toBe(3);
      expect(arr.rank(0)).toBe(0);
    });

    it("select — k번째 작은 값", () => {
      const arr = SortedArray.from([10, 30, 20, 50, 40], numCmp);
      expect(arr.select(0)).toBe(10);
      expect(arr.select(2)).toBe(30);
      expect(arr.select(4)).toBe(50);
    });
  });

  describe("size / isEmpty / clear", () => {
    it("size", () => {
      const arr = SortedArray.from([1, 2, 3], numCmp);
      expect(arr.size).toBe(3);
    });

    it("isEmpty", () => {
      expect(new SortedArray(numCmp).isEmpty()).toBe(true);
      expect(SortedArray.from([1], numCmp).isEmpty()).toBe(false);
    });

    it("clear", () => {
      const arr = SortedArray.from([1, 2, 3], numCmp);
      arr.clear();
      expect(arr.size).toBe(0);
      expect(arr.toArray()).toEqual([]);
    });
  });

  describe("이터레이터", () => {
    it("for...of / 스프레드", () => {
      const arr = SortedArray.from([3, 1, 2], numCmp);
      expect([...arr]).toEqual([1, 2, 3]);
    });
  });

  describe("객체 정렬", () => {
    it("커스텀 비교로 객체를 정렬한다", () => {
      type User = { name: string; age: number };
      const arr = SortedArray.from<User>(
        [{ name: "C", age: 30 }, { name: "A", age: 10 }, { name: "B", age: 20 }],
        (a, b) => a.age - b.age,
      );
      expect(arr.toArray().map(u => u.name)).toEqual(["A", "B", "C"]);
      expect(arr.min()?.name).toBe("A");
    });
  });
});
