import { describe, it, expect } from "vitest";
import { createBulkhead } from "./bulkhead";

describe("createBulkhead", () => {
  describe("기본 실행", () => {
    it("파티션에서 함수를 실행한다", async () => {
      const bh = createBulkhead({ main: { maxConcurrent: 5 } });
      const result = await bh.run("main", () => 42);
      expect(result).toBe(42);
    });

    it("async 함수 지원", async () => {
      const bh = createBulkhead({ main: { maxConcurrent: 5 } });
      const result = await bh.run("main", async () => {
        await new Promise((r) => setTimeout(r, 5));
        return "ok";
      });
      expect(result).toBe("ok");
    });

    it("미등록 파티션은 에러", () => {
      const bh = createBulkhead({ main: { maxConcurrent: 5 } });
      expect(() => bh.run("unknown", () => 1)).toThrow("not found");
    });
  });

  describe("동시성 격리", () => {
    it("파티션별 독립적으로 동시성을 제한한다", async () => {
      let criticalMax = 0, batchMax = 0;
      let criticalCurrent = 0, batchCurrent = 0;

      const bh = createBulkhead({
        critical: { maxConcurrent: 3 },
        batch: { maxConcurrent: 2 },
      });

      const work = (partition: string, counter: { get: () => number; inc: () => void; dec: () => void; max: () => number }) =>
        bh.run(partition, async () => {
          counter.inc();
          await new Promise((r) => setTimeout(r, 20));
          counter.dec();
        });

      const criticalCounter = {
        get: () => criticalCurrent,
        inc: () => { criticalCurrent++; criticalMax = Math.max(criticalMax, criticalCurrent); },
        dec: () => { criticalCurrent--; },
        max: () => criticalMax,
      };

      const batchCounter = {
        get: () => batchCurrent,
        inc: () => { batchCurrent++; batchMax = Math.max(batchMax, batchCurrent); },
        dec: () => { batchCurrent--; },
        max: () => batchMax,
      };

      const tasks = [
        ...Array.from({ length: 6 }, () => work("critical", criticalCounter)),
        ...Array.from({ length: 4 }, () => work("batch", batchCounter)),
      ];

      await Promise.all(tasks);

      expect(criticalMax).toBe(3);
      expect(batchMax).toBe(2);
    });
  });

  describe("maxQueue", () => {
    it("큐 초과 시 즉시 reject", async () => {
      const bh = createBulkhead({
        small: { maxConcurrent: 1, maxQueue: 1 },
      });

      // 1개 실행 중 + 1개 대기 = maxQueue 도달
      const slow = bh.run("small", () => new Promise((r) => setTimeout(r, 100)));
      const queued = bh.run("small", () => "queued");
      const rejected = bh.run("small", () => "rejected");

      await expect(rejected).rejects.toThrow("queue is full");

      await slow;
      expect(await queued).toBe("queued");
    });

    it("totalRejected를 추적한다", async () => {
      const bh = createBulkhead({ x: { maxConcurrent: 1, maxQueue: 0 } });

      bh.run("x", () => new Promise((r) => setTimeout(r, 50)));
      await bh.run("x", () => {}).catch(() => {});

      expect(bh.stats("x").totalRejected).toBe(1);
    });
  });

  describe("queueTimeout", () => {
    it("대기 타임아웃 시 reject", async () => {
      const bh = createBulkhead({
        x: { maxConcurrent: 1, queueTimeout: 30 },
      });

      bh.run("x", () => new Promise((r) => setTimeout(r, 200)));
      await expect(bh.run("x", () => "late")).rejects.toThrow("queue timeout");
    });
  });

  describe("stats", () => {
    it("파티션별 통계를 반환한다", async () => {
      const bh = createBulkhead({ main: { maxConcurrent: 5 } });

      await bh.run("main", () => 1);
      await bh.run("main", () => 2);

      const s = bh.stats("main");
      expect(s.totalExecuted).toBe(2);
      expect(s.active).toBe(0);
      expect(s.queued).toBe(0);
    });

    it("에러도 totalExecuted에 포함", async () => {
      const bh = createBulkhead({ main: { maxConcurrent: 5 } });
      await bh.run("main", () => { throw new Error("x"); }).catch(() => {});

      expect(bh.stats("main").totalExecuted).toBe(1);
    });
  });

  describe("allStats", () => {
    it("전체 파티션 통계 맵", async () => {
      const bh = createBulkhead({
        a: { maxConcurrent: 5 },
        b: { maxConcurrent: 3 },
      });

      await bh.run("a", () => 1);
      const all = bh.allStats();

      expect(Object.keys(all)).toEqual(["a", "b"]);
      expect(all.a.totalExecuted).toBe(1);
      expect(all.b.totalExecuted).toBe(0);
    });
  });

  describe("partitions", () => {
    it("등록된 파티션 이름", () => {
      const bh = createBulkhead({
        critical: { maxConcurrent: 10 },
        batch: { maxConcurrent: 5 },
      });
      expect(bh.partitions.sort()).toEqual(["batch", "critical"]);
    });
  });

  describe("실전: API 게이트웨이 격리", () => {
    it("결제 API 장애가 검색에 영향 안 줌", async () => {
      const bh = createBulkhead({
        payment: { maxConcurrent: 2, maxQueue: 2 },
        search: { maxConcurrent: 10 },
      });

      // payment가 모두 차도
      const paymentTasks = Array.from({ length: 4 }, () =>
        bh.run("payment", () => new Promise((r) => setTimeout(r, 100))),
      );

      // search는 정상 동작
      const searchResult = await bh.run("search", () => "results");
      expect(searchResult).toBe("results");

      await Promise.allSettled(paymentTasks);
    });
  });
});
