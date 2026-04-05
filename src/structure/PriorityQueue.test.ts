import { describe, expect, it } from "vitest";
import { PriorityQueue } from "./PriorityQueue";

describe("PriorityQueue", () => {
  describe("기본 동작", () => {
    it("초기에는 비어있다", () => {
      const pq = new PriorityQueue<number>();
      expect(pq.isEmpty).toBe(true);
      expect(pq.size).toBe(0);
    });

    it("enqueue 후 size가 증가한다", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("a", 1);
      pq.enqueue("b", 2);
      expect(pq.size).toBe(2);
      expect(pq.isEmpty).toBe(false);
    });

    it("우선순위가 낮은 항목(숫자가 작은)이 먼저 나온다", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("low", 10);
      pq.enqueue("high", 1);
      pq.enqueue("mid", 5);

      expect(pq.dequeue()).toBe("high");   // priority 1
      expect(pq.dequeue()).toBe("mid");    // priority 5
      expect(pq.dequeue()).toBe("low");    // priority 10
    });

    it("삽입 순서에 무관하게 우선순위 순으로 꺼낸다", () => {
      const pq = new PriorityQueue<number>();
      [5, 3, 8, 1, 4, 2, 7, 6].forEach(n => pq.enqueue(n, n));

      const result: number[] = [];
      while (!pq.isEmpty) result.push(pq.dequeue()!);
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe("peek", () => {
    it("peek은 꺼내지 않고 다음 값을 반환한다", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("b", 2);
      pq.enqueue("a", 1);

      expect(pq.peek()).toBe("a");
      expect(pq.size).toBe(2); // size 불변
      expect(pq.dequeue()).toBe("a");
    });

    it("빈 큐에서 peek은 undefined를 반환한다", () => {
      const pq = new PriorityQueue<number>();
      expect(pq.peek()).toBeUndefined();
    });
  });

  describe("dequeue", () => {
    it("빈 큐에서 dequeue는 undefined를 반환한다", () => {
      const pq = new PriorityQueue<number>();
      expect(pq.dequeue()).toBeUndefined();
    });

    it("dequeue 후 size가 감소한다", () => {
      const pq = new PriorityQueue<number>();
      pq.enqueue(1, 1);
      pq.enqueue(2, 2);
      pq.dequeue();
      expect(pq.size).toBe(1);
    });

    it("마지막 요소를 dequeue하면 isEmpty가 true가 된다", () => {
      const pq = new PriorityQueue<number>();
      pq.enqueue(1, 1);
      pq.dequeue();
      expect(pq.isEmpty).toBe(true);
    });
  });

  describe("동일 우선순위 FIFO", () => {
    it("같은 priority는 enqueue 순서대로 dequeue된다", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("first", 5);
      pq.enqueue("second", 5);
      pq.enqueue("third", 5);

      expect(pq.dequeue()).toBe("first");
      expect(pq.dequeue()).toBe("second");
      expect(pq.dequeue()).toBe("third");
    });
  });

  describe("toArray", () => {
    it("우선순위 순서로 배열을 반환한다 (비파괴)", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("c", 3);
      pq.enqueue("a", 1);
      pq.enqueue("b", 2);

      expect(pq.toArray()).toEqual(["a", "b", "c"]);
      expect(pq.size).toBe(3); // 큐 상태 유지
    });
  });

  describe("실사용 시나리오", () => {
    it("작업 스케줄러 — 긴급도 기반 처리 순서", () => {
      const pq = new PriorityQueue<{ id: string; urgency: number }>();
      pq.enqueue({ id: "task-C", urgency: 3 }, 3);
      pq.enqueue({ id: "task-A", urgency: 1 }, 1);
      pq.enqueue({ id: "task-B", urgency: 2 }, 2);

      const order = [];
      while (!pq.isEmpty) order.push(pq.dequeue()!.id);
      expect(order).toEqual(["task-A", "task-B", "task-C"]);
    });

    it("다익스트라 스타일 거리 최소화", () => {
      const pq = new PriorityQueue<string>();
      pq.enqueue("node-D", 10);
      pq.enqueue("node-B", 3);
      pq.enqueue("node-A", 1);
      pq.enqueue("node-C", 7);

      expect(pq.dequeue()).toBe("node-A");
      expect(pq.dequeue()).toBe("node-B");
      expect(pq.dequeue()).toBe("node-C");
      expect(pq.dequeue()).toBe("node-D");
    });
  });
});
