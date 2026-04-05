import { describe, it, expect } from "vitest";
import { createClock } from "./clock";

describe("createClock", () => {
  describe("now", () => {
    it("초기 시각은 0이다", () => {
      expect(createClock().now()).toBe(0);
    });

    it("시작 시각을 지정할 수 있다", () => {
      expect(createClock(1000).now()).toBe(1000);
    });

    it("tick 후 시각이 전진한다", () => {
      const clock = createClock();
      clock.tick(500);
      expect(clock.now()).toBe(500);
    });
  });

  describe("setTimeout / clearTimeout", () => {
    it("지정 시간 후 콜백을 실행한다", () => {
      const clock = createClock();
      let called = false;

      clock.setTimeout(() => { called = true; }, 100);

      clock.tick(99);
      expect(called).toBe(false);

      clock.tick(1);
      expect(called).toBe(true);
    });

    it("한 번만 실행된다", () => {
      const clock = createClock();
      let count = 0;

      clock.setTimeout(() => { count++; }, 100);

      clock.tick(100);
      clock.tick(100);
      expect(count).toBe(1);
    });

    it("clearTimeout으로 취소한다", () => {
      const clock = createClock();
      let called = false;

      const id = clock.setTimeout(() => { called = true; }, 100);
      clock.clearTimeout(id);
      clock.tick(200);

      expect(called).toBe(false);
    });

    it("여러 타이머가 순서대로 실행된다", () => {
      const clock = createClock();
      const order: number[] = [];

      clock.setTimeout(() => order.push(2), 200);
      clock.setTimeout(() => order.push(1), 100);
      clock.setTimeout(() => order.push(3), 300);

      clock.tick(300);
      expect(order).toEqual([1, 2, 3]);
    });

    it("같은 시각의 타이머도 실행된다", () => {
      const clock = createClock();
      const order: string[] = [];

      clock.setTimeout(() => order.push("a"), 100);
      clock.setTimeout(() => order.push("b"), 100);

      clock.tick(100);
      expect(order).toEqual(["a", "b"]);
    });
  });

  describe("setInterval / clearInterval", () => {
    it("반복 실행한다", () => {
      const clock = createClock();
      const values: number[] = [];

      clock.setInterval(() => values.push(clock.now()), 100);

      clock.tick(350);
      expect(values).toEqual([100, 200, 300]);
    });

    it("clearInterval로 중지한다", () => {
      const clock = createClock();
      let count = 0;

      const id = clock.setInterval(() => { count++; }, 50);

      clock.tick(120);
      clock.clearInterval(id);
      clock.tick(200);

      expect(count).toBe(2);
    });
  });

  describe("sleep", () => {
    it("tick으로 전진시키면 resolve된다", async () => {
      const clock = createClock();
      let resolved = false;

      const p = clock.sleep(500).then(() => { resolved = true; });

      clock.tick(499);
      await Promise.resolve(); // microtask flush
      expect(resolved).toBe(false);

      clock.tick(1);
      await p;
      expect(resolved).toBe(true);
    });

    it("여러 sleep을 동시에 사용한다", async () => {
      const clock = createClock();
      const order: number[] = [];

      const p1 = clock.sleep(100).then(() => order.push(1));
      const p2 = clock.sleep(200).then(() => order.push(2));

      clock.tick(200);
      await Promise.all([p1, p2]);

      expect(order).toEqual([1, 2]);
    });
  });

  describe("reset", () => {
    it("모든 타이머를 제거한다", () => {
      const clock = createClock();
      clock.setTimeout(() => {}, 100);
      clock.setInterval(() => {}, 50);

      clock.reset();
      expect(clock.pendingTimers).toBe(0);
    });
  });

  describe("pendingTimers", () => {
    it("예약된 타이머 수를 반환한다", () => {
      const clock = createClock();
      clock.setTimeout(() => {}, 100);
      clock.setTimeout(() => {}, 200);
      expect(clock.pendingTimers).toBe(2);

      clock.tick(100);
      expect(clock.pendingTimers).toBe(1);
    });

    it("취소된 타이머는 포함하지 않는다", () => {
      const clock = createClock();
      const id = clock.setTimeout(() => {}, 100);
      clock.clearTimeout(id);
      expect(clock.pendingTimers).toBe(0);
    });
  });

  describe("복합 시나리오", () => {
    it("setTimeout과 setInterval이 함께 동작한다", () => {
      const clock = createClock();
      const log: string[] = [];

      clock.setInterval(() => log.push("interval"), 100);
      clock.setTimeout(() => log.push("timeout"), 150);

      clock.tick(250);
      expect(log).toEqual(["interval", "timeout", "interval"]);
    });
  });
});
