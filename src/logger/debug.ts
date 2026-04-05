/**
 * 네임스페이스 디버그 로거 (Debug Logger).
 *
 * `debug` npm 패키지의 핵심 패턴을 경량으로 구현.
 * 네임스페이스 기반 on/off, 와일드카드 필터, 경과 시간 자동 표시.
 *
 * @example
 * const debug = createDebugger("app");
 * debug.enable("app:*");
 *
 * const log = debug("app:http");
 * log("request received");     // [app:http] request received +0ms
 * log("response sent");        // [app:http] response sent +12ms
 *
 * const dbLog = debug("app:db");
 * dbLog("query executed");     // [app:db] query executed +0ms
 *
 * debug("lib:internal")("skip"); // 출력 안 됨 (app:* 패턴 불일치)
 *
 * @example
 * // 와일드카드
 * debug.enable("*");           // 모든 네임스페이스 활성화
 * debug.enable("app:*,-app:verbose"); // app:* 활성화, app:verbose 제외
 *
 * @example
 * // 커스텀 출력
 * const debug = createDebugger("app", {
 *   output: (ns, msg, elapsed) => customSink(ns, msg, elapsed),
 * });
 *
 * @complexity Time: O(p) per log, p = 패턴 수. Space: O(1).
 */

export interface DebugOptions {
  /** 커스텀 출력 함수. 기본: console.debug */
  output?: (namespace: string, message: string, elapsedMs: number) => void;
  /** 시간 함수 (테스트용). 기본: Date.now */
  now?: () => number;
}

export interface DebugInstance {
  (message: string, ...args: unknown[]): void;
  readonly namespace: string;
  readonly enabled: boolean;
}

export interface Debugger {
  /** 네임스페이스를 지정하여 로그 함수를 생성한다. */
  (namespace: string): DebugInstance;

  /** 활성화할 네임스페이스 패턴을 설정한다. 쉼표 구분, -접두사로 제외. */
  enable(pattern: string): void;

  /** 모든 네임스페이스를 비활성화한다. */
  disable(): void;

  /** 현재 활성화 패턴. */
  readonly pattern: string;
}

function matchNamespace(namespace: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (pattern === namespace) return true;

  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    return namespace.startsWith(prefix);
  }

  return false;
}

function isEnabled(namespace: string, includes: string[], excludes: string[]): boolean {
  // 먼저 제외 패턴 확인
  for (const exc of excludes) {
    if (matchNamespace(namespace, exc)) return false;
  }
  // 포함 패턴 확인
  for (const inc of includes) {
    if (matchNamespace(namespace, inc)) return true;
  }
  return false;
}

export function createDebugger(prefix?: string, options: DebugOptions = {}): Debugger {
  const { output, now = Date.now } = options;

  let currentPattern = "";
  let includes: string[] = [];
  let excludes: string[] = [];
  const instances = new Map<string, { lastTime: number }>();

  const defaultOutput = (ns: string, msg: string, elapsed: number) => {
    console.debug(`[${ns}] ${msg} +${elapsed}ms`);
  };
  const sink = output ?? defaultOutput;

  const debugFn = ((namespace: string): DebugInstance => {
    const fullNs = prefix ? `${prefix}:${namespace.startsWith(prefix + ":") ? namespace.slice(prefix.length + 1) : namespace}` : namespace;
    const resolvedNs = namespace.includes(":") && !prefix ? namespace : (prefix ? `${prefix}:${namespace.replace(`${prefix}:`, "")}` : namespace);

    // 단순화: namespace를 그대로 사용
    const ns = namespace;

    if (!instances.has(ns)) {
      instances.set(ns, { lastTime: 0 });
    }
    const state = instances.get(ns)!;

    const instance = ((message: string, ...args: unknown[]) => {
      if (!isEnabled(ns, includes, excludes)) return;

      const currentTime = now();
      const elapsed = state.lastTime === 0 ? 0 : currentTime - state.lastTime;
      state.lastTime = currentTime;

      const formatted = args.length > 0
        ? `${message} ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")}`
        : message;

      sink(ns, formatted, elapsed);
    }) as DebugInstance;

    Object.defineProperty(instance, "namespace", { get: () => ns });
    Object.defineProperty(instance, "enabled", {
      get: () => isEnabled(ns, includes, excludes),
    });

    return instance;
  }) as Debugger;

  debugFn.enable = (pattern: string) => {
    currentPattern = pattern;
    includes = [];
    excludes = [];

    const parts = pattern.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      if (part.startsWith("-")) {
        excludes.push(part.slice(1));
      } else {
        includes.push(part);
      }
    }
  };

  debugFn.disable = () => {
    currentPattern = "";
    includes = [];
    excludes = [];
  };

  Object.defineProperty(debugFn, "pattern", { get: () => currentPattern });

  return debugFn;
}
