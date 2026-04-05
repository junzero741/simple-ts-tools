import { describe, it, expect, vi } from "vitest";
import { createDebugger } from "./debug";

describe("createDebugger", () => {
  function createTestDebugger() {
    const logs: Array<{ ns: string; msg: string; elapsed: number }> = [];
    let time = 1000;

    const debug = createDebugger(undefined, {
      output: (ns, msg, elapsed) => logs.push({ ns, msg, elapsed }),
      now: () => time,
    });

    return { debug, logs, advance: (ms: number) => { time += ms; } };
  }

  describe("기본 로깅", () => {
    it("활성화된 네임스페이스만 출력한다", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("app:*");

      const log = debug("app:http");
      log("hello");

      expect(logs.length).toBe(1);
      expect(logs[0].ns).toBe("app:http");
      expect(logs[0].msg).toBe("hello");
    });

    it("비활성화된 네임스페이스는 출력하지 않는다", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("app:*");

      const log = debug("lib:internal");
      log("should not appear");

      expect(logs.length).toBe(0);
    });
  });

  describe("경과 시간", () => {
    it("첫 호출은 +0ms", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("*");

      debug("test")("first");
      expect(logs[0].elapsed).toBe(0);
    });

    it("이후 호출은 경과 시간 표시", () => {
      const { debug, logs, advance } = createTestDebugger();
      debug.enable("*");

      const log = debug("test");
      log("first");
      advance(50);
      log("second");

      expect(logs[1].elapsed).toBe(50);
    });
  });

  describe("enable 패턴", () => {
    it("* — 모든 네임스페이스 활성화", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("*");

      debug("a")("msg");
      debug("b:c")("msg");

      expect(logs.length).toBe(2);
    });

    it("정확한 매칭", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("app:http");

      debug("app:http")("yes");
      debug("app:db")("no");

      expect(logs.length).toBe(1);
    });

    it("와일드카드 접미사", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("app:*");

      debug("app:http")("yes");
      debug("app:db")("yes");
      debug("lib:x")("no");

      expect(logs.length).toBe(2);
    });

    it("- 접두사로 제외", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("app:*,-app:verbose");

      debug("app:http")("yes");
      debug("app:verbose")("no");

      expect(logs.length).toBe(1);
      expect(logs[0].ns).toBe("app:http");
    });

    it("여러 패턴 쉼표 구분", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("http,db");

      debug("http")("yes");
      debug("db")("yes");
      debug("auth")("no");

      expect(logs.length).toBe(2);
    });
  });

  describe("disable", () => {
    it("모든 네임스페이스를 비활성화한다", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("*");
      debug.disable();

      debug("anything")("should not appear");
      expect(logs.length).toBe(0);
    });
  });

  describe("enabled 속성", () => {
    it("활성화 상태를 반영한다", () => {
      const { debug } = createTestDebugger();
      debug.enable("app:*");

      const httpLog = debug("app:http");
      const libLog = debug("lib:x");

      expect(httpLog.enabled).toBe(true);
      expect(libLog.enabled).toBe(false);
    });

    it("enable 변경을 동적으로 반영한다", () => {
      const { debug } = createTestDebugger();
      const log = debug("app:http");

      expect(log.enabled).toBe(false);
      debug.enable("app:*");
      expect(log.enabled).toBe(true);
      debug.disable();
      expect(log.enabled).toBe(false);
    });
  });

  describe("namespace 속성", () => {
    it("네임스페이스를 반환한다", () => {
      const { debug } = createTestDebugger();
      expect(debug("app:http").namespace).toBe("app:http");
    });
  });

  describe("pattern 속성", () => {
    it("현재 패턴을 반환한다", () => {
      const { debug } = createTestDebugger();
      debug.enable("app:*,-app:verbose");
      expect(debug.pattern).toBe("app:*,-app:verbose");
    });
  });

  describe("추가 인자", () => {
    it("메시지에 추가 인자를 포함한다", () => {
      const { debug, logs } = createTestDebugger();
      debug.enable("*");

      debug("test")("user:", { name: "alice" });
      expect(logs[0].msg).toBe('user: {"name":"alice"}');
    });
  });
});
