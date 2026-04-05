import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createLogger,
  consoleTransport,
  jsonTransport,
} from "./logger";
import type { LogEntry, Transport } from "./logger";

function collectTransport(): { entries: LogEntry[]; transport: Transport } {
  const entries: LogEntry[] = [];
  return { entries, transport: (e) => entries.push(e) };
}

describe("createLogger — 기본 동작", () => {
  it("info 레벨 이상의 로그를 출력한다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    log.info("hello");
    log.warn("warning");
    log.error("error");

    expect(entries).toHaveLength(3);
    expect(entries[0].level).toBe("info");
    expect(entries[1].level).toBe("warn");
    expect(entries[2].level).toBe("error");
  });

  it("debug 레벨은 기본적으로 출력되지 않는다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    log.debug("debug message");

    expect(entries).toHaveLength(0);
  });

  it("level: 'debug'로 설정하면 debug도 출력된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ level: "debug", transports: [transport] });

    log.debug("verbose");

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("debug");
  });

  it("level: 'silent'이면 아무것도 출력되지 않는다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ level: "silent", transports: [transport] });

    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");

    expect(entries).toHaveLength(0);
  });

  it("message 필드가 LogEntry에 포함된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    log.info("테스트 메시지");

    expect(entries[0].message).toBe("테스트 메시지");
  });

  it("timestamp는 ISO 8601 형식이다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    log.info("ts test");

    expect(entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("컨텍스트(context)", () => {
  it("기본 컨텍스트가 모든 로그에 포함된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({
      context: { service: "api", env: "test" },
      transports: [transport],
    });

    log.info("start");

    expect(entries[0].context).toMatchObject({ service: "api", env: "test" });
  });

  it("로그별 컨텍스트가 기본 컨텍스트와 병합된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({
      context: { service: "api" },
      transports: [transport],
    });

    log.info("요청", { userId: 42 });

    expect(entries[0].context).toMatchObject({ service: "api", userId: 42 });
  });

  it("error 객체가 LogEntry.error에 포함된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    const err = new Error("DB 연결 실패");
    log.error("오류 발생", {}, err);

    expect(entries[0].error).toBe(err);
  });
});

describe("namespace", () => {
  it("namespace가 LogEntry에 포함된다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ namespace: "app", transports: [transport] });

    log.info("ns test");

    expect(entries[0].namespace).toBe("app");
  });

  it("namespace가 없으면 LogEntry에 namespace 키가 없다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ transports: [transport] });

    log.info("no ns");

    expect("namespace" in entries[0]).toBe(false);
  });
});

describe("child logger", () => {
  it("자식 로거는 부모 컨텍스트를 상속한다", () => {
    const { entries, transport } = collectTransport();
    const parent = createLogger({ context: { service: "api" }, transports: [transport] });
    const child = parent.child({ requestId: "abc" });

    child.info("child log");

    expect(entries[0].context).toMatchObject({ service: "api", requestId: "abc" });
  });

  it("자식 로거의 namespace는 parent:child 형식이다", () => {
    const { entries, transport } = collectTransport();
    const parent = createLogger({ namespace: "app", transports: [transport] });
    const child = parent.child({}, "db");

    child.info("db query");

    expect(entries[0].namespace).toBe("app:db");
  });

  it("부모 namespace 없이 child namespace만 지정하면 그대로 사용된다", () => {
    const { entries, transport } = collectTransport();
    const parent = createLogger({ transports: [transport] });
    const child = parent.child({}, "auth");

    child.info("auth check");

    expect(entries[0].namespace).toBe("auth");
  });

  it("자식 로거도 동일한 transport를 사용한다", () => {
    const { entries, transport } = collectTransport();
    const parent = createLogger({ transports: [transport] });
    const child = parent.child({ x: 1 });

    parent.info("parent");
    child.info("child");

    expect(entries).toHaveLength(2);
  });
});

describe("setLevel / level getter", () => {
  it("초기 level은 options에서 설정한 값이다", () => {
    const log = createLogger({ level: "debug", transports: [] });
    expect(log.level).toBe("debug");
  });

  it("setLevel로 레벨을 동적으로 변경할 수 있다", () => {
    const { entries, transport } = collectTransport();
    const log = createLogger({ level: "info", transports: [transport] });

    log.debug("before"); // 출력 안 됨
    log.setLevel("debug");
    log.debug("after");  // 출력 됨

    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("after");
  });
});

describe("여러 트랜스포트", () => {
  it("모든 트랜스포트에 동일한 엔트리가 전달된다", () => {
    const t1 = collectTransport();
    const t2 = collectTransport();
    const log = createLogger({ transports: [t1.transport, t2.transport] });

    log.info("broadcast");

    expect(t1.entries).toHaveLength(1);
    expect(t2.entries).toHaveLength(1);
    expect(t1.entries[0].message).toBe("broadcast");
    expect(t2.entries[0].message).toBe("broadcast");
  });
});

describe("consoleTransport", () => {
  it("info/debug는 console.log를 사용한다", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger({ transports: [consoleTransport({ colorize: false })] });

    log.info("info message");

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("warn/error는 console.error를 사용한다", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger({ transports: [consoleTransport({ colorize: false })] });

    log.error("error message");

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe("jsonTransport", () => {
  it("JSON 문자열을 출력한다", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger({ transports: [jsonTransport()] });

    log.info("json test", { key: "value" });

    const call = logSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("json test");
    expect(parsed.key).toBe("value");
    logSpy.mockRestore();
  });

  it("error 객체가 직렬화되어 포함된다", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger({ transports: [jsonTransport()] });

    const err = new Error("test error");
    log.error("failed", {}, err);

    const call = errSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(call);
    expect(parsed.error.message).toBe("test error");
    errSpy.mockRestore();
  });
});
