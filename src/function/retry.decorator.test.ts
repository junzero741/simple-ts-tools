import { describe, it, expect, vi } from "vitest";
import {
  withTiming, withFallback, withLogging,
  withTransform, withMaxCalls, withDelay, withValidation,
} from "./retry.decorator";

describe("withTiming", () => {
  it("실행 시간을 측정한다", () => {
    const onTiming = vi.fn();
    const fn = withTiming((n: number) => n * 2, onTiming);

    expect(fn(5)).toBe(10);
    expect(onTiming).toHaveBeenCalledOnce();
    expect(onTiming.mock.calls[0][0]).toBeGreaterThanOrEqual(0);
  });

  it("async 함수도 지원한다", async () => {
    const onTiming = vi.fn();
    const fn = withTiming(
      async () => { await new Promise((r) => setTimeout(r, 10)); return "ok"; },
      onTiming,
    );

    expect(await fn()).toBe("ok");
    expect(onTiming.mock.calls[0][0]).toBeGreaterThanOrEqual(5);
  });
});

describe("withFallback", () => {
  it("정상이면 원래 결과 반환", () => {
    const fn = withFallback(() => 42, () => 0);
    expect(fn()).toBe(42);
  });

  it("에러 시 fallback 반환", () => {
    const fn = withFallback(
      () => { throw new Error("fail"); },
      () => "default",
    );
    expect(fn()).toBe("default");
  });

  it("async 에러 시 fallback", async () => {
    const fn = withFallback(
      async () => { throw new Error("fail"); },
      async () => "fallback",
    );
    expect(await fn()).toBe("fallback");
  });
});

describe("withLogging", () => {
  it("before/after 콜백을 실행한다", () => {
    const before = vi.fn();
    const after = vi.fn();
    const fn = withLogging((x: number) => x + 1, { before, after });

    fn(5);
    expect(before).toHaveBeenCalledWith([5]);
    expect(after).toHaveBeenCalledWith(6, [5]);
  });

  it("에러 시 onError 콜백", () => {
    const onError = vi.fn();
    const fn = withLogging(
      () => { throw new Error("boom"); },
      { onError },
    );

    expect(() => fn()).toThrow("boom");
    expect(onError).toHaveBeenCalledOnce();
  });
});

describe("withTransform", () => {
  it("결과를 변환한다", () => {
    const fn = withTransform((n: number) => n * 2, (r) => `result: ${r}`);
    expect(fn(5)).toBe("result: 10");
  });

  it("async 결과 변환", async () => {
    const fn = withTransform(async (n: number) => n, (r) => r + 1);
    expect(await fn(5)).toBe(6);
  });
});

describe("withMaxCalls", () => {
  it("n회까지만 실행한다", () => {
    let count = 0;
    const fn = withMaxCalls(() => ++count, 3);

    expect(fn()).toBe(1);
    expect(fn()).toBe(2);
    expect(fn()).toBe(3);
    expect(fn()).toBe(3); // 마지막 결과 반환
    expect(fn()).toBe(3);
  });
});

describe("withDelay", () => {
  it("지연 후 실행한다", async () => {
    const start = Date.now();
    const fn = withDelay(() => 42, 30);

    expect(await fn()).toBe(42);
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });
});

describe("withValidation", () => {
  it("검증 통과 시 정상 실행", () => {
    const fn = withValidation(
      (n: number) => n * 2,
      (n) => { if (n < 0) throw new Error("must be positive"); },
    );

    expect(fn(5)).toBe(10);
  });

  it("검증 실패 시 에러", () => {
    const fn = withValidation(
      (n: number) => n * 2,
      (n) => { if (n < 0) throw new Error("must be positive"); },
    );

    expect(() => fn(-1)).toThrow("must be positive");
  });
});

describe("합성", () => {
  it("여러 데코레이터를 합성한다", () => {
    const timings: number[] = [];

    const fn = withTiming(
      withFallback(
        (n: number) => {
          if (n === 0) throw new Error("zero");
          return 100 / n;
        },
        () => 0,
      ),
      (elapsed) => timings.push(elapsed),
    );

    expect(fn(5)).toBe(20);
    expect(fn(0)).toBe(0); // fallback
    expect(timings.length).toBe(2);
  });
});
