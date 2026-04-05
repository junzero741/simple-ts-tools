export interface PollOptions {
  /**
   * 시도 간격 (ms).
   * @default 1000
   */
  interval?: number;
  /**
   * 최대 대기 시간 (ms). 초과 시 reject.
   * 미지정 시 무제한 (predicate가 true가 될 때까지 계속).
   */
  timeout?: number;
  /**
   * 매 시도 전에 호출되는 콜백.
   * @param attempt 현재 시도 횟수 (1부터 시작)
   */
  onAttempt?: (attempt: number) => void;
}

export class PollTimeoutError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly elapsedMs: number,
    message?: string
  ) {
    super(message ?? `Polling timed out after ${attempts} attempts (${elapsedMs}ms)`);
    this.name = "PollTimeoutError";
  }
}

/**
 * 조건이 충족될 때까지 비동기 함수를 반복 호출한다.
 * `retry`(실패 시 재시도)와 달리 `poll`은 정상 응답을 받으면서 값을 검사한다.
 *
 * @example
 * // 백그라운드 잡 완료 대기
 * const job = await poll(
 *   () => fetchJobStatus(jobId),
 *   result => result.status === "done",
 *   { interval: 2000, timeout: 60_000 }
 * );
 *
 * // 서버 헬스 체크 — ready 상태가 될 때까지 1초마다 확인
 * await poll(
 *   () => fetch("/health").then(r => r.json()),
 *   res => res.status === "ok",
 *   { interval: 1000, timeout: 30_000 }
 * );
 *
 * @param fn 매 시도에 호출할 비동기 함수
 * @param predicate fn의 반환값이 이 조건을 충족하면 polling을 멈추고 반환
 * @param options polling 동작 옵션
 * @throws {PollTimeoutError} timeout 초과 시
 */
export async function poll<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: PollOptions = {}
): Promise<T> {
  const { interval = 1000, timeout, onAttempt } = options;
  const startTime = Date.now();
  let attempts = 0;

  while (true) {
    attempts++;
    onAttempt?.(attempts);

    const value = await fn();

    if (predicate(value)) {
      return value;
    }

    const elapsed = Date.now() - startTime;

    if (timeout !== undefined && elapsed + interval > timeout) {
      throw new PollTimeoutError(
        attempts,
        elapsed,
        `Polling timed out after ${attempts} attempts (${elapsed}ms)`
      );
    }

    await sleep(interval);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
