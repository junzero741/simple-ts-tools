/**
 * Promise에 타임아웃을 걸어, 지정한 시간 내에 완료되지 않으면 reject한다.
 *
 * @param promise  감싸려는 Promise
 * @param ms       타임아웃 시간 (밀리초)
 * @param message  타임아웃 시 던질 에러 메시지 (기본: "Timed out after Xms")
 *
 * @example
 * const data = await timeout(fetch("/api/data"), 3000);
 * const result = await timeout(heavyJob(), 5000, "Job took too long");
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  const msg = message ?? `Timed out after ${ms}ms`;
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(msg)), ms)
  );
  return Promise.race([promise, timer]);
}
