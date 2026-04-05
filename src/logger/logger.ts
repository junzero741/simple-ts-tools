/**
 * 구조화된 로거 (Structured Logger).
 *
 * ## 특징
 * - 5단계 로그 레벨: `debug` < `info` < `warn` < `error` < `silent`
 * - 구조화된 컨텍스트(metadata) 지원 — 모든 로그에 공통 필드 첨부
 * - 자식 로거(child logger) — 네임스페이스 계층으로 컨텍스트 확장
 * - 플러그형 트랜스포트(transport) — console 기본, 커스텀 핸들러 추가 가능
 * - ISO 8601 타임스탬프 자동 첨부
 *
 * @example
 * // 기본 사용
 * const log = createLogger({ level: "info" });
 * log.info("서버 시작", { port: 3000 });
 * log.error("DB 연결 실패", { host: "localhost" }, new Error("ECONNREFUSED"));
 *
 * // 자식 로거 — 요청별 컨텍스트 분리
 * const reqLog = log.child({ requestId: "abc-123", userId: 42 });
 * reqLog.info("요청 처리 시작");  // { requestId, userId } 자동 포함
 *
 * // 커스텀 트랜스포트 (파일, 원격 등)
 * const log = createLogger({
 *   transports: [
 *     consoleTransport({ colorize: true }),
 *     (entry) => sendToLogServer(entry),
 *   ],
 * });
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface LogEntry {
  level: Exclude<LogLevel, "silent">;
  message: string;
  timestamp: string;
  /** 로거 또는 자식 로거의 네임스페이스 */
  namespace?: string;
  /** 구조화된 컨텍스트 */
  context: Record<string, unknown>;
  /** 첨부된 Error 객체 */
  error?: Error;
}

export type Transport = (entry: LogEntry) => void;

export interface LoggerOptions {
  /**
   * 최소 출력 레벨. 이 레벨 미만의 로그는 무시된다.
   * @default "info"
   */
  level?: LogLevel;
  /**
   * 로거 네임스페이스 (예: "app", "app:db").
   * 자식 로거 생성 시 부모 namespace에 `:` 로 이어진다.
   */
  namespace?: string;
  /**
   * 트랜스포트 함수 배열. 미지정 시 `consoleTransport()` 하나가 사용된다.
   */
  transports?: Transport[];
  /**
   * 모든 로그 엔트리에 첨부할 기본 컨텍스트.
   */
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>, error?: Error): void;
  info(message: string, context?: Record<string, unknown>, error?: Error): void;
  warn(message: string, context?: Record<string, unknown>, error?: Error): void;
  error(message: string, context?: Record<string, unknown>, error?: Error): void;

  /**
   * 주어진 컨텍스트를 기본 컨텍스트에 병합한 자식 로거를 반환한다.
   * namespace가 있으면 `parent:child` 형태로 이어진다.
   */
  child(context: Record<string, unknown>, namespace?: string): Logger;

  /** 현재 레벨 설정을 반환한다. */
  readonly level: LogLevel;

  /** 레벨을 동적으로 변경한다. */
  setLevel(level: LogLevel): void;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

// ─── 기본 console 트랜스포트 ────────────────────────────────────────────

export interface ConsoleTransportOptions {
  /** ANSI 컬러 출력 여부 (기본: process.stdout이 TTY일 때 true) */
  colorize?: boolean;
}

const ANSI = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
} as const;

const LEVEL_COLOR: Record<Exclude<LogLevel, "silent">, string> = {
  debug: ANSI.gray,
  info: ANSI.green,
  warn: ANSI.yellow,
  error: ANSI.red,
};

/**
 * 기본 콘솔 트랜스포트. 사람이 읽기 쉬운 형식으로 출력한다.
 *
 * @example
 * const log = createLogger({
 *   transports: [consoleTransport({ colorize: true })],
 * });
 */
export function consoleTransport(options: ConsoleTransportOptions = {}): Transport {
  const shouldColorize =
    options.colorize ??
    (typeof process !== "undefined" && process.stdout?.isTTY === true);

  return function (entry: LogEntry): void {
    const { level, message, timestamp, namespace, context, error } = entry;

    const levelTag = level.toUpperCase().padEnd(5);
    const ns = namespace ? `[${namespace}] ` : "";
    const ctx =
      Object.keys(context).length > 0
        ? " " + JSON.stringify(context)
        : "";
    const errStr = error ? ` ${error.stack ?? error.message}` : "";

    const line = `${timestamp} ${levelTag} ${ns}${message}${ctx}${errStr}`;

    if (shouldColorize) {
      const color = LEVEL_COLOR[level];
      const colored = `${ANSI.gray}${timestamp}${ANSI.reset} ${color}${ANSI.bold}${levelTag}${ANSI.reset} ${ns}${message}${ANSI.gray}${ctx}${ANSI.reset}${errStr}`;
      const fn = level === "error" || level === "warn" ? console.error : console.log;
      fn(colored);
    } else {
      const fn = level === "error" || level === "warn" ? console.error : console.log;
      fn(line);
    }
  };
}

/**
 * JSON Lines 트랜스포트. 로그 수집기(Logstash, Fluentd 등)와 연동할 때 사용한다.
 *
 * @example
 * const log = createLogger({ transports: [jsonTransport()] });
 * // → {"level":"info","message":"서버 시작","timestamp":"...","context":{}}
 */
export function jsonTransport(): Transport {
  return function (entry: LogEntry): void {
    const obj: Record<string, unknown> = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      ...entry.context,
    };
    if (entry.namespace) obj["namespace"] = entry.namespace;
    if (entry.error) {
      obj["error"] = {
        message: entry.error.message,
        stack: entry.error.stack,
        name: entry.error.name,
      };
    }
    const fn = entry.level === "error" || entry.level === "warn" ? console.error : console.log;
    fn(JSON.stringify(obj));
  };
}

// ─── createLogger ───────────────────────────────────────────────────────

export function createLogger(options: LoggerOptions = {}): Logger {
  let currentLevel: LogLevel = options.level ?? "info";
  const baseContext: Record<string, unknown> = { ...options.context };
  const namespace = options.namespace;
  const transports: Transport[] =
    options.transports && options.transports.length > 0
      ? options.transports
      : [consoleTransport()];

  function log(
    level: Exclude<LogLevel, "silent">,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[currentLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(namespace !== undefined && { namespace }),
      context: { ...baseContext, ...context },
      ...(error !== undefined && { error }),
    };

    for (const transport of transports) {
      transport(entry);
    }
  }

  const logger: Logger = {
    debug(message, context?, error?) {
      log("debug", message, context, error);
    },
    info(message, context?, error?) {
      log("info", message, context, error);
    },
    warn(message, context?, error?) {
      log("warn", message, context, error);
    },
    error(message, context?, error?) {
      log("error", message, context, error);
    },

    child(childContext: Record<string, unknown>, childNamespace?: string): Logger {
      const mergedNamespace =
        childNamespace !== undefined
          ? namespace !== undefined
            ? `${namespace}:${childNamespace}`
            : childNamespace
          : namespace;

      return createLogger({
        level: currentLevel,
        namespace: mergedNamespace,
        transports,
        context: { ...baseContext, ...childContext },
      });
    },

    get level(): LogLevel {
      return currentLevel;
    },

    setLevel(level: LogLevel): void {
      currentLevel = level;
    },
  };

  return logger;
}
