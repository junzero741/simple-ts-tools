import { describe, it, expect } from "vitest";
import { createPriorityScheduler } from "./priorityScheduler";

describe("createPriorityScheduler", () => {
  describe("기본 실행", () => {
    it("태스크를 실행하고 결과를 반환한다", async () => {
      const s = createPriorityScheduler();
      const job = s.schedule(() => 42);
      expect(await job.promise).toBe(42);
    });

    it("async 태스크를 지원한다", async () => {
      const s = createPriorityScheduler();
      const job = s.schedule(async () => {
        await new Promise((r) => setTimeout(r, 5));
        return "done";
      });
      expect(await job.promise).toBe("done");
    });
  });

  describe("우선순위", () => {
    it("높은 우선순위가 먼저 실행된다", async () => {
      const order: string[] = [];
      const s = createPriorityScheduler({ concurrency: 1 });

      // 첫 태스크가 실행 중일 때 나머지가 큐에 쌓임
      const blocker = s.schedule(async () => {
        await new Promise((r) => setTimeout(r, 20));
        order.push("blocker");
      });

      s.schedule(async () => { order.push("low"); }, { priority: 1 });
      s.schedule(async () => { order.push("high"); }, { priority: 10 });
      s.schedule(async () => { order.push("mid"); }, { priority: 5 });

      await s.drain();
      // blocker 먼저, 그 후 high > mid > low
      expect(order).toEqual(["blocker", "high", "mid", "low"]);
    });
  });

  describe("동시성 제한", () => {
    it("concurrency를 초과하지 않는다", async () => {
      const s = createPriorityScheduler({ concurrency: 2 });
      let maxConcurrent = 0;
      let concurrent = 0;

      const tasks = Array.from({ length: 6 }, () =>
        s.schedule(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 10));
          concurrent--;
        }),
      );

      await s.drain();
      expect(maxConcurrent).toBe(2);
    });
  });

  describe("취소", () => {
    it("cancel로 태스크를 취소한다", async () => {
      const s = createPriorityScheduler({ concurrency: 1 });

      // blocker로 큐를 막기
      s.schedule(() => new Promise((r) => setTimeout(r, 50)));

      const job = s.schedule(() => "should not run");
      job.cancel("no longer needed");

      await expect(job.promise).rejects.toBe("no longer needed");
    });

    it("외부 AbortSignal로 취소한다", async () => {
      const s = createPriorityScheduler({ concurrency: 1 });

      s.schedule(() => new Promise((r) => setTimeout(r, 50)));

      const controller = new AbortController();
      const job = s.schedule(() => "x", { signal: controller.signal });
      controller.abort("external abort");

      await expect(job.promise).rejects.toBe("external abort");
    });
  });

  describe("재시도", () => {
    it("실패 시 재시도한다", async () => {
      const s = createPriorityScheduler();
      let attempts = 0;

      const job = s.schedule(
        () => {
          attempts++;
          if (attempts < 3) throw new Error("fail");
          return "success";
        },
        { retries: 3, retryDelay: 5 },
      );

      expect(await job.promise).toBe("success");
      expect(attempts).toBe(3);
    });

    it("재시도 초과 시 에러를 반환한다", async () => {
      const s = createPriorityScheduler();

      const job = s.schedule(
        () => { throw new Error("always fail"); },
        { retries: 2, retryDelay: 5 },
      );

      await expect(job.promise).rejects.toThrow("always fail");
    });
  });

  describe("pause / resume", () => {
    it("pause 시 새 태스크를 시작하지 않는다", async () => {
      const s = createPriorityScheduler({ concurrency: 1 });
      const order: string[] = [];

      s.schedule(() => { order.push("first"); });
      await s.drain();

      s.pause();
      s.schedule(() => { order.push("second"); });

      await new Promise((r) => setTimeout(r, 20));
      expect(order).toEqual(["first"]);
      expect(s.pending).toBe(1);

      s.resume();
      await s.drain();
      expect(order).toEqual(["first", "second"]);
    });
  });

  describe("drain", () => {
    it("모든 태스크 완료를 대기한다", async () => {
      const s = createPriorityScheduler({ concurrency: 2 });
      const results: number[] = [];

      for (let i = 0; i < 5; i++) {
        s.schedule(async () => {
          await new Promise((r) => setTimeout(r, 10));
          results.push(i);
        });
      }

      await s.drain();
      expect(results.length).toBe(5);
    });

    it("빈 스케줄러는 즉시 resolve", async () => {
      const s = createPriorityScheduler();
      await expect(s.drain()).resolves.toBeUndefined();
    });
  });

  describe("통계", () => {
    it("pending / running", async () => {
      const s = createPriorityScheduler({ concurrency: 1 });

      s.schedule(() => new Promise((r) => setTimeout(r, 50)));
      s.schedule(() => "queued");

      await new Promise((r) => setTimeout(r, 5));
      expect(s.running).toBe(1);
      expect(s.pending).toBe(1);

      await s.drain();
      expect(s.running).toBe(0);
      expect(s.pending).toBe(0);
    });
  });
});
