import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "./eventBus";

describe("createEventBus", () => {
  describe("on / emit", () => {
    it("이벤트를 구독하고 수신한다", () => {
      const bus = createEventBus();
      const handler = vi.fn();

      bus.on("test", handler);
      bus.emit("test", { a: 1 });

      expect(handler).toHaveBeenCalledWith({ a: 1 }, "test");
    });

    it("같은 이벤트에 여러 리스너를 등록한다", () => {
      const bus = createEventBus();
      const h1 = vi.fn();
      const h2 = vi.fn();

      bus.on("test", h1);
      bus.on("test", h2);
      bus.emit("test", 42);

      expect(h1).toHaveBeenCalledOnce();
      expect(h2).toHaveBeenCalledOnce();
    });

    it("반환된 함수로 구독을 해제한다", () => {
      const bus = createEventBus();
      const handler = vi.fn();

      const off = bus.on("test", handler);
      bus.emit("test");
      off();
      bus.emit("test");

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("와일드카드", () => {
    it("* — 모든 이벤트를 수신한다", () => {
      const bus = createEventBus();
      const events: string[] = [];

      bus.on("*", (_, event) => events.push(event));
      bus.emit("user.login");
      bus.emit("order.created");

      expect(events).toEqual(["user.login", "order.created"]);
    });

    it("user.* — user. 프리픽스 이벤트를 수신한다", () => {
      const bus = createEventBus();
      const events: string[] = [];

      bus.on("user.*", (_, event) => events.push(event));
      bus.emit("user.login");
      bus.emit("user.logout");
      bus.emit("order.created");

      expect(events).toEqual(["user.login", "user.logout"]);
    });

    it("정확한 매칭이 와일드카드와 함께 동작한다", () => {
      const bus = createEventBus();
      const exact = vi.fn();
      const wild = vi.fn();

      bus.on("user.login", exact);
      bus.on("user.*", wild);
      bus.emit("user.login", "data");

      expect(exact).toHaveBeenCalledWith("data", "user.login");
      expect(wild).toHaveBeenCalledWith("data", "user.login");
    });
  });

  describe("once", () => {
    it("한 번만 실행된다", () => {
      const bus = createEventBus();
      const handler = vi.fn();

      bus.once("test", handler);
      bus.emit("test", 1);
      bus.emit("test", 2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(1, "test");
    });

    it("수동 해제 가능", () => {
      const bus = createEventBus();
      const handler = vi.fn();

      const off = bus.once("test", handler);
      off();
      bus.emit("test");

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("waitFor", () => {
    it("이벤트를 Promise로 대기한다", async () => {
      const bus = createEventBus();

      setTimeout(() => bus.emit("done", 42), 10);
      const result = await bus.waitFor("done");

      expect(result).toBe(42);
    });

    it("timeout 초과 시 에러를 던진다", async () => {
      const bus = createEventBus();

      await expect(
        bus.waitFor("never", { timeout: 30 }),
      ).rejects.toThrow('waitFor("never") timed out after 30ms');
    });

    it("filter 조건에 맞는 이벤트만 매칭한다", async () => {
      const bus = createEventBus();

      setTimeout(() => {
        bus.emit("msg", { type: "ping" });
        bus.emit("msg", { type: "pong" });
      }, 10);

      const result = await bus.waitFor("msg", {
        filter: (d: any) => d.type === "pong",
      });

      expect(result).toEqual({ type: "pong" });
    });
  });

  describe("clear", () => {
    it("특정 이벤트의 리스너를 제거한다", () => {
      const bus = createEventBus();
      const handler = vi.fn();

      bus.on("test", handler);
      bus.clear("test");
      bus.emit("test");

      expect(handler).not.toHaveBeenCalled();
    });

    it("전체 리스너를 제거한다", () => {
      const bus = createEventBus();
      bus.on("a", vi.fn());
      bus.on("b", vi.fn());

      bus.clear();
      expect(bus.listenerCount).toBe(0);
    });
  });

  describe("history", () => {
    it("히스토리를 기록한다", () => {
      const bus = createEventBus({ historySize: 10 });

      bus.emit("a", 1);
      bus.emit("b", 2);

      expect(bus.history.length).toBe(2);
      expect(bus.history[0].event).toBe("a");
      expect(bus.history[1].data).toBe(2);
    });

    it("historySize를 초과하면 오래된 것을 제거한다", () => {
      const bus = createEventBus({ historySize: 2 });

      bus.emit("a", 1);
      bus.emit("b", 2);
      bus.emit("c", 3);

      expect(bus.history.length).toBe(2);
      expect(bus.history[0].event).toBe("b");
    });

    it("historySize=0이면 기록하지 않는다", () => {
      const bus = createEventBus();

      bus.emit("a", 1);
      expect(bus.history.length).toBe(0);
    });
  });

  describe("listenerCount", () => {
    it("등록된 리스너 수를 반환한다", () => {
      const bus = createEventBus();

      bus.on("a", () => {});
      bus.on("a", () => {});
      bus.on("b", () => {});

      expect(bus.listenerCount).toBe(3);
    });
  });
});
