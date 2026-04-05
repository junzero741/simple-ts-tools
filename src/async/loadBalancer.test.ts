import { describe, it, expect } from "vitest";
import { createLoadBalancer } from "./loadBalancer";

describe("createLoadBalancer", () => {
  describe("round-robin", () => {
    it("순서대로 순환한다", () => {
      const lb = createLoadBalancer(["a", "b", "c"]);
      expect(lb.next()).toBe("a");
      expect(lb.next()).toBe("b");
      expect(lb.next()).toBe("c");
      expect(lb.next()).toBe("a");
    });
  });

  describe("random", () => {
    it("랜덤으로 선택한다", () => {
      const lb = createLoadBalancer(["a", "b", "c"], { strategy: "random" });
      const results = new Set<string>();
      for (let i = 0; i < 100; i++) results.add(lb.next());
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe("least-connections", () => {
    it("연결 수가 가장 적은 대상을 선택한다", () => {
      const lb = createLoadBalancer(["a", "b", "c"], { strategy: "least-connections" });

      lb.acquire("a");
      lb.acquire("a");
      lb.acquire("b");

      expect(lb.next()).toBe("c"); // 0개 연결

      lb.release("a");
      lb.release("a");
      expect(lb.next()).toBe("a"); // 이제 0개
    });
  });

  describe("weighted-round-robin", () => {
    it("가중치에 비례하여 선택한다", () => {
      const lb = createLoadBalancer(
        [{ target: "fast", weight: 3 }, { target: "slow", weight: 1 }],
        { strategy: "weighted-round-robin" },
      );

      const counts: Record<string, number> = { fast: 0, slow: 0 };
      for (let i = 0; i < 40; i++) counts[lb.next()]++;

      // fast가 약 3배 더 많아야 함
      expect(counts.fast).toBeGreaterThan(counts.slow * 2);
    });
  });

  describe("remove / restore", () => {
    it("대상을 제거하면 선택에서 제외", () => {
      const lb = createLoadBalancer(["a", "b", "c"]);
      lb.remove("b");

      const results = new Set<string>();
      for (let i = 0; i < 10; i++) results.add(lb.next());
      expect(results.has("b")).toBe(false);
      expect(lb.size).toBe(2);
    });

    it("복원하면 다시 선택에 포함", () => {
      const lb = createLoadBalancer(["a", "b"]);
      lb.remove("a");
      lb.restore("a");

      const results = new Set<string>();
      for (let i = 0; i < 10; i++) results.add(lb.next());
      expect(results.has("a")).toBe(true);
    });

    it("모든 대상이 제거되면 에러", () => {
      const lb = createLoadBalancer(["a"]);
      lb.remove("a");
      expect(() => lb.next()).toThrow("No available targets");
    });
  });

  describe("targets / size", () => {
    it("활성 대상 목록", () => {
      const lb = createLoadBalancer(["a", "b", "c"]);
      expect(lb.targets).toEqual(["a", "b", "c"]);
      expect(lb.size).toBe(3);
    });
  });

  describe("실전: API 서버 분산", () => {
    it("장애 서버를 제거하고 복구 시 복원", () => {
      const lb = createLoadBalancer(
        ["us-east.api.com", "eu-west.api.com", "ap-ne.api.com"],
      );

      // eu-west 장애 발생
      lb.remove("eu-west.api.com");
      expect(lb.size).toBe(2);

      // 복구
      lb.restore("eu-west.api.com");
      expect(lb.size).toBe(3);
    });
  });
});
