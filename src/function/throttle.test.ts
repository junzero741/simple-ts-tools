import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { throttle } from "./throttle";

describe("throttle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("첫 호출은 즉시 실행된다 (leading-edge)", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("interval 내 중복 호출은 무시되고 마지막 호출이 interval 후 실행된다", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();       // 즉시 실행 (call 1)
    vi.advanceTimersByTime(50);
    throttled();       // 50ms 뒤 호출 → interval 후 실행 예약
    throttled();       // 무시됨 (이미 예약됨)

    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("interval 경과 후 다시 호출하면 즉시 실행된다", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    vi.advanceTimersByTime(100);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it(".cancel()로 쿨다운을 초기화한다", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled.cancel();
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
