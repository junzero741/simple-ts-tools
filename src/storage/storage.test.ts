// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorage } from "./storage";

// vitest의 jsdom 환경 — localStorage 사용 가능

describe("createStorage / TypedStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("기본 set / get", () => {
    it("문자열을 저장하고 불러온다", () => {
      const store = createStorage();
      store.set("key", "hello");
      expect(store.get<string>("key")).toBe("hello");
    });

    it("숫자를 저장하고 불러온다", () => {
      const store = createStorage();
      store.set("num", 42);
      expect(store.get<number>("num")).toBe(42);
    });

    it("객체를 JSON으로 직렬화해 저장한다", () => {
      const store = createStorage();
      const user = { id: 1, name: "Alice", roles: ["admin"] };
      store.set("user", user);
      expect(store.get<typeof user>("user")).toEqual(user);
    });

    it("배열을 저장하고 불러온다", () => {
      const store = createStorage();
      store.set("items", [1, 2, 3]);
      expect(store.get<number[]>("items")).toEqual([1, 2, 3]);
    });

    it("없는 키는 null을 반환한다", () => {
      const store = createStorage();
      expect(store.get("nonexistent")).toBeNull();
    });

    it("null 값을 저장할 수 있다", () => {
      const store = createStorage();
      store.set("nullable", null);
      // null 값은 entry.value = null → JSON: {"value":null,"expiresAt":null}
      expect(store.get("nullable")).toBeNull();
    });
  });

  describe("TTL (만료)", () => {
    it("TTL 이전에는 값을 반환한다", () => {
      vi.useFakeTimers();
      const store = createStorage();
      store.set("key", "data", { ttl: 1000 });
      vi.advanceTimersByTime(999);
      expect(store.get("key")).toBe("data");
      vi.useRealTimers();
    });

    it("TTL 만료 후 null을 반환하고 항목을 삭제한다", () => {
      vi.useFakeTimers();
      const store = createStorage();
      store.set("key", "data", { ttl: 1000 });
      vi.advanceTimersByTime(1001);
      expect(store.get("key")).toBeNull();
      // localStorage에서도 삭제됐는지 확인
      expect(localStorage.getItem("key")).toBeNull();
      vi.useRealTimers();
    });

    it("TTL 없으면 영구 저장", () => {
      vi.useFakeTimers();
      const store = createStorage();
      store.set("perm", "forever");
      vi.advanceTimersByTime(999_999_999);
      expect(store.get("perm")).toBe("forever");
      vi.useRealTimers();
    });
  });

  describe("prefix (네임스페이스)", () => {
    it("prefix가 키에 자동으로 붙는다", () => {
      const store = createStorage({ prefix: "app" });
      store.set("theme", "dark");
      // localStorage에는 "app:theme"으로 저장됨
      expect(localStorage.getItem("app:theme")).not.toBeNull();
      expect(localStorage.getItem("theme")).toBeNull();
    });

    it("같은 rawKey라도 prefix가 다르면 독립적이다", () => {
      const a = createStorage({ prefix: "a" });
      const b = createStorage({ prefix: "b" });
      a.set("key", "A");
      b.set("key", "B");
      expect(a.get("key")).toBe("A");
      expect(b.get("key")).toBe("B");
    });
  });

  describe("has / remove", () => {
    it("has — 존재하면 true", () => {
      const store = createStorage();
      store.set("x", 1);
      expect(store.has("x")).toBe(true);
    });

    it("has — 없으면 false", () => {
      const store = createStorage();
      expect(store.has("missing")).toBe(false);
    });

    it("has — 만료된 항목은 false", () => {
      vi.useFakeTimers();
      const store = createStorage();
      store.set("x", 1, { ttl: 500 });
      vi.advanceTimersByTime(600);
      expect(store.has("x")).toBe(false);
      vi.useRealTimers();
    });

    it("remove — 항목을 삭제한다", () => {
      const store = createStorage();
      store.set("del", "bye");
      store.remove("del");
      expect(store.get("del")).toBeNull();
    });
  });

  describe("clear", () => {
    it("prefix 없으면 localStorage 전체를 비운다", () => {
      const store = createStorage();
      store.set("a", 1);
      store.set("b", 2);
      store.clear();
      expect(store.get("a")).toBeNull();
      expect(store.get("b")).toBeNull();
    });

    it("prefix 있으면 해당 prefix 항목만 삭제한다", () => {
      const app = createStorage({ prefix: "app" });
      const other = createStorage({ prefix: "other" });
      app.set("x", 1);
      other.set("x", 99);
      app.clear();
      expect(app.get("x")).toBeNull();
      expect(other.get("x")).toBe(99); // 다른 namespace는 유지
    });
  });

  describe("keys", () => {
    it("저장된 모든 rawKey를 반환한다", () => {
      const store = createStorage({ prefix: "ns" });
      store.set("a", 1);
      store.set("b", 2);
      expect(store.keys().sort()).toEqual(["a", "b"]);
    });
  });

  describe("sessionStorage", () => {
    it("type: session 이면 sessionStorage에 저장한다", () => {
      const store = createStorage({ type: "session" });
      store.set("token", "abc");
      expect(sessionStorage.getItem("token")).not.toBeNull();
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
