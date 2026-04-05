import { describe, expect, it } from "vitest";
import { rotate } from "./rotate";

describe("rotate", () => {
  describe("왼쪽 회전 (양수 n)", () => {
    it("n=1: 첫 요소를 끝으로 이동", () => {
      expect(rotate([1, 2, 3, 4, 5], 1)).toEqual([2, 3, 4, 5, 1]);
    });

    it("n=2: 두 칸 왼쪽으로 이동", () => {
      expect(rotate([1, 2, 3, 4, 5], 2)).toEqual([3, 4, 5, 1, 2]);
    });

    it("n=배열길이이면 원본과 동일하다", () => {
      expect(rotate([1, 2, 3], 3)).toEqual([1, 2, 3]);
    });

    it("n > 배열길이이면 n % length로 정규화된다", () => {
      expect(rotate([1, 2, 3, 4, 5], 7)).toEqual([3, 4, 5, 1, 2]); // 7 % 5 = 2
    });
  });

  describe("오른쪽 회전 (음수 n)", () => {
    it("n=-1: 마지막 요소를 앞으로 이동", () => {
      expect(rotate([1, 2, 3, 4, 5], -1)).toEqual([5, 1, 2, 3, 4]);
    });

    it("n=-2: 두 칸 오른쪽으로 이동", () => {
      expect(rotate([1, 2, 3, 4, 5], -2)).toEqual([4, 5, 1, 2, 3]);
    });

    it("rotate(arr, n) === rotate(arr, -(length - n))", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(rotate(arr, 2)).toEqual(rotate(arr, -(arr.length - 2)));
    });
  });

  describe("경계 케이스", () => {
    it("n=0이면 원본과 동일하다", () => {
      expect(rotate([1, 2, 3], 0)).toEqual([1, 2, 3]);
    });

    it("빈 배열은 빈 배열을 반환한다", () => {
      expect(rotate([], 3)).toEqual([]);
    });

    it("요소가 하나이면 항상 그대로", () => {
      expect(rotate([42], 5)).toEqual([42]);
      expect(rotate([42], -3)).toEqual([42]);
    });

    it("원본 배열을 변경하지 않는다", () => {
      const arr = [1, 2, 3, 4, 5];
      rotate(arr, 2);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    it("큰 n 값도 정규화된다", () => {
      expect(rotate([1, 2, 3], 100)).toEqual(rotate([1, 2, 3], 100 % 3));
    });
  });

  describe("실사용 시나리오", () => {
    it("캐러셀 — 다음 슬라이드 (첫 슬라이드를 끝으로 이동)", () => {
      const slides = ["A", "B", "C", "D"];
      expect(rotate(slides, 1)).toEqual(["B", "C", "D", "A"]);
    });

    it("캐러셀 — 이전 슬라이드 (마지막 슬라이드를 앞으로 이동)", () => {
      const slides = ["A", "B", "C", "D"];
      expect(rotate(slides, -1)).toEqual(["D", "A", "B", "C"]);
    });

    it("라운드로빈 담당자 배정 — 다음 순서", () => {
      const workers = ["Alice", "Bob", "Charlie"];
      // Alice가 끝났으면 Bob 차례
      const nextRound = rotate(workers, 1);
      expect(nextRound[0]).toBe("Bob");
    });

    it("격자 열 이동 — 첫 열을 끝으로", () => {
      const columns = ["id", "name", "email", "role"];
      expect(rotate(columns, 1)).toEqual(["name", "email", "role", "id"]);
    });

    it("문자열 배열에 사용할 수 있다", () => {
      expect(rotate(["a", "b", "c"], 2)).toEqual(["c", "a", "b"]);
    });
  });
});
