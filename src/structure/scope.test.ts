import { describe, it, expect } from "vitest";
import { createScope } from "./scope";

describe("createScope", () => {
  describe("set / get / has", () => {
    it("값을 설정하고 읽는다", () => {
      const s = createScope<string>();
      s.set("a", "hello");
      expect(s.get("a")).toBe("hello");
      expect(s.has("a")).toBe(true);
    });

    it("없는 키는 undefined", () => {
      const s = createScope<string>();
      expect(s.get("missing")).toBeUndefined();
      expect(s.has("missing")).toBe(false);
    });
  });

  describe("부모 탐색", () => {
    it("자식에서 못 찾으면 부모를 탐색한다", () => {
      const parent = createScope<string>();
      parent.set("lang", "en");

      const child = parent.child();
      expect(child.get("lang")).toBe("en");
      expect(child.has("lang")).toBe(true);
    });

    it("자식이 부모를 오버라이드한다", () => {
      const parent = createScope<string>();
      parent.set("theme", "light");

      const child = parent.child();
      child.set("theme", "dark");

      expect(child.get("theme")).toBe("dark");
      expect(parent.get("theme")).toBe("light");
    });

    it("3단계 계층", () => {
      const root = createScope<number>();
      root.set("x", 1);

      const mid = root.child();
      mid.set("y", 2);

      const leaf = mid.child();
      leaf.set("z", 3);

      expect(leaf.get("x")).toBe(1);
      expect(leaf.get("y")).toBe(2);
      expect(leaf.get("z")).toBe(3);
    });
  });

  describe("hasOwn", () => {
    it("자기 스코프에 있는지만 확인한다", () => {
      const parent = createScope<string>();
      parent.set("a", "1");

      const child = parent.child();
      child.set("b", "2");

      expect(child.hasOwn("b")).toBe(true);
      expect(child.hasOwn("a")).toBe(false);
      expect(child.has("a")).toBe(true);
    });
  });

  describe("delete", () => {
    it("자기 스코프에서 키를 삭제한다", () => {
      const s = createScope<string>();
      s.set("a", "1");
      expect(s.delete("a")).toBe(true);
      expect(s.has("a")).toBe(false);
    });

    it("부모 키는 삭제하지 않는다", () => {
      const parent = createScope<string>();
      parent.set("a", "1");

      const child = parent.child();
      expect(child.delete("a")).toBe(false);
      expect(child.get("a")).toBe("1");
    });
  });

  describe("resolve", () => {
    it("값을 찾은 스코프를 반환한다", () => {
      const parent = createScope<string>();
      parent.set("x", "root");

      const child = parent.child();
      child.set("y", "leaf");

      const rx = child.resolve("x");
      expect(rx?.value).toBe("root");
      expect(rx?.scope).toBe(parent);

      const ry = child.resolve("y");
      expect(ry?.value).toBe("leaf");
      expect(ry?.scope).toBe(child);
    });

    it("없으면 undefined", () => {
      expect(createScope().resolve("x")).toBeUndefined();
    });
  });

  describe("toObject", () => {
    it("전체 계층을 병합한 객체를 반환한다", () => {
      const parent = createScope<number>();
      parent.set("a", 1);
      parent.set("b", 2);

      const child = parent.child();
      child.set("b", 20);
      child.set("c", 30);

      expect(child.toObject()).toEqual({ a: 1, b: 20, c: 30 });
    });
  });

  describe("ownKeys", () => {
    it("자기 스코프의 키만 반환한다", () => {
      const parent = createScope<string>();
      parent.set("a", "1");

      const child = parent.child();
      child.set("b", "2");
      child.set("c", "3");

      expect(child.ownKeys.sort()).toEqual(["b", "c"]);
    });
  });

  describe("depth", () => {
    it("계층 깊이를 반환한다", () => {
      const root = createScope<string>();
      expect(root.depth).toBe(0);

      const child = root.child();
      expect(child.depth).toBe(1);

      const grandchild = child.child();
      expect(grandchild.depth).toBe(2);
    });
  });

  describe("parent", () => {
    it("부모 스코프를 반환한다", () => {
      const parent = createScope<string>();
      const child = parent.child();

      expect(child.parent).toBe(parent);
      expect(parent.parent).toBeUndefined();
    });
  });

  describe("실전: 설정 오버라이드", () => {
    it("환경별 설정 계층", () => {
      const defaults = createScope<unknown>();
      defaults.set("port", 3000);
      defaults.set("host", "localhost");
      defaults.set("debug", false);

      const dev = defaults.child();
      dev.set("debug", true);

      const test = dev.child();
      test.set("port", 0);
      test.set("db", "test.db");

      expect(test.get("port")).toBe(0);
      expect(test.get("host")).toBe("localhost");
      expect(test.get("debug")).toBe(true);
      expect(test.get("db")).toBe("test.db");
    });
  });
});
