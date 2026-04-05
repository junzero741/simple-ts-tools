import { describe, it, expect } from "vitest";
import { Deque } from "./deque";

describe("Deque", () => {
  describe("pushBack / pushFront", () => {
    it("뒤에 추가한다", () => {
      const dq = new Deque<number>();
      dq.pushBack(1).pushBack(2).pushBack(3);
      expect(dq.toArray()).toEqual([1, 2, 3]);
    });

    it("앞에 추가한다", () => {
      const dq = new Deque<number>();
      dq.pushFront(1).pushFront(2).pushFront(3);
      expect(dq.toArray()).toEqual([3, 2, 1]);
    });

    it("양쪽에 혼합 추가한다", () => {
      const dq = new Deque<number>();
      dq.pushBack(2).pushFront(1).pushBack(3).pushFront(0);
      expect(dq.toArray()).toEqual([0, 1, 2, 3]);
    });
  });

  describe("popFront / popBack", () => {
    it("앞에서 제거한다", () => {
      const dq = Deque.from([1, 2, 3]);
      expect(dq.popFront()).toBe(1);
      expect(dq.toArray()).toEqual([2, 3]);
    });

    it("뒤에서 제거한다", () => {
      const dq = Deque.from([1, 2, 3]);
      expect(dq.popBack()).toBe(3);
      expect(dq.toArray()).toEqual([1, 2]);
    });

    it("빈 deque에서 undefined", () => {
      const dq = new Deque<number>();
      expect(dq.popFront()).toBeUndefined();
      expect(dq.popBack()).toBeUndefined();
    });

    it("하나 남은 요소를 제거한다", () => {
      const dq = Deque.from([42]);
      expect(dq.popFront()).toBe(42);
      expect(dq.isEmpty()).toBe(true);
    });
  });

  describe("peekFront / peekBack", () => {
    it("제거 없이 값을 반환한다", () => {
      const dq = Deque.from([10, 20, 30]);
      expect(dq.peekFront()).toBe(10);
      expect(dq.peekBack()).toBe(30);
      expect(dq.size).toBe(3);
    });

    it("빈 deque에서 undefined", () => {
      const dq = new Deque<number>();
      expect(dq.peekFront()).toBeUndefined();
      expect(dq.peekBack()).toBeUndefined();
    });
  });

  describe("at", () => {
    it("인덱스로 접근한다", () => {
      const dq = Deque.from(["a", "b", "c"]);
      expect(dq.at(0)).toBe("a");
      expect(dq.at(1)).toBe("b");
      expect(dq.at(2)).toBe("c");
    });

    it("범위 밖이면 undefined", () => {
      const dq = Deque.from([1, 2]);
      expect(dq.at(-1)).toBeUndefined();
      expect(dq.at(2)).toBeUndefined();
    });

    it("wrap-around 후에도 정확하다", () => {
      const dq = new Deque<number>();
      // 앞뒤로 교차 추가하여 wrap-around 유발
      for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) dq.pushBack(i);
        else dq.pushFront(i);
      }
      const arr = dq.toArray();
      for (let i = 0; i < dq.size; i++) {
        expect(dq.at(i)).toBe(arr[i]);
      }
    });
  });

  describe("size / isEmpty", () => {
    it("size — 요소 수", () => {
      const dq = new Deque<number>();
      expect(dq.size).toBe(0);
      dq.pushBack(1);
      expect(dq.size).toBe(1);
      dq.popFront();
      expect(dq.size).toBe(0);
    });

    it("isEmpty", () => {
      const dq = new Deque<number>();
      expect(dq.isEmpty()).toBe(true);
      dq.pushBack(1);
      expect(dq.isEmpty()).toBe(false);
    });
  });

  describe("clear", () => {
    it("모든 요소를 제거한다", () => {
      const dq = Deque.from([1, 2, 3]);
      dq.clear();
      expect(dq.isEmpty()).toBe(true);
      expect(dq.toArray()).toEqual([]);
    });
  });

  describe("자동 확장", () => {
    it("용량을 초과하면 자동으로 확장한다", () => {
      const dq = new Deque<number>(4);
      for (let i = 0; i < 100; i++) dq.pushBack(i);
      expect(dq.size).toBe(100);
      expect(dq.at(0)).toBe(0);
      expect(dq.at(99)).toBe(99);
    });

    it("pushFront로 확장해도 순서가 정확하다", () => {
      const dq = new Deque<number>(4);
      for (let i = 0; i < 50; i++) dq.pushFront(i);
      expect(dq.size).toBe(50);
      expect(dq.peekFront()).toBe(49);
      expect(dq.peekBack()).toBe(0);
    });
  });

  describe("이터레이터", () => {
    it("for...of — front → back", () => {
      const result: number[] = [];
      for (const v of Deque.from([1, 2, 3])) result.push(v);
      expect(result).toEqual([1, 2, 3]);
    });

    it("스프레드 연산자", () => {
      expect([...Deque.from([4, 5, 6])]).toEqual([4, 5, 6]);
    });
  });

  describe("reversed", () => {
    it("역순 이터레이터", () => {
      const dq = Deque.from([1, 2, 3]);
      expect([...dq.reversed()]).toEqual([3, 2, 1]);
    });
  });

  describe("from", () => {
    it("배열에서 생성한다", () => {
      expect(Deque.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    });

    it("Set에서 생성한다", () => {
      expect(Deque.from(new Set([1, 2, 3])).size).toBe(3);
    });
  });

  describe("실전: 슬라이딩 윈도우 최대값", () => {
    it("배열의 슬라이딩 윈도우 최대값을 구한다", () => {
      function maxSlidingWindow(nums: number[], k: number): number[] {
        const dq = new Deque<number>();
        const result: number[] = [];
        for (let i = 0; i < nums.length; i++) {
          while (!dq.isEmpty() && dq.peekFront()! < i - k + 1) dq.popFront();
          while (!dq.isEmpty() && nums[dq.peekBack()!] < nums[i]) dq.popBack();
          dq.pushBack(i);
          if (i >= k - 1) result.push(nums[dq.peekFront()!]);
        }
        return result;
      }

      expect(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)).toEqual([3, 3, 5, 5, 6, 7]);
    });
  });
});
