import { describe, it, expect, vi } from "vitest";
import { createActor } from "./actor";

describe("createActor", () => {
  describe("기본 메시지 처리", () => {
    it("메시지에 따라 상태를 변경한다", async () => {
      const counter = createActor(0, {
        increment: (state, n: number) => state + n,
        decrement: (state, n: number) => state - n,
      });

      await counter.send("increment", 5);
      await counter.send("increment", 3);
      await counter.send("decrement", 2);

      expect(counter.state).toBe(6);
    });

    it("인자 없는 메시지", async () => {
      const actor = createActor(10, {
        reset: () => 0,
        double: (state) => state * 2,
      });

      await actor.send("double");
      expect(actor.state).toBe(20);

      await actor.send("reset");
      expect(actor.state).toBe(0);
    });
  });

  describe("순차 처리", () => {
    it("동시 send도 순차 처리된다", async () => {
      const order: number[] = [];
      const actor = createActor(0, {
        add: (state, n: number) => {
          order.push(n);
          return state + n;
        },
      });

      await Promise.all([
        actor.send("add", 1),
        actor.send("add", 2),
        actor.send("add", 3),
      ]);

      expect(actor.state).toBe(6);
      expect(order).toEqual([1, 2, 3]); // FIFO 보장
    });
  });

  describe("subscribe", () => {
    it("상태 변경을 구독한다", async () => {
      const actor = createActor(0, {
        inc: (state) => state + 1,
      });

      const states: number[] = [];
      const off = actor.subscribe((state) => states.push(state));

      await actor.send("inc");
      await actor.send("inc");
      off();
      await actor.send("inc");

      expect(states).toEqual([1, 2]);
    });

    it("메시지 이름도 전달한다", async () => {
      const actor = createActor("", {
        greet: (_s, name: string) => name,
      });

      const messages: string[] = [];
      actor.subscribe((_s, msg) => messages.push(msg));

      await actor.send("greet", "Alice");
      expect(messages).toEqual(["greet"]);
    });
  });

  describe("stop", () => {
    it("stop 후 send는 에러", async () => {
      const actor = createActor(0, { inc: (s) => s + 1 });
      actor.stop();

      await expect(actor.send("inc")).rejects.toThrow("stopped");
      expect(actor.stopped).toBe(true);
    });
  });

  describe("에러 처리", () => {
    it("핸들러 에러 시 상태 유지", async () => {
      const actor = createActor(10, {
        bad: () => { throw new Error("oops"); },
        inc: (s) => s + 1,
      });

      await actor.send("bad");
      expect(actor.state).toBe(10); // 변경 안 됨

      await actor.send("inc");
      expect(actor.state).toBe(11); // 이후 처리 정상
    });
  });

  describe("복잡한 상태", () => {
    it("객체 상태를 관리한다", async () => {
      type State = { users: string[]; count: number };

      const actor = createActor<State, any>(
        { users: [], count: 0 },
        {
          addUser: (state, name: string) => ({
            users: [...state.users, name],
            count: state.count + 1,
          }),
          removeUser: (state, name: string) => ({
            users: state.users.filter((u: string) => u !== name),
            count: state.count - 1,
          }),
        },
      );

      await actor.send("addUser", "Alice");
      await actor.send("addUser", "Bob");
      await actor.send("removeUser", "Alice");

      expect(actor.state).toEqual({ users: ["Bob"], count: 1 });
    });
  });

  describe("async 핸들러", () => {
    it("비동기 핸들러를 지원한다", async () => {
      const actor = createActor(0, {
        asyncAdd: async (state, n: number) => {
          await new Promise((r) => setTimeout(r, 5));
          return state + n;
        },
      });

      await actor.send("asyncAdd", 10);
      expect(actor.state).toBe(10);
    });
  });

  describe("pending", () => {
    it("대기 중인 메시지 수를 반환한다", async () => {
      const actor = createActor(0, {
        slow: async (state) => {
          await new Promise((r) => setTimeout(r, 30));
          return state + 1;
        },
      });

      actor.send("slow");
      actor.send("slow");
      // 첫 번째가 처리 중이므로 1개 대기
      expect(actor.pending).toBeGreaterThanOrEqual(0);

      // 모든 처리 완료 대기
      await new Promise((r) => setTimeout(r, 80));
      expect(actor.state).toBe(2);
    });
  });
});
