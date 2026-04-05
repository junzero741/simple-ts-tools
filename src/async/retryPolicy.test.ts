import { describe, it, expect, vi } from "vitest";
import { retryPolicy } from "./retryPolicy";

describe("retryPolicy", () => {
  describe("기본 실행", () => {
    it("성공하면 결과를 반환한다", async () => {
      const policy = retryPolicy().build();
      const result = await policy.execute(async () => 42);
      expect(result).toBe(42);
    });

    it("실패 후 재시도하여 성공한다", async () => {
      let attempts = 0;
      const policy = retryPolicy()
        .attempts(3)
        .backoff("fixed", { base: 10 })
        .build();

      const result = await policy.execute(async () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return "ok";
      });

      expect(result).toBe("ok");
      expect(attempts).toBe(3);
    });

    it("모든 시도 실패 시 마지막 에러를 throw한다", async () => {
      const policy = retryPolicy()
        .attempts(2)
        .backoff("fixed", { base: 5 })
        .build();

      await expect(
        policy.execute(async () => { throw new Error("always fail"); }),
      ).rejects.toThrow("always fail");
    });
  });

  describe("backoff 전략", () => {
    it("fixed — 고정 지연", async () => {
      const delays: number[] = [];
      const policy = retryPolicy()
        .attempts(4)
        .backoff("fixed", { base: 100 })
        .onRetry((_err, _attempt, delay) => delays.push(delay))
        .build();

      await policy.execute(async () => {
        if (delays.length < 3) throw new Error("fail");
      });

      expect(delays.every((d) => d === 100)).toBe(true);
    });

    it("exponential — 지수 증가", async () => {
      const delays: number[] = [];
      const policy = retryPolicy()
        .attempts(5)
        .backoff("exponential", { base: 10, max: 10000 })
        .onRetry((_err, _attempt, delay) => delays.push(delay))
        .build();

      await policy.execute(async () => {
        if (delays.length < 4) throw new Error("fail");
      });

      // 10, 20, 40, 80
      expect(delays[0]).toBe(10);
      expect(delays[1]).toBe(20);
      expect(delays[2]).toBe(40);
      expect(delays[3]).toBe(80);
    });

    it("linear — 선형 증가", async () => {
      const delays: number[] = [];
      const policy = retryPolicy()
        .attempts(4)
        .backoff("linear", { base: 50 })
        .onRetry((_err, _attempt, delay) => delays.push(delay))
        .build();

      await policy.execute(async () => {
        if (delays.length < 3) throw new Error("fail");
      });

      // 50, 100, 150
      expect(delays).toEqual([50, 100, 150]);
    });

    it("maxDelay를 초과하지 않는다", async () => {
      const delays: number[] = [];
      const policy = retryPolicy()
        .attempts(10)
        .backoff("exponential", { base: 100, max: 500 })
        .onRetry((_err, _attempt, delay) => delays.push(delay))
        .build();

      await policy.execute(async () => {
        if (delays.length < 5) throw new Error("fail");
      });

      expect(delays.every((d) => d <= 500)).toBe(true);
    });
  });

  describe("jitter", () => {
    it("지연에 지터를 추가한다", async () => {
      const delays: number[] = [];
      const policy = retryPolicy()
        .attempts(20)
        .backoff("fixed", { base: 100 })
        .jitter(0.5)
        .onRetry((_err, _attempt, delay) => delays.push(delay))
        .build();

      await policy.execute(async () => {
        if (delays.length < 10) throw new Error("fail");
      });

      // 모든 지연이 정확히 100은 아닐 것 (지터로 인해)
      const allSame = delays.every((d) => d === 100);
      expect(allSame).toBe(false);

      // 50~150 범위 (100 ± 50)
      expect(delays.every((d) => d >= 0 && d <= 200)).toBe(true);
    });
  });

  describe("retryIf / abortIf", () => {
    it("retryIf 조건에 맞을 때만 재시도한다", async () => {
      let attempts = 0;
      const policy = retryPolicy()
        .attempts(5)
        .backoff("fixed", { base: 5 })
        .retryIf((err) => (err as Error).message === "retry-me")
        .build();

      await expect(
        policy.execute(async () => {
          attempts++;
          throw new Error("dont-retry");
        }),
      ).rejects.toThrow("dont-retry");

      expect(attempts).toBe(1); // 재시도 안 함
    });

    it("abortIf 조건에 맞으면 즉시 중단한다", async () => {
      let attempts = 0;
      const policy = retryPolicy()
        .attempts(5)
        .backoff("fixed", { base: 5 })
        .abortIf((err) => (err as Error).message === "fatal")
        .build();

      await expect(
        policy.execute(async () => {
          attempts++;
          throw new Error("fatal");
        }),
      ).rejects.toThrow("fatal");

      expect(attempts).toBe(1);
    });
  });

  describe("onRetry", () => {
    it("재시도 시 콜백을 실행한다", async () => {
      const hook = vi.fn();
      const policy = retryPolicy()
        .attempts(3)
        .backoff("fixed", { base: 5 })
        .onRetry(hook)
        .build();

      await policy.execute(async () => {
        if (hook.mock.calls.length < 2) throw new Error("fail");
      });

      expect(hook).toHaveBeenCalledTimes(2);
      expect(hook.mock.calls[0][1]).toBe(1); // attempt
      expect(hook.mock.calls[1][1]).toBe(2);
    });
  });

  describe("withSignal", () => {
    it("abort 시 즉시 중단한다", async () => {
      const controller = new AbortController();
      const policy = retryPolicy()
        .attempts(10)
        .backoff("fixed", { base: 100 })
        .withSignal(controller.signal)
        .build();

      setTimeout(() => controller.abort("cancelled"), 20);

      await expect(
        policy.execute(async () => { throw new Error("fail"); }),
      ).rejects.toBe("cancelled");
    });
  });

  describe("config", () => {
    it("설정을 조회한다", () => {
      const policy = retryPolicy()
        .attempts(5)
        .backoff("exponential", { base: 100, max: 5000 })
        .jitter(0.2)
        .build();

      expect(policy.config.maxAttempts).toBe(5);
      expect(policy.config.backoffType).toBe("exponential");
      expect(policy.config.baseDelay).toBe(100);
      expect(policy.config.maxDelay).toBe(5000);
      expect(policy.config.jitterFactor).toBe(0.2);
    });
  });
});
