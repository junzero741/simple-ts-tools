import { describe, it, expect, vi } from "vitest";
import { createPluginSystem } from "./pluginSystem";

type Hooks = {
  onStart: [string];
  onStop: [];
  transform: [{ value: string }];
};

describe("createPluginSystem", () => {
  describe("register / has / plugins", () => {
    it("플러그인을 등록한다", () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a" });
      expect(sys.has("a")).toBe(true);
      expect(sys.plugins).toContain("a");
    });

    it("중복 등록은 에러", () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a" });
      expect(() => sys.register({ name: "a" })).toThrow("already registered");
    });

    it("체이닝을 지원한다", () => {
      const sys = createPluginSystem<Hooks>()
        .register({ name: "a" })
        .register({ name: "b" });
      expect(sys.plugins.length).toBe(2);
    });
  });

  describe("unregister", () => {
    it("플러그인을 제거한다", () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a" });
      expect(sys.unregister("a")).toBe(true);
      expect(sys.has("a")).toBe(false);
    });

    it("의존하는 플러그인이 있으면 에러", () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a" });
      sys.register({ name: "b", dependencies: ["a"] });
      expect(() => sys.unregister("a")).toThrow("depends on it");
    });

    it("없는 플러그인은 false", () => {
      expect(createPluginSystem<Hooks>().unregister("x")).toBe(false);
    });
  });

  describe("hooks", () => {
    it("훅을 순서대로 실행한다", async () => {
      const order: string[] = [];
      const sys = createPluginSystem<Hooks>();

      sys.register({ name: "a", hooks: { onStart: () => { order.push("a"); } } });
      sys.register({ name: "b", hooks: { onStart: () => { order.push("b"); } } });

      await sys.call("onStart", "test");
      expect(order).toEqual(["a", "b"]);
    });

    it("인자를 전달한다", async () => {
      const sys = createPluginSystem<Hooks>();
      const fn = vi.fn();

      sys.register({ name: "a", hooks: { onStart: fn } });
      await sys.call("onStart", "hello");

      expect(fn).toHaveBeenCalledWith("hello");
    });

    it("객체를 변형한다 (mutating hook)", async () => {
      const sys = createPluginSystem<Hooks>();

      sys.register({
        name: "upper",
        hooks: { transform: (ctx) => { ctx.value = ctx.value.toUpperCase(); } },
      });
      sys.register({
        name: "exclaim",
        hooks: { transform: (ctx) => { ctx.value += "!"; } },
      });

      const ctx = { value: "hello" };
      await sys.call("transform", ctx);
      expect(ctx.value).toBe("HELLO!");
    });

    it("async 훅을 지원한다", async () => {
      const sys = createPluginSystem<Hooks>();
      const order: string[] = [];

      sys.register({
        name: "slow",
        hooks: {
          onStart: async () => {
            await new Promise((r) => setTimeout(r, 10));
            order.push("slow");
          },
        },
      });
      sys.register({
        name: "fast",
        hooks: { onStart: () => { order.push("fast"); } },
      });

      await sys.call("onStart", "x");
      expect(order).toEqual(["slow", "fast"]);
    });

    it("callSync — 동기 실행", () => {
      const sys = createPluginSystem<Hooks>();
      const fn = vi.fn();

      sys.register({ name: "a", hooks: { onStop: fn } });
      sys.callSync("onStop");

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("의존성 순서", () => {
    it("의존성 순서대로 실행한다", async () => {
      const order: string[] = [];
      const sys = createPluginSystem<Hooks>();

      sys.register({
        name: "b",
        dependencies: ["a"],
        hooks: { onStart: () => { order.push("b"); } },
      });
      sys.register({
        name: "a",
        hooks: { onStart: () => { order.push("a"); } },
      });

      await sys.call("onStart", "x");
      expect(order).toEqual(["a", "b"]);
    });

    it("순환 의존성은 에러", async () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a", dependencies: ["b"] });
      sys.register({ name: "b", dependencies: ["a"] });

      await expect(sys.call("onStart", "x")).rejects.toThrow("Circular");
    });

    it("미등록 의존성은 에러", async () => {
      const sys = createPluginSystem<Hooks>();
      sys.register({ name: "a", dependencies: ["missing"] });

      await expect(sys.call("onStart", "x")).rejects.toThrow("unknown plugin");
    });
  });

  describe("init / destroy", () => {
    it("의존성 순서대로 init, 역순으로 destroy", async () => {
      const order: string[] = [];
      const sys = createPluginSystem<Hooks>();

      sys.register({
        name: "db",
        init: () => { order.push("db-init"); },
        destroy: () => { order.push("db-destroy"); },
      });
      sys.register({
        name: "app",
        dependencies: ["db"],
        init: () => { order.push("app-init"); },
        destroy: () => { order.push("app-destroy"); },
      });

      await sys.init();
      expect(sys.initialized).toBe(true);
      expect(order).toEqual(["db-init", "app-init"]);

      await sys.destroy();
      expect(sys.initialized).toBe(false);
      expect(order).toEqual(["db-init", "app-init", "app-destroy", "db-destroy"]);
    });
  });
});
