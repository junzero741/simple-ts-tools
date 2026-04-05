import { describe, it, expect, vi } from "vitest";
import { watchable } from "./watchable";

describe("watchable", () => {
  describe("기본 감지", () => {
    it("프로퍼티 변경을 감지한다", () => {
      const state = watchable({ name: "Alice", age: 30 });
      const handler = vi.fn();

      state.watch(handler);
      state.proxy.name = "Bob";

      expect(handler).toHaveBeenCalledWith({
        path: ["name"],
        value: "Bob",
        prev: "Alice",
        type: "set",
      });
    });

    it("같은 값 할당은 알리지 않는다", () => {
      const state = watchable({ x: 1 });
      const handler = vi.fn();

      state.watch(handler);
      state.proxy.x = 1;

      expect(handler).not.toHaveBeenCalled();
    });

    it("delete를 감지한다", () => {
      const state = watchable<Record<string, unknown>>({ a: 1, b: 2 });
      const handler = vi.fn();

      state.watch(handler);
      delete state.proxy.b;

      expect(handler).toHaveBeenCalledWith({
        path: ["b"],
        value: undefined,
        prev: 2,
        type: "delete",
      });
    });
  });

  describe("깊은 감지", () => {
    it("중첩 객체 변경을 감지한다", () => {
      const state = watchable({
        user: { name: "Alice", address: { city: "Seoul" } },
      });
      const handler = vi.fn();

      state.watch(handler);
      state.proxy.user.address.city = "Busan";

      expect(handler).toHaveBeenCalledWith({
        path: ["user", "address", "city"],
        value: "Busan",
        prev: "Seoul",
        type: "set",
      });
    });

    it("배열 요소 변경을 감지한다", () => {
      const state = watchable({ items: [1, 2, 3] });
      const handler = vi.fn();

      state.watch(handler);
      state.proxy.items[0] = 99;

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ["items", "0"],
          value: 99,
          prev: 1,
        }),
      );
    });
  });

  describe("watch 해제", () => {
    it("반환 함수로 구독을 해제한다", () => {
      const state = watchable({ x: 1 });
      const handler = vi.fn();

      const off = state.watch(handler);
      state.proxy.x = 2;
      off();
      state.proxy.x = 3;

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("watchPath", () => {
    it("특정 경로만 구독한다", () => {
      const state = watchable({ a: { b: 1 }, c: 2 });
      const handler = vi.fn();

      state.watchPath("a.b", handler);
      state.proxy.a.b = 99;
      state.proxy.c = 100;

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ path: ["a", "b"], value: 99 }),
      );
    });

    it("와일드카드 경로", () => {
      const state = watchable({ user: { name: "A", age: 1 } });
      const handler = vi.fn();

      state.watchPath("user.*", handler);
      state.proxy.user.name = "B";
      state.proxy.user.age = 2;

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("batch", () => {
    it("batch 내 변경은 알리지 않는다", () => {
      const state = watchable({ a: 1, b: 2 });
      const handler = vi.fn();

      state.watch(handler);
      state.batch((target) => {
        target.a = 10;
        target.b = 20;
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("batch 후 변경은 다시 알린다", () => {
      const state = watchable({ x: 1 });
      const handler = vi.fn();

      state.watch(handler);
      state.batch((target) => { target.x = 10; });
      state.proxy.x = 20;

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("snapshot", () => {
    it("현재 상태의 깊은 복사를 반환한다", () => {
      const state = watchable({ a: { b: 1 } });
      state.proxy.a.b = 99;

      const snap = state.snapshot();
      expect(snap).toEqual({ a: { b: 99 } });

      // 복사 확인
      snap.a.b = 0;
      expect(state.proxy.a.b).toBe(99);
    });
  });

  describe("프록시 값 읽기", () => {
    it("원래 값을 정상 반환한다", () => {
      const state = watchable({ x: 42, arr: [1, 2], nested: { y: "hi" } });

      expect(state.proxy.x).toBe(42);
      expect(state.proxy.arr[0]).toBe(1);
      expect(state.proxy.nested.y).toBe("hi");
    });
  });

  describe("여러 watcher", () => {
    it("여러 핸들러에 동시 알림", () => {
      const state = watchable({ x: 1 });
      const h1 = vi.fn();
      const h2 = vi.fn();

      state.watch(h1);
      state.watch(h2);
      state.proxy.x = 2;

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });
  });
});
