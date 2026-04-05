// 우아한 종료 관리자 (Graceful Shutdown Manager).
//
// === 예상 사용처 ===
// - Node.js 서버 종료 시 진행 중인 요청 완료 후 종료
// - DB 커넥션 풀 정리 (트랜잭션 커밋/롤백 완료 대기)
// - 메시지 큐 컨슈머 종료 (현재 처리 중인 메시지 완료 후 멈춤)
// - 크론잡/스케줄러 종료 (실행 중인 작업 완료 대기)
// - WebSocket 서버 종료 (클라이언트에 종료 알림 후 연결 닫기)
// - 임시 파일/리소스 정리 (캐시 flush, 로그 flush)
// - K8s pod 종료 시 SIGTERM → preStop hook → graceful drain
//
// const shutdown = createGracefulShutdown({ timeout: 30_000 });
//
// shutdown.register("http", async () => {
//   server.close();
//   await drainConnections();
// }, { priority: 10 });
//
// shutdown.register("db", async () => {
//   await pool.end();
// }, { priority: 0 });  // HTTP 종료 후 DB 종료
//
// // SIGTERM 시
// await shutdown.shutdown(); // priority 역순으로 정리

export interface ShutdownOptions {
  /** 전체 종료 타임아웃 ms. 초과 시 강제 종료 (기본: 30000). */
  timeout?: number;
}

export interface ShutdownHookOptions {
  /** 높은 priority가 먼저 종료된다 (기본: 0). */
  priority?: number;
}

export interface GracefulShutdown {
  /** 종료 훅을 등록한다. */
  register(
    name: string,
    hook: () => void | Promise<void>,
    options?: ShutdownHookOptions,
  ): GracefulShutdown;

  /** 등록된 훅을 priority 역순으로 실행한다. */
  shutdown(reason?: string): Promise<ShutdownReport>;

  /** 종료가 진행 중인지 여부. */
  readonly isShuttingDown: boolean;

  /** 등록된 훅 이름 (실행 순서대로). */
  readonly hooks: string[];
}

export interface ShutdownReport {
  success: boolean;
  completed: string[];
  failed: Array<{ name: string; error: string }>;
  timedOut: boolean;
  elapsed: number;
}

interface HookEntry {
  name: string;
  hook: () => void | Promise<void>;
  priority: number;
}

export function createGracefulShutdown(
  options: ShutdownOptions = {},
): GracefulShutdown {
  const { timeout = 30_000 } = options;
  const entries: HookEntry[] = [];
  let shuttingDown = false;

  function getSorted(): HookEntry[] {
    return [...entries].sort((a, b) => b.priority - a.priority);
  }

  const manager: GracefulShutdown = {
    register(name, hook, opts = {}) {
      if (entries.some((e) => e.name === name)) {
        throw new Error(`Shutdown hook "${name}" already registered`);
      }
      entries.push({ name, hook, priority: opts.priority ?? 0 });
      return manager;
    },

    async shutdown(reason?): Promise<ShutdownReport> {
      if (shuttingDown) {
        return { success: false, completed: [], failed: [{ name: "_", error: "Already shutting down" }], timedOut: false, elapsed: 0 };
      }
      shuttingDown = true;

      const start = Date.now();
      const sorted = getSorted();
      const completed: string[] = [];
      const failed: Array<{ name: string; error: string }> = [];
      let timedOut = false;

      const execute = async () => {
        for (const entry of sorted) {
          try {
            await entry.hook();
            completed.push(entry.name);
          } catch (err) {
            failed.push({ name: entry.name, error: (err as Error).message });
          }
        }
      };

      try {
        await Promise.race([
          execute(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Shutdown timeout")), timeout),
          ),
        ]);
      } catch {
        timedOut = true;
      }

      return {
        success: failed.length === 0 && !timedOut,
        completed,
        failed,
        timedOut,
        elapsed: Date.now() - start,
      };
    },

    get isShuttingDown() { return shuttingDown; },

    get hooks() {
      return getSorted().map((e) => e.name);
    },
  };

  return manager;
}
