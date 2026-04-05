import { describe, it, expect } from "vitest";
import { LinkedList } from "./linkedList";

describe("LinkedList", () => {
  describe("pushBack / pushFront", () => {
    it("뒤에 추가한다", () => {
      const list = new LinkedList<number>();
      list.pushBack(1);
      list.pushBack(2);
      list.pushBack(3);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    it("앞에 추가한다", () => {
      const list = new LinkedList<number>();
      list.pushFront(1);
      list.pushFront(2);
      list.pushFront(3);
      expect(list.toArray()).toEqual([3, 2, 1]);
    });

    it("size가 증가한다", () => {
      const list = new LinkedList<number>();
      expect(list.size).toBe(0);
      list.pushBack(1);
      expect(list.size).toBe(1);
    });
  });

  describe("popFront / popBack", () => {
    it("앞에서 제거한다", () => {
      const list = LinkedList.from([1, 2, 3]);
      expect(list.popFront()).toBe(1);
      expect(list.toArray()).toEqual([2, 3]);
    });

    it("뒤에서 제거한다", () => {
      const list = LinkedList.from([1, 2, 3]);
      expect(list.popBack()).toBe(3);
      expect(list.toArray()).toEqual([1, 2]);
    });

    it("빈 리스트에서 undefined", () => {
      const list = new LinkedList<number>();
      expect(list.popFront()).toBeUndefined();
      expect(list.popBack()).toBeUndefined();
    });

    it("하나 남은 요소를 제거한다", () => {
      const list = LinkedList.from([42]);
      expect(list.popFront()).toBe(42);
      expect(list.isEmpty()).toBe(true);
      expect(list.peekFront()).toBeUndefined();
      expect(list.peekBack()).toBeUndefined();
    });
  });

  describe("peekFront / peekBack", () => {
    it("제거하지 않고 값을 반환한다", () => {
      const list = LinkedList.from([1, 2, 3]);
      expect(list.peekFront()).toBe(1);
      expect(list.peekBack()).toBe(3);
      expect(list.size).toBe(3);
    });
  });

  describe("remove", () => {
    it("노드를 O(1)로 제거한다", () => {
      const list = new LinkedList<number>();
      list.pushBack(1);
      const node = list.pushBack(2);
      list.pushBack(3);

      list.remove(node);
      expect(list.toArray()).toEqual([1, 3]);
      expect(list.size).toBe(2);
    });

    it("head를 제거한다", () => {
      const list = new LinkedList<number>();
      const head = list.pushBack(1);
      list.pushBack(2);
      list.remove(head);
      expect(list.toArray()).toEqual([2]);
    });

    it("tail을 제거한다", () => {
      const list = new LinkedList<number>();
      list.pushBack(1);
      const tail = list.pushBack(2);
      list.remove(tail);
      expect(list.toArray()).toEqual([1]);
    });
  });

  describe("insertBefore / insertAfter", () => {
    it("노드 앞에 삽입한다", () => {
      const list = new LinkedList<number>();
      list.pushBack(1);
      const node = list.pushBack(3);

      list.insertBefore(node, 2);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    it("head 앞에 삽입한다", () => {
      const list = LinkedList.from([2, 3]);
      const head = list.findNode((v) => v === 2)!;
      list.insertBefore(head, 1);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    it("노드 뒤에 삽입한다", () => {
      const list = new LinkedList<number>();
      const node = list.pushBack(1);
      list.pushBack(3);

      list.insertAfter(node, 2);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });

    it("tail 뒤에 삽입한다", () => {
      const list = LinkedList.from([1, 2]);
      const tail = list.findNode((v) => v === 2)!;
      list.insertAfter(tail, 3);
      expect(list.toArray()).toEqual([1, 2, 3]);
    });
  });

  describe("findNode", () => {
    it("조건에 맞는 노드를 찾는다", () => {
      const list = LinkedList.from([10, 20, 30]);
      const node = list.findNode((v) => v === 20);
      expect(node?.value).toBe(20);
    });

    it("없으면 undefined", () => {
      const list = LinkedList.from([1, 2]);
      expect(list.findNode((v) => v === 99)).toBeUndefined();
    });
  });

  describe("reverse", () => {
    it("리스트를 뒤집는다", () => {
      const list = LinkedList.from([1, 2, 3, 4]);
      list.reverse();
      expect(list.toArray()).toEqual([4, 3, 2, 1]);
      expect(list.peekFront()).toBe(4);
      expect(list.peekBack()).toBe(1);
    });

    it("빈 리스트를 뒤집어도 안전하다", () => {
      const list = new LinkedList<number>();
      list.reverse();
      expect(list.toArray()).toEqual([]);
    });
  });

  describe("clear", () => {
    it("모든 요소를 제거한다", () => {
      const list = LinkedList.from([1, 2, 3]);
      list.clear();
      expect(list.isEmpty()).toBe(true);
      expect(list.size).toBe(0);
    });
  });

  describe("toArrayReverse", () => {
    it("역순 배열을 반환한다", () => {
      expect(LinkedList.from([1, 2, 3]).toArrayReverse()).toEqual([3, 2, 1]);
    });
  });

  describe("이터레이터", () => {
    it("for...of로 순회한다", () => {
      const result: number[] = [];
      for (const v of LinkedList.from([1, 2, 3])) result.push(v);
      expect(result).toEqual([1, 2, 3]);
    });

    it("스프레드 연산자", () => {
      expect([...LinkedList.from([4, 5])]).toEqual([4, 5]);
    });
  });

  describe("from", () => {
    it("배열에서 생성한다", () => {
      expect(LinkedList.from([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    });

    it("Set에서 생성한다", () => {
      expect(LinkedList.from(new Set([1, 2, 3])).size).toBe(3);
    });
  });
});
