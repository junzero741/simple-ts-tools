// 헬스체크 시스템 (Health Check).
//
// === 예상 사용처 ===
// - 마이크로서비스 /health 엔드포인트 (K8s liveness/readiness probe)
// - 서비스 시작 시 외부 의존성 연결 확인 (DB, Redis, S3, API)
// - 모니터링 대시보드에서 서비스 상태 표시
// - 배포 전 스모크 테스트 (모든 의존성 정상 여부)
// - 서킷 브레이커와 연동한 자동 복구 판단
// - Graceful shutdown 시 readiness probe 응답 변경
//
// const health = createHealthCheck();
//
// health.register("db", async () => {
//   await db.query("SELECT 1");
// });
//
// health.register("redis", async () => {
//   await redis.ping();
// }, { timeout: 3000, critical: true });
//
// const report = await health.check();
// // { status: "healthy", checks: { db: { status: "up", latency: 12 }, ... } }

export type CheckStatus = "up" | "down" | "degraded";
export type OverallStatus = "healthy" | "degraded" | "unhealthy";

export interface CheckOptions {
  /** 체크 타임아웃 ms (기본: 5000). */
  timeout?: number;
  /** true면 이 체크가 실패하면 전체가 unhealthy (기본: true). */
  critical?: boolean;
}

export interface CheckResult {
  status: CheckStatus;
  latency: number;
  error?: string;
  timestamp: number;
}

export interface HealthReport {
  status: OverallStatus;
  checks: Record<string, CheckResult>;
  timestamp: number;
  totalLatency: number;
}

export interface HealthCheck {
  /** 헬스 체크를 등록한다. */
  register(
    name: string,
    check: () => void | Promise<void>,
    options?: CheckOptions,
  ): HealthCheck;

  /** 등록된 모든 체크를 실행하고 리포트를 반환한다. */
  check(): Promise<HealthReport>;

  /** 특정 체크만 실행한다. */
  checkOne(name: string): Promise<CheckResult>;

  /** 전체가 healthy인지 확인한다 (K8s probe용). */
  isHealthy(): Promise<boolean>;

  /** 등록된 체크 이름 목록. */
  readonly names: string[];
}

interface Registration {
  name: string;
  check: () => void | Promise<void>;
  timeout: number;
  critical: boolean;
}

export function createHealthCheck(): HealthCheck {
  const checks = new Map<string, Registration>();

  async function runCheck(reg: Registration): Promise<CheckResult> {
    const start = Date.now();

    try {
      await Promise.race([
        Promise.resolve(reg.check()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Health check "${reg.name}" timed out after ${reg.timeout}ms`)), reg.timeout),
        ),
      ]);

      return {
        status: "up",
        latency: Date.now() - start,
        timestamp: Date.now(),
      };
    } catch (err) {
      return {
        status: "down",
        latency: Date.now() - start,
        error: (err as Error).message,
        timestamp: Date.now(),
      };
    }
  }

  const hc: HealthCheck = {
    register(name, check, options = {}) {
      const { timeout = 5000, critical = true } = options;
      checks.set(name, { name, check, timeout, critical });
      return hc;
    },

    async check(): Promise<HealthReport> {
      const start = Date.now();
      const results: Record<string, CheckResult> = {};

      const entries = [...checks.values()];
      const settled = await Promise.all(entries.map((reg) => runCheck(reg)));

      for (let i = 0; i < entries.length; i++) {
        results[entries[i].name] = settled[i];
      }

      // 전체 상태 결정
      let status: OverallStatus = "healthy";
      for (const entry of entries) {
        const result = results[entry.name];
        if (result.status === "down") {
          if (entry.critical) {
            status = "unhealthy";
            break;
          }
          if (status === "healthy") status = "degraded";
        }
      }

      return {
        status,
        checks: results,
        timestamp: Date.now(),
        totalLatency: Date.now() - start,
      };
    },

    async checkOne(name) {
      const reg = checks.get(name);
      if (!reg) throw new Error(`Health check "${name}" not found`);
      return runCheck(reg);
    },

    async isHealthy() {
      const report = await hc.check();
      return report.status === "healthy";
    },

    get names() { return [...checks.keys()]; },
  };

  return hc;
}
