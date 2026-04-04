import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retry } from "./retry";

describe("retry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("첫 시도에 성공하면 그대로 반환한다", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("실패 후 재시도하여 성공하면 결과를 반환한다", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    // catch로 즉시 핸들러 부착 → unhandled rejection 방지
    const resultPromise = retry(fn, { attempts: 3, delay: 100 })
      .catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    expect(await resultPromise).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("모든 시도가 실패하면 마지막 에러를 throw한다", async () => {
    const error = new Error("always fails");
    const fn = vi.fn().mockRejectedValue(error);

    let caught: unknown;
    const done = retry(fn, { attempts: 3, delay: 100 })
      .catch((e: unknown) => { caught = e; });
    await vi.runAllTimersAsync();
    await done;

    expect(caught).toBe(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("지수 백오프로 대기 시간이 늘어난다", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    const recordedDelays: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.spyOn(globalThis, "setTimeout").mockImplementation((cb, delay, ...args) => {
      recordedDelays.push(delay ?? 0);
      return realSetTimeout(cb, delay, ...args);
    });

    let caught: unknown;
    const done = retry(fn, { attempts: 3, delay: 100, backoff: 2 })
      .catch((e: unknown) => { caught = e; });
    await vi.runAllTimersAsync();
    await done;

    expect(caught).toBeInstanceOf(Error);
    expect(recordedDelays).toContain(100); // 1차 대기
    expect(recordedDelays).toContain(200); // 2차 대기
  });

  it("when 조건이 false면 즉시 throw한다", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("not retryable"));

    let caught: unknown;
    const done = retry(fn, {
      attempts: 3,
      when: (e) => (e as Error).message !== "not retryable",
    }).catch((e: unknown) => { caught = e; });
    await vi.runAllTimersAsync();
    await done;

    expect((caught as Error).message).toBe("not retryable");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
