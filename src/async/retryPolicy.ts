// 재시도 정책 빌더 (Retry Policy Builder).
//
// 기존 retry()가 단순 옵션 객체라면, 이건 빌더 패턴으로
// 지수 백오프 + 지터 + 에러 조건 분기 + abort + onRetry 콜백을
// 선언적으로 구성한다.
//
// const policy = retryPolicy()
//   .attempts(5)
//   .backoff("exponential", { base: 200, max: 10_000 })
//   .jitter(0.25)
//   .retryIf(err => err instanceof NetworkError)
//   .abortIf(err => err instanceof AuthError)
//   .onRetry((err, attempt) => log(err, attempt))
//   .build();
//
// const data = await policy.execute(() => fetchData());

export interface RetryPolicyConfig {
  maxAttempts: number;
  backoffType: "fixed" | "linear" | "exponential";
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
  retryCondition?: (error: unknown) => boolean;
  abortCondition?: (error: unknown) => boolean;
  onRetryHook?: (error: unknown, attempt: number, delay: number) => void;
  signal?: AbortSignal;
}

export interface RetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  readonly config: Readonly<RetryPolicyConfig>;
}

export interface RetryPolicyBuilder {
  attempts(n: number): RetryPolicyBuilder;
  backoff(type: "fixed" | "linear" | "exponential", opts?: { base?: number; max?: number }): RetryPolicyBuilder;
  jitter(factor: number): RetryPolicyBuilder;
  retryIf(condition: (error: unknown) => boolean): RetryPolicyBuilder;
  abortIf(condition: (error: unknown) => boolean): RetryPolicyBuilder;
  onRetry(hook: (error: unknown, attempt: number, delay: number) => void): RetryPolicyBuilder;
  withSignal(signal: AbortSignal): RetryPolicyBuilder;
  build(): RetryPolicy;
}

function computeDelay(config: RetryPolicyConfig, attempt: number): number {
  let delay: number;

  switch (config.backoffType) {
    case "fixed":
      delay = config.baseDelay;
      break;
    case "linear":
      delay = config.baseDelay * attempt;
      break;
    case "exponential":
      delay = config.baseDelay * Math.pow(2, attempt - 1);
      break;
  }

  // max cap
  delay = Math.min(delay, config.maxDelay);

  // jitter
  if (config.jitterFactor > 0) {
    const jitter = delay * config.jitterFactor;
    delay += (Math.random() * 2 - 1) * jitter;
    delay = Math.max(0, delay);
  }

  return Math.round(delay);
}

export function retryPolicy(): RetryPolicyBuilder {
  const cfg: RetryPolicyConfig = {
    maxAttempts: 3,
    backoffType: "exponential",
    baseDelay: 200,
    maxDelay: 30_000,
    jitterFactor: 0,
  };

  const builder: RetryPolicyBuilder = {
    attempts(n) { cfg.maxAttempts = n; return builder; },

    backoff(type, opts) {
      cfg.backoffType = type;
      if (opts?.base !== undefined) cfg.baseDelay = opts.base;
      if (opts?.max !== undefined) cfg.maxDelay = opts.max;
      return builder;
    },

    jitter(factor) { cfg.jitterFactor = factor; return builder; },
    retryIf(condition) { cfg.retryCondition = condition; return builder; },
    abortIf(condition) { cfg.abortCondition = condition; return builder; },
    onRetry(hook) { cfg.onRetryHook = hook; return builder; },
    withSignal(signal) { cfg.signal = signal; return builder; },

    build(): RetryPolicy {
      const frozen = { ...cfg };

      return {
        async execute<T>(fn: () => Promise<T>): Promise<T> {
          let lastError: unknown;

          for (let attempt = 1; attempt <= frozen.maxAttempts; attempt++) {
            if (frozen.signal?.aborted) {
              throw frozen.signal.reason ?? new Error("Aborted");
            }

            try {
              return await fn();
            } catch (error) {
              lastError = error;

              // abort 조건 체크
              if (frozen.abortCondition?.(error)) throw error;

              // retry 조건 체크
              if (frozen.retryCondition && !frozen.retryCondition(error)) throw error;

              // 마지막 시도면 throw
              if (attempt === frozen.maxAttempts) throw error;

              const delay = computeDelay(frozen, attempt);

              // onRetry 콜백
              frozen.onRetryHook?.(error, attempt, delay);

              // 대기
              await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, delay);
                if (frozen.signal) {
                  const onAbort = () => {
                    clearTimeout(timer);
                    reject(frozen.signal!.reason ?? new Error("Aborted"));
                  };
                  if (frozen.signal.aborted) {
                    clearTimeout(timer);
                    reject(frozen.signal.reason ?? new Error("Aborted"));
                  } else {
                    frozen.signal.addEventListener("abort", onAbort, { once: true });
                  }
                }
              });
            }
          }

          throw lastError;
        },

        get config() { return frozen; },
      };
    },
  };

  return builder;
}
