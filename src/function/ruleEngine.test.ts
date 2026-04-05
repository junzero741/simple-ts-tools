import { describe, it, expect } from "vitest";
import { createRuleEngine } from "./ruleEngine";

type Order = { qty: number; total: number; vip: boolean };
type Discount = { type: string; value: number };

describe("createRuleEngine", () => {
  function createTestEngine() {
    return createRuleEngine<Order, Discount>()
      .add({
        name: "bulk",
        condition: (o) => o.qty >= 100,
        action: () => ({ type: "percent", value: 10 }),
        priority: 10,
      })
      .add({
        name: "vip",
        condition: (o) => o.vip,
        action: () => ({ type: "percent", value: 15 }),
        priority: 20,
      })
      .add({
        name: "big-order",
        condition: (o) => o.total >= 10000,
        action: () => ({ type: "fixed", value: 500 }),
        priority: 5,
      });
  }

  describe("first", () => {
    it("최고 우선순위 매칭 규칙을 반환한다", () => {
      const engine = createTestEngine();
      const order: Order = { qty: 150, total: 15000, vip: true };

      const result = engine.first(order);
      expect(result).toBeDefined();
      expect(result!.rule).toBe("vip"); // priority 20
      expect(result!.result).toEqual({ type: "percent", value: 15 });
    });

    it("매칭 없으면 undefined", () => {
      const engine = createTestEngine();
      const order: Order = { qty: 1, total: 10, vip: false };

      expect(engine.first(order)).toBeUndefined();
    });
  });

  describe("evaluateAll", () => {
    it("모든 매칭 규칙의 결과를 우선순위 순으로 반환한다", () => {
      const engine = createTestEngine();
      const order: Order = { qty: 150, total: 15000, vip: true };

      const results = engine.evaluateAll(order);
      expect(results.length).toBe(3);
      expect(results[0].rule).toBe("vip");     // priority 20
      expect(results[1].rule).toBe("bulk");     // priority 10
      expect(results[2].rule).toBe("big-order"); // priority 5
    });

    it("매칭 없으면 빈 배열", () => {
      const engine = createTestEngine();
      expect(engine.evaluateAll({ qty: 1, total: 10, vip: false })).toEqual([]);
    });
  });

  describe("match", () => {
    it("매칭되는 규칙 이름 목록", () => {
      const engine = createTestEngine();
      const names = engine.match({ qty: 50, total: 15000, vip: true });
      expect(names).toEqual(["vip", "big-order"]);
    });
  });

  describe("add / remove", () => {
    it("규칙을 추가하고 제거한다", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "pos", condition: (n) => n > 0, action: () => "positive" });

      expect(engine.size).toBe(1);
      engine.remove("pos");
      expect(engine.size).toBe(0);
    });

    it("중복 이름은 에러", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "a", condition: () => true, action: () => "x" });

      expect(() =>
        engine.add({ name: "a", condition: () => true, action: () => "y" }),
      ).toThrow("already exists");
    });

    it("없는 규칙 제거는 false", () => {
      expect(createRuleEngine().remove("x")).toBe(false);
    });
  });

  describe("toggle", () => {
    it("비활성화된 규칙은 평가하지 않는다", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "always", condition: () => true, action: () => "hit" });

      engine.toggle("always", false);
      expect(engine.first(42)).toBeUndefined();

      engine.toggle("always", true);
      expect(engine.first(42)?.result).toBe("hit");
    });
  });

  describe("priority", () => {
    it("높은 priority가 먼저 평가된다", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "low", condition: () => true, action: () => "low", priority: 1 })
        .add({ name: "high", condition: () => true, action: () => "high", priority: 100 })
        .add({ name: "mid", condition: () => true, action: () => "mid", priority: 50 });

      expect(engine.first(0)?.rule).toBe("high");
      expect(engine.evaluateAll(0).map((r) => r.rule)).toEqual(["high", "mid", "low"]);
    });
  });

  describe("clear", () => {
    it("모든 규칙을 제거한다", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "a", condition: () => true, action: () => "x" });

      engine.clear();
      expect(engine.size).toBe(0);
    });
  });

  describe("rules", () => {
    it("등록된 규칙 목록을 반환한다", () => {
      const engine = createRuleEngine<number, string>()
        .add({ name: "a", condition: () => true, action: () => "x" })
        .add({ name: "b", condition: () => true, action: () => "y" });

      expect(engine.rules.map((r) => r.name)).toEqual(["a", "b"]);
    });
  });

  describe("실전: 알림 라우팅", () => {
    type Event = { level: "info" | "warn" | "error"; source: string };
    type Channel = "slack" | "email" | "pager";

    it("이벤트를 적절한 채널로 라우팅한다", () => {
      const router = createRuleEngine<Event, Channel>()
        .add({
          name: "pager-on-error",
          condition: (e) => e.level === "error",
          action: () => "pager",
          priority: 100,
        })
        .add({
          name: "email-on-warn",
          condition: (e) => e.level === "warn",
          action: () => "email",
          priority: 50,
        })
        .add({
          name: "slack-default",
          condition: () => true,
          action: () => "slack",
          priority: 1,
        });

      expect(router.first({ level: "error", source: "api" })?.result).toBe("pager");
      expect(router.first({ level: "warn", source: "db" })?.result).toBe("email");
      expect(router.first({ level: "info", source: "web" })?.result).toBe("slack");
    });
  });
});
