export interface RetryOptions {
  /** 최대 재시도 횟수 (기본값: 3) */
  attempts?: number;
  /** 첫 재시도 대기 시간 ms (기본값: 200) */
  delay?: number;
  /** 재시도마다 delay에 곱할 배수 (기본값: 2 — 지수 백오프) */
  backoff?: number;
  /** 특정 에러에만 재시도할 조건 함수 */
  when?: (error: unknown) => boolean;
}

/**
 * 비동기 함수가 실패하면 지수 백오프로 재시도한다.
 * 모든 시도가 실패하면 마지막 에러를 throw한다.
 * @example
 * const data = await retry(() => fetch("/api/data").then(r => r.json()), { attempts: 3, delay: 500 });
 * @complexity Time: O(attempts) | Space: O(1)
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, delay = 200, backoff = 2, when } = options;

  let lastError: unknown;
  let wait = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLast = attempt === attempts;
      const shouldRetry = when ? when(error) : true;

      if (isLast || !shouldRetry) break;

      await new Promise((resolve) => setTimeout(resolve, wait));
      wait *= backoff;
    }
  }

  throw lastError;
}
