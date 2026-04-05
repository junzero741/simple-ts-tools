/**
 * 서킷 브레이커(Circuit Breaker) 패턴.
 *
 * 외부 서비스 호출 실패율이 임계치를 초과하면 회로를 열어(OPEN) 즉시 에러를 반환하고,
 * 일정 시간 후 절반만 열어(HALF_OPEN) 복구 여부를 탐색한다.
 *
 * ## 상태 전이
 * ```
 * CLOSED ──[실패율 ≥ threshold]──▶ OPEN
 *   ▲                                 │
 *   │                             [resetTimeout]
 *   │                                 ▼
 *   └──[프로브 성공]────────── HALF_OPEN
 *                                     │
 *                            [프로브 실패]
 *                                     │
 *                                     ▼
 *                                   OPEN (재진입)
 * ```
 *
 * ## retry와의 차이
 * - `retry` — 개별 호출의 일시적 실패를 재시도로 극복
 * - `circuitBreaker` — 연속 실패를 감지해 **호출 자체를 차단**, 서비스 전체 부하 방지
 *
 * @example
 * const breaker = createCircuitBreaker(fetchUser, {
 *   threshold: 5,        // 5번 연속 실패 시 OPEN
 *   resetTimeout: 10_000, // 10초 후 HALF_OPEN
 * });
 *
 * // 정상 호출
 * const user = await breaker.call("user-123");
 *
 * // 회로가 열린 상태에서 호출하면 즉시 CircuitOpenError
 * try {
 *   await breaker.call("user-456");
 * } catch (e) {
 *   if (e instanceof CircuitOpenError) console.log("서킷 오픈 — 나중에 재시도");
 * }
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /**
   * CLOSED 상태에서 OPEN으로 전환될 연속 실패 횟수.
   * @default 5
   */
  threshold?: number;

  /**
   * OPEN → HALF_OPEN 전환까지 대기 시간 (ms).
   * @default 60_000 (1분)
   */
  resetTimeout?: number;

  /**
   * HALF_OPEN 상태에서 성공으로 인정할 연속 성공 횟수.
   * 이 횟수만큼 성공하면 CLOSED로 복귀한다.
   * @default 1
   */
  successThreshold?: number;

  /**
   * 실패 여부를 판단하는 함수. 기본값은 모든 thrown error를 실패로 처리.
   * 특정 HTTP 상태(404 등)는 실패로 보지 않을 때 유용하다.
   */
  isFailure?: (error: unknown) => boolean;

  /**
   * 상태 전이 시 호출되는 콜백.
   */
  onStateChange?: (event: StateChangeEvent) => void;
}

export interface StateChangeEvent {
  from: CircuitState;
  to: CircuitState;
}

export interface CircuitBreaker<TArgs extends unknown[], TReturn> {
  /** 서킷 브레이커를 통해 대상 함수를 호출한다. */
  call(...args: TArgs): Promise<TReturn>;

  /** 현재 서킷 상태 */
  readonly state: CircuitState;

  /** 현재 연속 실패 횟수 */
  readonly failures: number;

  /** 서킷을 강제로 닫는다 (운영/테스트 용도). */
  reset(): void;
}

/**
 * 회로가 OPEN 상태일 때 호출되면 던져지는 에러.
 */
export class CircuitOpenError extends Error {
  constructor(public readonly state: CircuitState) {
    super(`Circuit is ${state} — call rejected`);
    this.name = "CircuitOpenError";
  }
}

export function createCircuitBreaker<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: CircuitBreakerOptions = {},
): CircuitBreaker<TArgs, TReturn> {
  const {
    threshold = 5,
    resetTimeout = 60_000,
    successThreshold = 1,
    isFailure = () => true,
    onStateChange,
  } = options;

  let state: CircuitState = "CLOSED";
  let failureCount = 0;
  let successCount = 0;
  let openedAt: number | null = null;

  function transition(to: CircuitState): void {
    const from = state;
    if (from === to) return;
    state = to;
    if (to === "OPEN") {
      openedAt = Date.now();
      failureCount = 0;
      successCount = 0;
    } else if (to === "HALF_OPEN") {
      failureCount = 0;
      successCount = 0;
    } else {
      failureCount = 0;
      successCount = 0;
      openedAt = null;
    }
    onStateChange?.({ from, to });
  }

  function handleSuccess(): void {
    if (state === "HALF_OPEN") {
      successCount++;
      if (successCount >= successThreshold) {
        transition("CLOSED");
      }
    } else if (state === "CLOSED") {
      failureCount = 0;
    }
  }

  function handleFailure(error: unknown): void {
    if (!isFailure(error)) return;

    if (state === "HALF_OPEN") {
      transition("OPEN");
    } else if (state === "CLOSED") {
      failureCount++;
      if (failureCount >= threshold) {
        transition("OPEN");
      }
    }
  }

  return {
    async call(...args: TArgs): Promise<TReturn> {
      if (state === "OPEN") {
        const elapsed = Date.now() - (openedAt ?? 0);
        if (elapsed >= resetTimeout) {
          transition("HALF_OPEN");
        } else {
          throw new CircuitOpenError(state);
        }
      }

      if (state === "HALF_OPEN" || state === "CLOSED") {
        try {
          const result = await fn(...args);
          handleSuccess();
          return result;
        } catch (error) {
          handleFailure(error);
          throw error;
        }
      }

      throw new CircuitOpenError(state);
    },

    get state(): CircuitState {
      return state;
    },

    get failures(): number {
      return failureCount;
    },

    reset(): void {
      transition("CLOSED");
    },
  };
}
