import { describe, it, expect, vi } from "vitest";
import { createInjector } from "./injector";

describe("createInjector", () => {
  describe("register / resolve", () => {
    it("값을 등록하고 해결한다", () => {
      const c = createInjector();
      c.register("config", { port: 3000 });

      expect(c.resolve("config")).toEqual({ port: 3000 });
    });

    it("미등록 토큰은 에러를 던진다", () => {
      const c = createInjector();
      expect(() => c.resolve("missing")).toThrow('No registration found for "missing"');
    });
  });

  describe("factory", () => {
    it("팩토리 함수로 인스턴스를 생성한다", () => {
      const c = createInjector();
      c.factory("service", () => ({ name: "svc" }));

      expect(c.resolve("service")).toEqual({ name: "svc" });
    });

    it("싱글톤 — 같은 인스턴스를 반환한다", () => {
      const c = createInjector();
      const factory = vi.fn(() => ({ id: Math.random() }));
      c.factory("svc", factory);

      const a = c.resolve("svc");
      const b = c.resolve("svc");

      expect(a).toBe(b);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("트랜지언트 — 매번 새 인스턴스를 반환한다", () => {
      const c = createInjector();
      const factory = vi.fn(() => ({ id: Math.random() }));
      c.factory("svc", factory, { scope: "transient" });

      const a = c.resolve("svc");
      const b = c.resolve("svc");

      expect(a).not.toBe(b);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it("의존성을 컨테이너에서 해결한다", () => {
      const c = createInjector();
      c.register("dbUrl", "postgres://localhost/test");
      c.factory("db", (container) => ({
        url: container.resolve<string>("dbUrl"),
        connected: true,
      }));

      const db = c.resolve<{ url: string; connected: boolean }>("db");
      expect(db.url).toBe("postgres://localhost/test");
      expect(db.connected).toBe(true);
    });
  });

  describe("순환 의존성", () => {
    it("순환 의존성을 감지한다", () => {
      const c = createInjector();
      c.factory("a", (container) => container.resolve("b"));
      c.factory("b", (container) => container.resolve("a"));

      expect(() => c.resolve("a")).toThrow("Circular dependency");
    });

    it("자기 참조 순환을 감지한다", () => {
      const c = createInjector();
      c.factory("self", (container) => container.resolve("self"));

      expect(() => c.resolve("self")).toThrow("Circular dependency");
    });
  });

  describe("has", () => {
    it("등록 여부를 확인한다", () => {
      const c = createInjector();
      c.register("a", 1);

      expect(c.has("a")).toBe(true);
      expect(c.has("b")).toBe(false);
    });
  });

  describe("createChild", () => {
    it("부모 서비스를 상속한다", () => {
      const parent = createInjector();
      parent.register("config", { env: "prod" });

      const child = parent.createChild();
      expect(child.resolve("config")).toEqual({ env: "prod" });
    });

    it("자식에서 오버라이드한다", () => {
      const parent = createInjector();
      parent.register("config", { env: "prod" });

      const child = parent.createChild();
      child.register("config", { env: "test" });

      expect(child.resolve("config")).toEqual({ env: "test" });
      expect(parent.resolve("config")).toEqual({ env: "prod" });
    });

    it("자식의 팩토리가 부모 서비스를 사용한다", () => {
      const parent = createInjector();
      parent.register("dbUrl", "postgres://prod");

      const child = parent.createChild();
      child.factory("db", (c) => ({ url: c.resolve<string>("dbUrl") }));

      expect(child.resolve<{ url: string }>("db").url).toBe("postgres://prod");
    });

    it("자식에서 오버라이드 후 팩토리가 새 값을 사용한다", () => {
      const parent = createInjector();
      parent.register("url", "prod");

      const child = parent.createChild();
      child.register("url", "staging");
      child.factory("svc", (c) => ({ url: c.resolve("url") }));

      expect(child.resolve<{ url: string }>("svc").url).toBe("staging");
    });

    it("has는 부모까지 확인한다", () => {
      const parent = createInjector();
      parent.register("x", 1);

      const child = parent.createChild();
      expect(child.has("x")).toBe(true);
    });
  });

  describe("clear", () => {
    it("모든 등록을 제거한다", () => {
      const c = createInjector();
      c.register("a", 1);
      c.factory("b", () => 2);

      c.clear();
      expect(c.has("a")).toBe(false);
      expect(c.has("b")).toBe(false);
    });
  });

  describe("체이닝", () => {
    it("register와 factory를 체이닝할 수 있다", () => {
      const c = createInjector()
        .register("a", 1)
        .register("b", 2)
        .factory("sum", (container) =>
          container.resolve<number>("a") + container.resolve<number>("b"),
        );

      expect(c.resolve("sum")).toBe(3);
    });
  });
});
