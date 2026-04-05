import { describe, it, expect, vi } from "vitest";
import { createTaskQueue } from "./taskQueue";

describe("createTaskQueue", () => {
  describe("schedule / 실행", () => {
    it("지연 후 태스크를 실행한다", async () => {
      const queue = createTaskQueue();
      const fn = vi.fn();

      queue.schedule("task-1", fn, { delay: 20 });
      expect(fn).not.toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 40));
      expect(fn).toHaveBeenCalledOnce();
    });

    it("async 태스크를 지원한다", async () => {
      const queue = createTaskQueue();
      let done = false;

      queue.schedule("async", async () => {
        await new Promise((r) => setTimeout(r, 5));
        done = true;
      }, { delay: 10 });

      await new Promise((r) => setTimeout(r, 30));
      expect(done).toBe(true);
    });
  });

  describe("cancel", () => {
    it("예약된 태스크를 취소한다", async () => {
      const queue = createTaskQueue();
      const fn = vi.fn();

      queue.schedule("cancelable", fn, { delay: 30 });
      expect(queue.cancel("cancelable")).toBe(true);

      await new Promise((r) => setTimeout(r, 50));
      expect(fn).not.toHaveBeenCalled();
    });

    it("없는 태스크 취소는 false", () => {
      expect(createTaskQueue().cancel("nope")).toBe(false);
    });

    it("같은 ID로 재등록하면 이전 것을 취소한다", async () => {
      const queue = createTaskQueue();
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      queue.schedule("task", fn1, { delay: 50 });
      queue.schedule("task", fn2, { delay: 20 });

      await new Promise((r) => setTimeout(r, 40));
      expect(fn1).not.toHaveBeenCalled();
      expect(fn2).toHaveBeenCalledOnce();
    });
  });

  describe("cancelAll", () => {
    it("모든 예약을 취소한다", async () => {
      const queue = createTaskQueue();
      const fn = vi.fn();

      queue.schedule("a", fn, { delay: 30 });
      queue.schedule("b", fn, { delay: 30 });
      queue.cancelAll();

      await new Promise((r) => setTimeout(r, 50));
      expect(fn).not.toHaveBeenCalled();
      expect(queue.pending).toBe(0);
    });
  });

  describe("has / pending / ids", () => {
    it("예약 상태를 확인한다", () => {
      const queue = createTaskQueue();
      queue.schedule("x", () => {}, { delay: 1000 });

      expect(queue.has("x")).toBe(true);
      expect(queue.has("y")).toBe(false);
      expect(queue.pending).toBe(1);
      expect(queue.ids).toEqual(["x"]);

      queue.cancel("x");
    });
  });

  describe("onComplete", () => {
    it("완료 시 콜백을 실행한다", async () => {
      const queue = createTaskQueue();
      const handler = vi.fn();

      queue.onComplete(handler);
      queue.schedule("t1", () => {}, { delay: 10 });

      await new Promise((r) => setTimeout(r, 30));
      expect(handler).toHaveBeenCalledWith("t1", undefined);
    });

    it("에러 시 에러를 전달한다", async () => {
      const queue = createTaskQueue();
      const handler = vi.fn();

      queue.onComplete(handler);
      queue.schedule("t2", () => { throw new Error("boom"); }, { delay: 10 });

      await new Promise((r) => setTimeout(r, 30));
      expect(handler).toHaveBeenCalledWith("t2", expect.any(Error));
    });

    it("해제 함수로 구독 취소", async () => {
      const queue = createTaskQueue();
      const handler = vi.fn();

      const off = queue.onComplete(handler);
      off();
      queue.schedule("t3", () => {}, { delay: 10 });

      await new Promise((r) => setTimeout(r, 30));
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("concurrency", () => {
    it("동시 실행을 제한한다", async () => {
      const queue = createTaskQueue({ concurrency: 2 });
      let maxConcurrent = 0;
      let concurrent = 0;

      for (let i = 0; i < 5; i++) {
        queue.schedule(`t${i}`, async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 20));
          concurrent--;
        }, { delay: 0 });
      }

      await new Promise((r) => setTimeout(r, 200));
      expect(maxConcurrent).toBe(2);
    });
  });

  describe("실전: 주문 자동 취소", () => {
    it("결제 완료 시 취소 예약을 해제한다", async () => {
      const queue = createTaskQueue();
      let orderCancelled = false;

      // 주문 생성 → 30분 후 자동 취소 예약
      queue.schedule("cancel-order-123", () => {
        orderCancelled = true;
      }, { delay: 50 });

      // 사용자가 결제 완료 → 취소 예약 해제
      queue.cancel("cancel-order-123");

      await new Promise((r) => setTimeout(r, 80));
      expect(orderCancelled).toBe(false);
    });
  });
});
