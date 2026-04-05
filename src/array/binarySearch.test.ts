import { describe, expect, it } from "vitest";
import { binarySearch, sortedIndex, sortedLastIndex } from "./binarySearch";

describe("binarySearch", () => {
  describe("기본 탐색", () => {
    it("존재하는 값의 인덱스를 반환한다", () => {
      expect(binarySearch([1, 3, 5, 7, 9], 5)).toBe(2);
      expect(binarySearch([1, 3, 5, 7, 9], 1)).toBe(0);
      expect(binarySearch([1, 3, 5, 7, 9], 9)).toBe(4);
    });

    it("존재하지 않는 값은 -1을 반환한다", () => {
      expect(binarySearch([1, 3, 5, 7, 9], 4)).toBe(-1);
      expect(binarySearch([1, 3, 5, 7, 9], 0)).toBe(-1);
      expect(binarySearch([1, 3, 5, 7, 9], 10)).toBe(-1);
    });

    it("빈 배열은 -1을 반환한다", () => {
      expect(binarySearch([], 1)).toBe(-1);
    });

    it("단일 원소 배열에서 일치하면 0을 반환한다", () => {
      expect(binarySearch([42], 42)).toBe(0);
    });

    it("단일 원소 배열에서 불일치하면 -1을 반환한다", () => {
      expect(binarySearch([42], 1)).toBe(-1);
    });

    it("문자열 배열에서도 동작한다", () => {
      expect(binarySearch(["a", "b", "c", "d"], "c")).toBe(2);
      expect(binarySearch(["a", "b", "c", "d"], "z")).toBe(-1);
    });
  });

  describe("커스텀 compareFn", () => {
    it("객체 배열에서 속성 기준으로 탐색한다", () => {
      const users = [{ age: 20 }, { age: 25 }, { age: 30 }, { age: 35 }];
      expect(binarySearch(users, { age: 25 }, (a, b) => a.age - b.age)).toBe(1);
      expect(binarySearch(users, { age: 27 }, (a, b) => a.age - b.age)).toBe(-1);
    });

    it("내림차순 정렬 배열에서 반전 compareFn 사용", () => {
      const desc = [9, 7, 5, 3, 1];
      expect(binarySearch(desc, 5, (a, b) => b - a)).toBe(2);
      expect(binarySearch(desc, 4, (a, b) => b - a)).toBe(-1);
    });
  });

  describe("중복 값", () => {
    it("중복 값이 있을 때 그 중 하나의 인덱스를 반환한다", () => {
      const arr = [1, 3, 3, 3, 5];
      const idx = binarySearch(arr, 3);
      expect([1, 2, 3]).toContain(idx);
      expect(arr[idx]).toBe(3);
    });
  });

  describe("큰 배열 성능", () => {
    it("10만 개 원소 배열에서 정확히 탐색한다", () => {
      const n = 100_000;
      const arr = Array.from({ length: n }, (_, i) => i * 2); // 짝수만
      expect(binarySearch(arr, 99_998)).toBe(49_999);
      expect(binarySearch(arr, 99_999)).toBe(-1); // 홀수는 없음
    });
  });
});

