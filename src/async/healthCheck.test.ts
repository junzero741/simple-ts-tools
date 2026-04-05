import { describe, it, expect } from "vitest";
import { createHealthCheck } from "./healthCheck";

describe("createHealthCheck", () => {
  describe("register / names", () => {
    it("체크를 등록한다", () => {
      const hc = createHealthCheck()
        .register("db", () => {})
        .register("redis", () => {});

      expect(hc.names).toEqual(["db", "redis"]);
    });
  });

  describe("check — 전체 리포트", () => {
    it("모두 성공이면 healthy", async () => {
      const hc = createHealthCheck()
        .register("db", () => {})
        .register("cache", async () => {});

      const report = await hc.check();
      expect(report.status).toBe("healthy");
      expect(report.checks.db.status).toBe("up");
      expect(report.checks.cache.status).toBe("up");
      expect(report.totalLatency).toBeGreaterThanOrEqual(0);
    });

    it("critical 체크 실패 시 unhealthy", async () => {
      const hc = createHealthCheck()
        .register("db", () => { throw new Error("connection refused"); }, { critical: true })
        .register("cache", () => {});

      const report = await hc.check();
      expect(report.status).toBe("unhealthy");
      expect(report.checks.db.status).toBe("down");
      expect(report.checks.db.error).toBe("connection refused");
      expect(report.checks.cache.status).toBe("up");
    });

    it("non-critical 체크 실패 시 degraded", async () => {
      const hc = createHealthCheck()
        .register("db", () => {}, { critical: true })
        .register("metrics", () => { throw new Error("unavailable"); }, { critical: false });

      const report = await hc.check();
      expect(report.status).toBe("degraded");
    });

    it("latency를 측정한다", async () => {
      const hc = createHealthCheck()
        .register("slow", async () => {
          await new Promise((r) => setTimeout(r, 20));
        });

      const report = await hc.check();
      expect(report.checks.slow.latency).toBeGreaterThanOrEqual(15);
    });

    it("timestamp를 포함한다", async () => {
      const hc = createHealthCheck().register("x", () => {});
      const report = await hc.check();

      expect(report.timestamp).toBeGreaterThan(0);
      expect(report.checks.x.timestamp).toBeGreaterThan(0);
    });
  });

  describe("timeout", () => {
    it("타임아웃 초과 시 down", async () => {
      const hc = createHealthCheck()
        .register("slow", () => new Promise((r) => setTimeout(r, 200)), {
          timeout: 30,
        });

      const report = await hc.check();
      expect(report.checks.slow.status).toBe("down");
      expect(report.checks.slow.error).toContain("timed out");
    });
  });

  describe("checkOne", () => {
    it("특정 체크만 실행한다", async () => {
      const hc = createHealthCheck()
        .register("db", () => {})
        .register("redis", () => { throw new Error("fail"); });

      const dbResult = await hc.checkOne("db");
      expect(dbResult.status).toBe("up");

      const redisResult = await hc.checkOne("redis");
      expect(redisResult.status).toBe("down");
    });

    it("미등록 체크는 에러", async () => {
      const hc = createHealthCheck();
      await expect(hc.checkOne("missing")).rejects.toThrow("not found");
    });
  });

  describe("isHealthy", () => {
    it("healthy이면 true", async () => {
      const hc = createHealthCheck().register("db", () => {});
      expect(await hc.isHealthy()).toBe(true);
    });

    it("unhealthy이면 false", async () => {
      const hc = createHealthCheck()
        .register("db", () => { throw new Error("down"); });
      expect(await hc.isHealthy()).toBe(false);
    });

    it("degraded이면 false", async () => {
      const hc = createHealthCheck()
        .register("optional", () => { throw new Error("down"); }, { critical: false });
      // degraded는 healthy가 아님
      expect(await hc.isHealthy()).toBe(false);
    });
  });

  describe("병렬 실행", () => {
    it("모든 체크를 병렬로 실행한다", async () => {
      const start = Date.now();
      const hc = createHealthCheck()
        .register("a", () => new Promise((r) => setTimeout(r, 30)))
        .register("b", () => new Promise((r) => setTimeout(r, 30)))
        .register("c", () => new Promise((r) => setTimeout(r, 30)));

      await hc.check();
      const elapsed = Date.now() - start;
      // 병렬이면 ~30ms, 직렬이면 ~90ms
      expect(elapsed).toBeLessThan(80);
    });
  });

  describe("체이닝", () => {
    it("register를 체이닝한다", async () => {
      const report = await createHealthCheck()
        .register("a", () => {})
        .register("b", () => {})
        .check();

      expect(Object.keys(report.checks).length).toBe(2);
    });
  });
});
