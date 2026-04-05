import { describe, it, expect, vi } from "vitest";
import { createCircuitBreakerGroup } from "./circuitBreakerGroup";

describe("createCircuitBreakerGroup", () => {
  describe("register / names", () => {
    it("서킷을 등록한다", () => {
      const g = createCircuitBreakerGroup()
        .register("api-a")
        .register("api-b");
      expect(g.names).toEqual(["api-a", "api-b"]);
    });
  });

  describe("call — 정상 동작", () => {
    it("함수를 실행하고 결과를 반환한다", async () => {
      const g = createCircuitBreakerGroup().register("svc");
      const result = await g.call("svc", () => 42);
      expect(result).toBe(42);
    });

    it("async 함수 지원", async () => {
      const g = createCircuitBreakerGroup().register("svc");
      const result = await g.call("svc", async () => "ok");
      expect(result).toBe("ok");
    });
  });

  describe("call — 서킷 오픈", () => {
    it("threshold 초과 시 서킷이 open된다", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 3, resetTimeout: 100 });

      for (let i = 0; i < 3; i++) {
        await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      }

      expect(g.status().svc).toBe("open");
      await expect(g.call("svc", () => "ok")).rejects.toThrow('Circuit "svc" is open');
    });

    it("threshold 미만이면 closed 유지", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 5 });

      for (let i = 0; i < 3; i++) {
        await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      }

      expect(g.status().svc).toBe("closed");
    });

    it("성공하면 실패 카운트 리셋", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 3 });

      await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      await g.call("svc", () => "success"); // 리셋

      expect(g.stats("svc").failures).toBe(0);
    });
  });

  describe("half-open → 복구", () => {
    it("resetTimeout 후 half-open, 성공 시 closed", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 2, resetTimeout: 30, successThreshold: 1 });

      await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      expect(g.status().svc).toBe("open");

      await new Promise((r) => setTimeout(r, 50));
      expect(g.status().svc).toBe("half-open");

      await g.call("svc", () => "recovered");
      expect(g.status().svc).toBe("closed");
    });

    it("half-open에서 실패하면 다시 open", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 1, resetTimeout: 30 });

      await g.call("svc", () => { throw new Error("fail"); }).catch(() => {});
      await new Promise((r) => setTimeout(r, 50));
      expect(g.status().svc).toBe("half-open");

      await g.call("svc", () => { throw new Error("still broken"); }).catch(() => {});
      expect(g.status().svc).toBe("open");
    });
  });

  describe("status", () => {
    it("전체 상태 맵을 반환한다", async () => {
      const g = createCircuitBreakerGroup()
        .register("a")
        .register("b");

      expect(g.status()).toEqual({ a: "closed", b: "closed" });
    });
  });

  describe("stats", () => {
    it("통계를 반환한다", async () => {
      const g = createCircuitBreakerGroup().register("svc");

      await g.call("svc", () => "ok");
      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});

      const s = g.stats("svc");
      expect(s.totalCalls).toBe(2);
      expect(s.totalFailures).toBe(1);
      expect(s.lastFailure).toBeGreaterThan(0);
    });

    it("미등록 서킷은 에러", () => {
      expect(() => createCircuitBreakerGroup().stats("x")).toThrow("not registered");
    });
  });

  describe("reset / resetAll", () => {
    it("특정 서킷을 리셋한다", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 1 });

      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});
      expect(g.status().svc).toBe("open");

      g.reset("svc");
      expect(g.status().svc).toBe("closed");
    });

    it("전체 리셋", async () => {
      const g = createCircuitBreakerGroup()
        .register("a", { threshold: 1 })
        .register("b", { threshold: 1 });

      await g.call("a", () => { throw new Error("x"); }).catch(() => {});
      await g.call("b", () => { throw new Error("x"); }).catch(() => {});

      g.resetAll();
      expect(g.status()).toEqual({ a: "closed", b: "closed" });
    });
  });

  describe("onStateChange", () => {
    it("상태 변경을 구독한다", async () => {
      const g = createCircuitBreakerGroup()
        .register("svc", { threshold: 1, resetTimeout: 50 });

      const changes: string[] = [];
      g.onStateChange((name, from, to) => changes.push(`${name}:${from}->${to}`));

      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});
      expect(changes).toContain("svc:closed->open");

      await new Promise((r) => setTimeout(r, 70));
      expect(changes).toContain("svc:open->half-open");
    });

    it("해제 함수로 구독 취소", async () => {
      const g = createCircuitBreakerGroup().register("svc", { threshold: 1 });
      const fn = vi.fn();
      const off = g.onStateChange(fn);
      off();

      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("독립 서킷", () => {
    it("서킷 간 상태가 독립적이다", async () => {
      const g = createCircuitBreakerGroup()
        .register("a", { threshold: 1 })
        .register("b");

      await g.call("a", () => { throw new Error("x"); }).catch(() => {});

      expect(g.status().a).toBe("open");
      expect(g.status().b).toBe("closed");

      const result = await g.call("b", () => "still works");
      expect(result).toBe("still works");
    });
  });

  describe("defaultOptions", () => {
    it("그룹 기본 옵션을 적용한다", async () => {
      const g = createCircuitBreakerGroup({
        defaultOptions: { threshold: 2 },
      }).register("svc");

      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});
      expect(g.status().svc).toBe("closed"); // 1회 실패, threshold=2

      await g.call("svc", () => { throw new Error("x"); }).catch(() => {});
      expect(g.status().svc).toBe("open"); // 2회 실패
    });
  });
});
