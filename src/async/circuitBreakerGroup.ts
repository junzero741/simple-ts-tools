// 서킷 브레이커 그룹 (Circuit Breaker Group / Service Mesh).
//
// === 예상 사용처 ===
// - 마이크로서비스 게이트웨이에서 다운스트림 서비스별 헬스 관리
// - BFF(Backend For Frontend)에서 여러 API 호출의 개별 차단/복구
// - 모니터링 대시보드에서 전체 서비스 상태 한눈에 표시
// - 장애 전파 차단 — 하나의 서비스 장애가 전체로 확산 방지
// - 자동 복구 — half-open 상태에서 프로브 요청으로 복구 판단
// - SLA 보고서 — 서비스별 성공률/에러율/응답시간 기록
//
// const services = createCircuitBreakerGroup({
//   defaultOptions: { threshold: 5, resetTimeout: 30_000 },
// });
//
// services.register("user-api", { threshold: 3 });
// services.register("payment-api", { threshold: 10 });
//
// await services.call("user-api", () => fetchUsers());
// services.status(); // { "user-api": "closed", "payment-api": "closed" }

type BreakerState = "closed" | "open" | "half-open";

export interface BreakerOptions {
  /** 연속 실패 n회 후 open (기본: 5). */
  threshold?: number;
  /** open → half-open 전환까지 대기 ms (기본: 30000). */
  resetTimeout?: number;
  /** half-open에서 성공 n회 후 closed (기본: 1). */
  successThreshold?: number;
}

export interface BreakerStats {
  state: BreakerState;
  failures: number;
  successes: number;
  totalCalls: number;
  totalFailures: number;
  lastFailure?: number;
}

export interface CircuitBreakerGroup {
  /** 서킷 브레이커를 등록한다. */
  register(name: string, options?: BreakerOptions): CircuitBreakerGroup;

  /** 서킷을 통해 함수를 실행한다. open 상태면 즉시 에러. */
  call<T>(name: string, fn: () => T | Promise<T>): Promise<T>;

  /** 전체 상태 맵을 반환한다. */
  status(): Record<string, BreakerState>;

  /** 특정 서킷의 상세 통계. */
  stats(name: string): BreakerStats;

  /** 서킷을 강제로 리셋한다 (closed). */
  reset(name: string): void;

  /** 전체 서킷을 리셋한다. */
  resetAll(): void;

  /** 상태 변경 구독. */
  onStateChange(handler: (name: string, from: BreakerState, to: BreakerState) => void): () => void;

  /** 등록된 서킷 이름 목록. */
  readonly names: string[];
}

export interface CircuitBreakerGroupOptions {
  defaultOptions?: BreakerOptions;
}

interface Breaker {
  name: string;
  state: BreakerState;
  failures: number;
  successes: number;
  totalCalls: number;
  totalFailures: number;
  lastFailure?: number;
  threshold: number;
  resetTimeout: number;
  successThreshold: number;
  timer?: ReturnType<typeof setTimeout>;
}

export function createCircuitBreakerGroup(
  groupOptions: CircuitBreakerGroupOptions = {},
): CircuitBreakerGroup {
  const { defaultOptions = {} } = groupOptions;
  const breakers = new Map<string, Breaker>();
  const listeners = new Set<(name: string, from: BreakerState, to: BreakerState) => void>();

  function transition(breaker: Breaker, newState: BreakerState): void {
    if (breaker.state === newState) return;
    const from = breaker.state;
    breaker.state = newState;
    for (const h of listeners) h(breaker.name, from, newState);
  }

  function getBreaker(name: string): Breaker {
    const b = breakers.get(name);
    if (!b) throw new Error(`Circuit breaker "${name}" not registered`);
    return b;
  }

  function startResetTimer(breaker: Breaker): void {
    if (breaker.timer) clearTimeout(breaker.timer);
    breaker.timer = setTimeout(() => {
      if (breaker.state === "open") {
        transition(breaker, "half-open");
      }
    }, breaker.resetTimeout);
  }

  const group: CircuitBreakerGroup = {
    register(name, options = {}) {
      const {
        threshold = defaultOptions.threshold ?? 5,
        resetTimeout = defaultOptions.resetTimeout ?? 30_000,
        successThreshold = defaultOptions.successThreshold ?? 1,
      } = options;

      breakers.set(name, {
        name,
        state: "closed",
        failures: 0,
        successes: 0,
        totalCalls: 0,
        totalFailures: 0,
        threshold,
        resetTimeout,
        successThreshold,
      });

      return group;
    },

    async call<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
      const breaker = getBreaker(name);
      breaker.totalCalls++;

      if (breaker.state === "open") {
        throw new Error(`Circuit "${name}" is open`);
      }

      try {
        const result = await fn();

        if (breaker.state === "half-open") {
          breaker.successes++;
          if (breaker.successes >= breaker.successThreshold) {
            breaker.failures = 0;
            breaker.successes = 0;
            transition(breaker, "closed");
          }
        } else {
          breaker.failures = 0;
        }

        return result;
      } catch (err) {
        breaker.failures++;
        breaker.totalFailures++;
        breaker.lastFailure = Date.now();
        breaker.successes = 0;

        if (breaker.state === "half-open") {
          transition(breaker, "open");
          startResetTimer(breaker);
        } else if (breaker.failures >= breaker.threshold) {
          transition(breaker, "open");
          startResetTimer(breaker);
        }

        throw err;
      }
    },

    status() {
      const result: Record<string, BreakerState> = {};
      for (const [name, b] of breakers) result[name] = b.state;
      return result;
    },

    stats(name) {
      const b = getBreaker(name);
      return {
        state: b.state,
        failures: b.failures,
        successes: b.successes,
        totalCalls: b.totalCalls,
        totalFailures: b.totalFailures,
        lastFailure: b.lastFailure,
      };
    },

    reset(name) {
      const b = getBreaker(name);
      if (b.timer) clearTimeout(b.timer);
      b.failures = 0;
      b.successes = 0;
      transition(b, "closed");
    },

    resetAll() {
      for (const name of breakers.keys()) group.reset(name);
    },

    onStateChange(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },

    get names() { return [...breakers.keys()]; },
  };

  return group;
}