describe("sortedIndex", () => {
  describe("삽입 위치 (lower bound)", () => {
    it("중간에 삽입할 위치를 반환한다", () => {
      expect(sortedIndex([1, 3, 5, 7], 4)).toBe(2);
      expect(sortedIndex([1, 3, 5, 7], 6)).toBe(3);
    });

    it("맨 앞 삽입 위치", () => {
      expect(sortedIndex([1, 3, 5, 7], 0)).toBe(0);
    });

    it("맨 뒤 삽입 위치", () => {
      expect(sortedIndex([1, 3, 5, 7], 9)).toBe(4);
    });

    it("기존 값의 왼쪽 경계를 반환한다 (lower bound)", () => {
      expect(sortedIndex([1, 3, 5, 7], 3)).toBe(1);
      expect(sortedIndex([1, 3, 5, 7], 1)).toBe(0);
      expect(sortedIndex([1, 3, 5, 7], 7)).toBe(3);
    });

    it("빈 배열은 0을 반환한다", () => {
      expect(sortedIndex([], 5)).toBe(0);
    });

    it("단일 원소 — 앞에 삽입", () => {
      expect(sortedIndex([5], 3)).toBe(0);
    });

    it("단일 원소 — 뒤에 삽입", () => {
      expect(sortedIndex([5], 7)).toBe(1);
    });
  });

  describe("중복 값의 lower bound", () => {
    it("중복 값이 있을 때 첫 번째 인덱스를 반환한다", () => {
      expect(sortedIndex([1, 3, 3, 3, 5], 3)).toBe(1);
    });

    it("모든 원소가 같을 때 0을 반환한다", () => {
      expect(sortedIndex([5, 5, 5, 5], 5)).toBe(0);
    });
  });

  describe("커스텀 compareFn", () => {
    it("객체 배열에서 속성 기준 삽입 위치를 찾는다", () => {
      const items = [{ v: 1 }, { v: 3 }, { v: 5 }];
      expect(sortedIndex(items, { v: 2 }, (a, b) => a.v - b.v)).toBe(1);
      expect(sortedIndex(items, { v: 4 }, (a, b) => a.v - b.v)).toBe(2);
    });
  });

  describe("정렬 유지 삽입", () => {
    it("splice와 조합해 정렬된 배열에 값을 삽입할 수 있다", () => {
      const sorted = [1, 3, 5, 7, 9];
      const idx = sortedIndex(sorted, 4);
      sorted.splice(idx, 0, 4);
      expect(sorted).toEqual([1, 3, 4, 5, 7, 9]);
    });

    it("여러 값을 삽입해도 정렬이 유지된다", () => {
      const sorted: number[] = [];
      [5, 2, 8, 1, 4, 7, 3, 6].forEach(v => {
        sorted.splice(sortedIndex(sorted, v), 0, v);
      });
      expect(sorted).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });
});

describe("sortedLastIndex", () => {
  describe("삽입 위치 (upper bound)", () => {
    it("중복 값의 오른쪽 경계를 반환한다", () => {
      expect(sortedLastIndex([1, 3, 3, 3, 5], 3)).toBe(4);
    });

    it("단일 값의 바로 다음 위치를 반환한다", () => {
      expect(sortedLastIndex([1, 3, 5, 7], 3)).toBe(2);
    });

    it("존재하지 않는 값의 삽입 위치를 반환한다", () => {
      expect(sortedLastIndex([1, 3, 5, 7], 4)).toBe(2);
    });

    it("맨 앞 삽입", () => {
      expect(sortedLastIndex([1, 3, 5, 7], 0)).toBe(0);
    });

    it("맨 뒤 삽입", () => {
      expect(sortedLastIndex([1, 3, 5, 7], 9)).toBe(4);
    });

    it("모든 원소가 같을 때 arr.length를 반환한다", () => {
      expect(sortedLastIndex([5, 5, 5, 5], 5)).toBe(4);
    });
  });

  describe("sortedIndex + sortedLastIndex로 중복 범위 추출", () => {
    it("중복 값의 슬라이스 범위를 정확히 계산한다", () => {
      const arr = [1, 2, 3, 3, 3, 4, 5];
      const lo = sortedIndex(arr, 3);
      const hi = sortedLastIndex(arr, 3);
      expect(arr.slice(lo, hi)).toEqual([3, 3, 3]);
    });

    it("존재하지 않는 값은 빈 슬라이스를 반환한다", () => {
      const arr = [1, 2, 4, 5];
      const lo = sortedIndex(arr, 3);
      const hi = sortedLastIndex(arr, 3);
      expect(arr.slice(lo, hi)).toEqual([]);
    });
  });

  describe("커스텀 compareFn", () => {
    it("객체 배열에서 오른쪽 경계를 찾는다", () => {
      const items = [{ v: 1 }, { v: 3 }, { v: 3 }, { v: 5 }];
      const lo = sortedIndex(items, { v: 3 }, (a, b) => a.v - b.v);
      const hi = sortedLastIndex(items, { v: 3 }, (a, b) => a.v - b.v);
      expect(hi - lo).toBe(2); // 3이 2개
    });
  });
});
