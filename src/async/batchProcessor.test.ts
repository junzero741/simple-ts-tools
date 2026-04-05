import { describe, it, expect, vi } from "vitest";
import { batchProcess } from "./batchProcessor";

describe("batchProcess", () => {
  describe("기본 실행", () => {
    it("모든 아이템을 처리한다", async () => {
      const result = await batchProcess([1, 2, 3, 4, 5], {
        handler: (n) => n * 10,
      });

      expect(result.succeeded).toBe(5);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(5);
      expect(result.results.map((r) => r.result).sort()).toEqual([10, 20, 30, 40, 50]);
    });

    it("async 핸들러를 지원한다", async () => {
      const result = await batchProcess(["a", "b"], {
        handler: async (s) => {
          await new Promise((r) => setTimeout(r, 5));
          return s.toUpperCase();
        },
      });

      expect(result.results.map((r) => r.result).sort()).toEqual(["A", "B"]);
    });

    it("빈 배열이면 빈 결과", async () => {
      const result = await batchProcess([], { handler: () => {} });

      expect(result.succeeded).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe("동시성 제한", () => {
    it("concurrency를 초과하지 않는다", async () => {
      let maxConcurrent = 0;
      let concurrent = 0;

      await batchProcess(Array.from({ length: 20 }, (_, i) => i), {
        handler: async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((r) => setTimeout(r, 10));
          concurrent--;
        },
        concurrency: 3,
      });

      expect(maxConcurrent).toBe(3);
    });
  });

  describe("에러 처리", () => {
    it("collect — 에러를 수집하고 계속 진행한다", async () => {
      const result = await batchProcess([1, 2, 3, 4, 5], {
        handler: (n) => {
          if (n === 3) throw new Error("fail at 3");
          return n * 10;
        },
        onError: "collect",
      });

      expect(result.succeeded).toBe(4);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].item).toBe(3);
      expect((result.errors[0].error as Error).message).toBe("fail at 3");
    });

    it("throw — 첫 에러에서 중단한다", async () => {
      await expect(
        batchProcess([1, 2, 3], {
          handler: (n) => {
            if (n === 2) throw new Error("stop");
            return n;
          },
          onError: "throw",
          concurrency: 1,
        }),
      ).rejects.toThrow("stop");
    });
  });

  describe("onProgress", () => {
    it("진행률 콜백을 실행한다", async () => {
      const progresses: number[] = [];

      await batchProcess([1, 2, 3, 4], {
        handler: (n) => n,
        concurrency: 1,
        onProgress: ({ percent }) => progresses.push(percent),
      });

      expect(progresses).toEqual([25, 50, 75, 100]);
    });

    it("에러도 진행률에 포함한다", async () => {
      const progresses: number[] = [];

      await batchProcess([1, 2], {
        handler: (n) => { if (n === 1) throw new Error("x"); return n; },
        concurrency: 1,
        onProgress: ({ percent }) => progresses.push(percent),
      });

      expect(progresses).toEqual([50, 100]);
    });
  });

  describe("signal (취소)", () => {
    it("abort 시 남은 아이템을 건너뛴다", async () => {
      const controller = new AbortController();
      let processed = 0;

      const result = await batchProcess(Array.from({ length: 100 }, (_, i) => i), {
        handler: async () => {
          processed++;
          await new Promise((r) => setTimeout(r, 5));
          if (processed >= 3) controller.abort();
        },
        concurrency: 1,
        signal: controller.signal,
      });

      expect(result.succeeded).toBeLessThan(100);
    });
  });

  describe("elapsed", () => {
    it("소요 시간을 반환한다", async () => {
      const result = await batchProcess([1], {
        handler: async () => {
          await new Promise((r) => setTimeout(r, 20));
          return 1;
        },
      });

      expect(result.elapsed).toBeGreaterThanOrEqual(15);
    });
  });

  describe("결과 인덱스", () => {
    it("각 결과에 원본 인덱스가 포함된다", async () => {
      const result = await batchProcess(["a", "b", "c"], {
        handler: (s) => s.toUpperCase(),
        concurrency: 1,
      });

      expect(result.results.map((r) => r.index)).toEqual([0, 1, 2]);
    });
  });
});
