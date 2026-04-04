import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sleep } from "./sleep";

describe("sleep", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("지정한 시간 후 resolve된다", async () => {
    let resolved = false;
    sleep(100).then(() => { resolved = true; });

    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(true);
  });

  it("Promise<void>를 반환한다", () => {
    const result = sleep(0);
    expect(result).toBeInstanceOf(Promise);
  });
});
