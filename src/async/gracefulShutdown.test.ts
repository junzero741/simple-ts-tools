import { describe, it, expect, vi } from "vitest";
import { createGracefulShutdown } from "./gracefulShutdown";

describe("createGracefulShutdown", () => {
  describe("register / hooks", () => {
    it("훅을 등록한다", () => {
      const s = createGracefulShutdown()
        .register("http", () => {})
        .register("db", () => {});
      expect(s.hooks).toContain("http");
      expect(s.hooks).toContain("db");
    });

    it("중복 이름은 에러", () => {
      const s = createGracefulShutdown().register("x", () => {});
      expect(() => s.register("x", () => {})).toThrow("already registered");
    });
  });

  describe("shutdown — 기본 동작", () => {
    it("모든 훅을 실행한다", async () => {
      const order: string[] = [];
      const s = createGracefulShutdown()
        .register("a", () => { order.push("a"); })
        .register("b", () => { order.push("b"); });

      const report = await s.shutdown();
      expect(report.success).toBe(true);
      expect(report.completed).toContain("a");
      expect(report.completed).toContain("b");
    });

    it("async 훅을 지원한다", async () => {
      let cleaned = false;
      const s = createGracefulShutdown()
        .register("async", async () => {
          await new Promise((r) => setTimeout(r, 10));
          cleaned = true;
        });

      await s.shutdown();
      expect(cleaned).toBe(true);
    });
  });

  describe("priority 순서", () => {
    it("높은 priority가 먼저 실행된다", async () => {
      const order: string[] = [];
      const s = createGracefulShutdown()
        .register("db", () => { order.push("db"); }, { priority: 0 })
        .register("http", () => { order.push("http"); }, { priority: 10 })
        .register("cache", () => { order.push("cache"); }, { priority: 5 });

      await s.shutdown();
      expect(order).toEqual(["http", "cache", "db"]);
    });

    it("같은 priority는 등록 순서", async () => {
      const order: string[] = [];
      const s = createGracefulShutdown()
        .register("a", () => { order.push("a"); })
        .register("b", () => { order.push("b"); });

      await s.shutdown();
      expect(order).toEqual(["a", "b"]);
    });
  });

  describe("에러 처리", () => {
    it("훅 실패 시 나머지는 계속 실행", async () => {
      const order: string[] = [];
      const s = createGracefulShutdown()
        .register("ok1", () => { order.push("ok1"); })
        .register("fail", () => { throw new Error("boom"); })
        .register("ok2", () => { order.push("ok2"); });

      const report = await s.shutdown();
      expect(report.success).toBe(false);
      expect(report.completed).toEqual(["ok1", "ok2"]);
      expect(report.failed).toEqual([{ name: "fail", error: "boom" }]);
    });
  });

  describe("타임아웃", () => {
    it("타임아웃 초과 시 강제 종료", async () => {
      const s = createGracefulShutdown({ timeout: 30 })
        .register("slow", () => new Promise((r) => setTimeout(r, 500)));

      const report = await s.shutdown();
      expect(report.timedOut).toBe(true);
      expect(report.success).toBe(false);
      expect(report.elapsed).toBeLessThan(100);
    });
  });

  describe("isShuttingDown", () => {
    it("종료 중 상태를 반영한다", async () => {
      const s = createGracefulShutdown()
        .register("x", () => {});

      expect(s.isShuttingDown).toBe(false);
      await s.shutdown();
      expect(s.isShuttingDown).toBe(true);
    });
  });

  describe("중복 shutdown 호출", () => {
    it("이미 종료 중이면 즉시 반환", async () => {
      const s = createGracefulShutdown()
        .register("slow", () => new Promise((r) => setTimeout(r, 100)));

      const p1 = s.shutdown();
      const report2 = await s.shutdown();
      expect(report2.success).toBe(false);
      expect(report2.failed[0].error).toContain("Already shutting down");

      await p1;
    });
  });

  describe("report", () => {
    it("elapsed를 포함한다", async () => {
      const s = createGracefulShutdown()
        .register("x", async () => {
          await new Promise((r) => setTimeout(r, 20));
        });

      const report = await s.shutdown();
      expect(report.elapsed).toBeGreaterThanOrEqual(15);
    });
  });

  describe("실전: 서버 종료 시나리오", () => {
    it("HTTP → Cache → DB 순서로 종료", async () => {
      const order: string[] = [];

      const s = createGracefulShutdown({ timeout: 5000 })
        .register("http-server", async () => {
          await new Promise((r) => setTimeout(r, 5));
          order.push("http-closed");
        }, { priority: 20 })
        .register("redis", () => {
          order.push("redis-closed");
        }, { priority: 10 })
        .register("postgres", async () => {
          await new Promise((r) => setTimeout(r, 5));
          order.push("pg-closed");
        }, { priority: 0 });

      const report = await s.shutdown("SIGTERM");
      expect(order).toEqual(["http-closed", "redis-closed", "pg-closed"]);
      expect(report.success).toBe(true);
    });
  });
});
