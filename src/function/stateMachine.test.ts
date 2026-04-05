import { describe, expect, it, vi } from "vitest";
import { createStateMachine } from "./stateMachine";

// 비동기 로딩 상태 (공통 픽스처)
function makeLoader() {
  return createStateMachine({
    initial: "idle" as const,
    transitions: {
      idle:    { FETCH: "loading" },
      loading: { RESOLVE: "success", REJECT: "error" },
      success: { RESET: "idle" },
      error:   { RETRY: "loading", RESET: "idle" },
    },
  });
}

describe("createStateMachine", () => {
  describe("초기 상태", () => {
    it("initial에 지정한 상태로 시작한다", () => {
      const m = makeLoader();
      expect(m.state).toBe("idle");
    });
  });

  describe("send", () => {
    it("유효한 이벤트는 상태를 전이하고 true를 반환한다", () => {
      const m = makeLoader();
      expect(m.send("FETCH")).toBe(true);
      expect(m.state).toBe("loading");
    });

    it("유효하지 않은 이벤트는 상태를 변경하지 않고 false를 반환한다", () => {
      const m = makeLoader();
      expect(m.send("RESOLVE")).toBe(false); // idle에서 RESOLVE는 미정의
      expect(m.state).toBe("idle");
    });

    it("연속 전이가 정상 동작한다", () => {
      const m = makeLoader();
      m.send("FETCH");
      m.send("RESOLVE");
      expect(m.state).toBe("success");

      m.send("RESET");
      expect(m.state).toBe("idle");
    });

    it("에러 후 재시도 경로", () => {
      const m = makeLoader();
      m.send("FETCH");
      m.send("REJECT");
      expect(m.state).toBe("error");

      m.send("RETRY");
      expect(m.state).toBe("loading");
    });

    it("현재 상태에서 허용되지 않은 이벤트는 무시된다 (throw 없음)", () => {
      const m = makeLoader();
      expect(() => m.send("RESET" as never)).not.toThrow();
      expect(m.state).toBe("idle"); // 변화 없음
    });
  });

  describe("can", () => {
    it("현재 상태에서 유효한 이벤트는 true", () => {
      const m = makeLoader();
      expect(m.can("FETCH")).toBe(true);
    });

    it("현재 상태에서 미정의 이벤트는 false", () => {
      const m = makeLoader();
      expect(m.can("RESOLVE")).toBe(false);
      expect(m.can("RESET" as never)).toBe(false);
    });

    it("상태 전이 후 can이 새 상태 기준으로 동작한다", () => {
      const m = makeLoader();
      m.send("FETCH");
      expect(m.can("FETCH")).toBe(false);   // loading에서 FETCH 미정의
      expect(m.can("RESOLVE")).toBe(true);
      expect(m.can("REJECT")).toBe(true);
    });
  });

  describe("subscribe", () => {
    it("구독 시 즉시 현재 상태를 전달한다 (BehaviorSubject 패턴)", () => {
      const m = makeLoader();
      const handler = vi.fn();
      m.subscribe(handler);
      expect(handler).toHaveBeenCalledWith("idle", null);
    });

    it("상태 전이 시 핸들러를 호출한다", () => {
      const m = makeLoader();
      const handler = vi.fn();
      m.subscribe(handler);
      handler.mockClear();

      m.send("FETCH");
      expect(handler).toHaveBeenCalledWith("loading", "FETCH");
    });

    it("허용되지 않은 이벤트에는 핸들러가 호출되지 않는다", () => {
      const m = makeLoader();
      const handler = vi.fn();
      m.subscribe(handler);
      handler.mockClear();

      m.send("RESOLVE"); // idle에서 미정의
      expect(handler).not.toHaveBeenCalled();
    });

    it("구독 해제 후 핸들러가 호출되지 않는다", () => {
      const m = makeLoader();
      const handler = vi.fn();
      const unsub = m.subscribe(handler);
      handler.mockClear();

      unsub();
      m.send("FETCH");
      expect(handler).not.toHaveBeenCalled();
    });

    it("여러 구독자가 모두 알림을 받는다", () => {
      const m = makeLoader();
      const h1 = vi.fn();
      const h2 = vi.fn();
      m.subscribe(h1);
      m.subscribe(h2);
      h1.mockClear(); h2.mockClear();

      m.send("FETCH");
      expect(h1).toHaveBeenCalledWith("loading", "FETCH");
      expect(h2).toHaveBeenCalledWith("loading", "FETCH");
    });
  });

  describe("reset", () => {
    it("초기 상태로 되돌린다", () => {
      const m = makeLoader();
      m.send("FETCH");
      m.send("RESOLVE");
      expect(m.state).toBe("success");

      m.reset();
      expect(m.state).toBe("idle");
    });

    it("reset 시 구독자에게 알린다", () => {
      const m = makeLoader();
      m.send("FETCH");
      const handler = vi.fn();
      m.subscribe(handler);
      handler.mockClear();

      m.reset();
      expect(handler).toHaveBeenCalledWith("idle", null);
    });
  });

  describe("실사용 시나리오", () => {
    it("다단계 폼 스텝 — 앞/뒤 이동", () => {
      const form = createStateMachine({
        initial: "step1" as const,
        transitions: {
          step1: { NEXT: "step2" },
          step2: { NEXT: "step3", BACK: "step1" },
          step3: { BACK: "step2", SUBMIT: "done" },
          done:  {},
        },
      });

      expect(form.state).toBe("step1");
      form.send("NEXT"); expect(form.state).toBe("step2");
      form.send("BACK"); expect(form.state).toBe("step1");
      form.send("NEXT"); form.send("NEXT"); expect(form.state).toBe("step3");
      form.send("SUBMIT"); expect(form.state).toBe("done");

      // done 상태에서는 아무 이벤트도 허용 안 됨
      expect(form.can("BACK")).toBe(false);
    });

    it("미디어 플레이어 상태 머신", () => {
      const player = createStateMachine({
        initial: "stopped" as const,
        transitions: {
          stopped: { PLAY: "playing" },
          playing: { PAUSE: "paused", STOP: "stopped" },
          paused:  { PLAY: "playing", STOP: "stopped" },
        },
      });

      player.send("PLAY");   expect(player.state).toBe("playing");
      player.send("PAUSE");  expect(player.state).toBe("paused");
      player.send("PLAY");   expect(player.state).toBe("playing");
      player.send("STOP");   expect(player.state).toBe("stopped");

      // stopped에서 PAUSE는 불가
      expect(player.can("PAUSE")).toBe(false);
    });

    it("상태 히스토리 수집 — subscribe로 전이 추적", () => {
      const m = makeLoader();
      const history: string[] = [];

      m.subscribe((state) => history.push(state));
      m.send("FETCH");
      m.send("REJECT");
      m.send("RETRY");

      expect(history).toEqual(["idle", "loading", "error", "loading"]);
    });

    it("UI 버튼 비활성화 — can으로 허용 여부 확인", () => {
      const m = makeLoader();

      // 초기 idle 상태 — FETCH만 가능
      expect(m.can("FETCH")).toBe(true);
      expect(m.can("RESOLVE")).toBe(false);

      m.send("FETCH");
      // loading 상태 — FETCH 불가, RESOLVE/REJECT만 가능
      expect(m.can("FETCH")).toBe(false);
      expect(m.can("RESOLVE")).toBe(true);
    });
  });
});
