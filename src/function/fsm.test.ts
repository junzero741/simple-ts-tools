import { describe, it, expect, vi } from "vitest";
import { createFSM } from "./fsm";

type TrafficState = "red" | "yellow" | "green";
type TrafficEvent = "NEXT";

describe("createFSM", () => {
  function createTrafficLight() {
    return createFSM<TrafficState, TrafficEvent, {}>({
      initial: "red",
      context: {},
      states: {
        red: { on: { NEXT: { target: "green" } } },
        green: { on: { NEXT: { target: "yellow" } } },
        yellow: { on: { NEXT: { target: "red" } } },
      },
    });
  }

  describe("기본 전이", () => {
    it("초기 상태를 설정한다", () => {
      const fsm = createTrafficLight();
      expect(fsm.state).toBe("red");
    });

    it("이벤트로 상태를 전이한다", () => {
      const fsm = createTrafficLight();
      fsm.send("NEXT");
      expect(fsm.state).toBe("green");
      fsm.send("NEXT");
      expect(fsm.state).toBe("yellow");
      fsm.send("NEXT");
      expect(fsm.state).toBe("red");
    });

    it("전이 성공 시 true를 반환한다", () => {
      const fsm = createTrafficLight();
      expect(fsm.send("NEXT")).toBe(true);
    });

    it("정의되지 않은 이벤트는 false를 반환한다", () => {
      const fsm = createFSM<"a", "X" | "Y", {}>({
        initial: "a",
        context: {},
        states: { a: { on: { X: { target: "a" } } } },
      });
      expect(fsm.send("Y")).toBe(false);
    });
  });

  describe("context / assign", () => {
    it("context를 초기화하고 assign으로 업데이트한다", () => {
      const fsm = createFSM<"idle" | "active", "INC" | "RESET", { count: number }>({
        initial: "idle",
        context: { count: 0 },
        states: {
          idle: { on: { INC: { target: "active", assign: (ctx) => ({ count: ctx.count + 1 }) } } },
          active: {
            on: {
              INC: { target: "active", assign: (ctx) => ({ count: ctx.count + 1 }) },
              RESET: { target: "idle", assign: () => ({ count: 0 }) },
            },
          },
        },
      });

      fsm.send("INC");
      expect(fsm.context.count).toBe(1);
      fsm.send("INC");
      expect(fsm.context.count).toBe(2);
      fsm.send("RESET");
      expect(fsm.context.count).toBe(0);
    });

    it("payload를 assign에 전달한다", () => {
      const fsm = createFSM<"empty" | "filled", "SET", { value: string }>({
        initial: "empty",
        context: { value: "" },
        states: {
          empty: {
            on: { SET: { target: "filled", assign: (_ctx, payload) => ({ value: payload as string }) } },
          },
          filled: {},
        },
      });

      fsm.send("SET", "hello");
      expect(fsm.context.value).toBe("hello");
    });
  });

  describe("guard", () => {
    it("guard가 true일 때만 전이한다", () => {
      const fsm = createFSM<"locked" | "unlocked", "TOGGLE", { key: string }>({
        initial: "locked",
        context: { key: "" },
        states: {
          locked: {
            on: {
              TOGGLE: {
                target: "unlocked",
                guard: (_ctx, payload) => payload === "secret",
              },
            },
          },
          unlocked: { on: { TOGGLE: { target: "locked" } } },
        },
      });

      expect(fsm.send("TOGGLE", "wrong")).toBe(false);
      expect(fsm.state).toBe("locked");

      expect(fsm.send("TOGGLE", "secret")).toBe(true);
      expect(fsm.state).toBe("unlocked");
    });

    it("배열 전이에서 첫 번째 매칭 guard를 사용한다", () => {
      const fsm = createFSM<"s1" | "s2" | "s3", "GO", { n: number }>({
        initial: "s1",
        context: { n: 5 },
        states: {
          s1: {
            on: {
              GO: [
                { target: "s2", guard: (ctx) => ctx.n > 10 },
                { target: "s3" }, // fallback
              ],
            },
          },
          s2: {},
          s3: {},
        },
      });

      fsm.send("GO");
      expect(fsm.state).toBe("s3"); // n=5 < 10이므로 fallback
    });
  });

  describe("onEntry / onExit", () => {
    it("상태 전이 시 onExit → onEntry 순서로 호출한다", () => {
      const log: string[] = [];

      const fsm = createFSM<"a" | "b", "GO", {}>({
        initial: "a",
        context: {},
        states: {
          a: {
            onExit: () => log.push("exit-a"),
            on: { GO: { target: "b" } },
          },
          b: {
            onEntry: () => log.push("enter-b"),
          },
        },
      });

      fsm.send("GO");
      expect(log).toEqual(["exit-a", "enter-b"]);
    });

    it("self-transition에서는 onEntry/onExit를 호출하지 않는다", () => {
      const log: string[] = [];

      const fsm = createFSM<"a", "TICK", { n: number }>({
        initial: "a",
        context: { n: 0 },
        states: {
          a: {
            onEntry: () => log.push("entry"),
            onExit: () => log.push("exit"),
            on: {
              TICK: { target: "a", assign: (ctx) => ({ n: ctx.n + 1 }) },
            },
          },
        },
      });

      log.length = 0; // initial onEntry 무시
      fsm.send("TICK");
      expect(log).toEqual([]);
      expect(fsm.context.n).toBe(1);
    });

    it("초기 상태의 onEntry를 실행한다", () => {
      const entry = vi.fn();

      createFSM<"a", never, {}>({
        initial: "a",
        context: {},
        states: { a: { onEntry: entry } },
      });

      expect(entry).toHaveBeenCalledOnce();
    });
  });

  describe("effect", () => {
    it("전이 후 effect를 실행한다", () => {
      const effectFn = vi.fn();

      const fsm = createFSM<"a" | "b", "GO", {}>({
        initial: "a",
        context: {},
        states: {
          a: { on: { GO: { target: "b", effect: effectFn } } },
          b: {},
        },
      });

      fsm.send("GO");
      expect(effectFn).toHaveBeenCalledOnce();
    });
  });

  describe("can / matches", () => {
    it("can — 전이 가능 여부를 확인한다", () => {
      const fsm = createTrafficLight();
      expect(fsm.can("NEXT")).toBe(true);
    });

    it("matches — 현재 상태를 확인한다", () => {
      const fsm = createTrafficLight();
      expect(fsm.matches("red")).toBe(true);
      expect(fsm.matches("green")).toBe(false);
    });
  });

  describe("subscribe", () => {
    it("상태 변경을 구독한다", () => {
      const fsm = createTrafficLight();
      const states: string[] = [];

      const off = fsm.subscribe((state) => states.push(state));
      fsm.send("NEXT");
      fsm.send("NEXT");
      off();
      fsm.send("NEXT");

      // 즉시 현재 상태 + 2번 전이
      expect(states).toEqual(["red", "green", "yellow"]);
    });
  });

  describe("reset", () => {
    it("초기 상태와 context로 리셋한다", () => {
      const fsm = createFSM<"a" | "b", "GO", { n: number }>({
        initial: "a",
        context: { n: 0 },
        states: {
          a: { on: { GO: { target: "b", assign: (ctx) => ({ n: ctx.n + 1 }) } } },
          b: {},
        },
      });

      fsm.send("GO");
      expect(fsm.state).toBe("b");
      expect(fsm.context.n).toBe(1);

      fsm.reset();
      expect(fsm.state).toBe("a");
      expect(fsm.context.n).toBe(0);
    });
  });
});
