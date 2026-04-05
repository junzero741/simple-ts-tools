import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCircuitBreaker, CircuitOpenError } from "./circuitBreaker";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const fail = () => Promise.reject(new Error("service error"));
const succeed = () => Promise.resolve("ok");

describe("CLOSED 상태 — 기본 동작", () => {
  it("초기 상태는 CLOSED다", () => {
    const breaker = createCircuitBreaker(succeed);
    expect(breaker.state).toBe("CLOSED");
  });

  it("성공 시 CLOSED 상태 유지", async () => {
    const breaker = createCircuitBreaker(succeed);
    await breaker.call();
    expect(breaker.state).toBe("CLOSED");
  });

  it("threshold 미만 실패는 CLOSED 유지", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 3 });

    for (let i = 0; i < 2; i++) {
      await expect(breaker.call()).rejects.toThrow("service error");
    }

    expect(breaker.state).toBe("CLOSED");
    expect(breaker.failures).toBe(2);
  });

  it("threshold 이상 실패하면 OPEN으로 전환된다", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 3 });

    for (let i = 0; i < 3; i++) {
      await expect(breaker.call()).rejects.toThrow();
    }

    expect(breaker.state).toBe("OPEN");
  });

  it("성공하면 연속 실패 카운터가 리셋된다", async () => {
    const breaker = createCircuitBreaker(
      vi.fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce("ok"),
      { threshold: 3 },
    );

    await expect(breaker.call()).rejects.toThrow();
    await expect(breaker.call()).rejects.toThrow();
    await breaker.call(); // 성공 → 실패 카운터 리셋

    expect(breaker.state).toBe("CLOSED");
    expect(breaker.failures).toBe(0);
  });
});

describe("OPEN 상태", () => {
  it("OPEN 상태에서 호출하면 CircuitOpenError를 던진다", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 1 });

    await expect(breaker.call()).rejects.toThrow();
    expect(breaker.state).toBe("OPEN");

    await expect(breaker.call()).rejects.toBeInstanceOf(CircuitOpenError);
  });

  it("CircuitOpenError는 state 필드를 가진다", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 1 });
    await expect(breaker.call()).rejects.toThrow();

    try {
      await breaker.call();
    } catch (e) {
      expect(e).toBeInstanceOf(CircuitOpenError);
      expect((e as CircuitOpenError).state).toBe("OPEN");
    }
  });

  it("resetTimeout 이전에는 OPEN 상태 유지", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 1, resetTimeout: 5000 });
    await expect(breaker.call()).rejects.toThrow();

    vi.advanceTimersByTime(4999);
    expect(breaker.state).toBe("OPEN");
  });

  it("resetTimeout 경과 후 호출하면 HALF_OPEN으로 전환된다", async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error("fail")).mockResolvedValue("ok");
    const breaker = createCircuitBreaker(mockFn, { threshold: 1, resetTimeout: 5000 });

    await expect(breaker.call()).rejects.toThrow();
    expect(breaker.state).toBe("OPEN");

    vi.advanceTimersByTime(5000);
    await breaker.call(); // 첫 호출이 HALF_OPEN 상태에서 실행됨
    expect(breaker.state).toBe("CLOSED");
  });
});

describe("HALF_OPEN 상태", () => {
  async function openBreaker(threshold = 1, resetTimeout = 1000) {
    const breaker = createCircuitBreaker(fail, { threshold, resetTimeout });
    for (let i = 0; i < threshold; i++) {
      await expect(breaker.call()).rejects.toThrow();
    }
    vi.advanceTimersByTime(resetTimeout);
    return breaker;
  }

  it("프로브 성공 시 CLOSED로 복귀한다", async () => {
    const mockFn = vi.fn().mockResolvedValue("recovered");
    const breaker = createCircuitBreaker(mockFn, { threshold: 1, resetTimeout: 1000 });
    await expect(createCircuitBreaker(fail, { threshold: 1 }).call()).rejects.toThrow();

    // 직접 HALF_OPEN 진입
    const b2 = createCircuitBreaker(
      vi.fn().mockRejectedValueOnce(new Error()).mockResolvedValue("ok"),
      { threshold: 1, resetTimeout: 1000 },
    );
    await expect(b2.call()).rejects.toThrow();
    vi.advanceTimersByTime(1000);

    await b2.call(); // HALF_OPEN → 성공 → CLOSED
    expect(b2.state).toBe("CLOSED");
  });

  it("프로브 실패 시 다시 OPEN으로 전환된다", async () => {
    const breaker = await openBreaker(1, 1000);
    // breaker는 이제 OPEN + resetTimeout 경과 → 다음 호출에서 HALF_OPEN

    // fail 함수를 계속 쓰고 있으므로 HALF_OPEN 프로브도 실패
    await expect(breaker.call()).rejects.toThrow();
    expect(breaker.state).toBe("OPEN");
  });

  it("successThreshold: 2이면 두 번 성공해야 CLOSED로 복귀한다", async () => {
    const mockFn = vi.fn().mockResolvedValue("ok");
    const failOnce = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    const breaker = createCircuitBreaker(failOnce, {
      threshold: 1,
      resetTimeout: 1000,
      successThreshold: 2,
    });

    await expect(breaker.call()).rejects.toThrow(); // OPEN
    vi.advanceTimersByTime(1000);

    await breaker.call(); // HALF_OPEN 첫 번째 성공
    expect(breaker.state).toBe("HALF_OPEN"); // 아직 HALF_OPEN

    await breaker.call(); // 두 번째 성공
    expect(breaker.state).toBe("CLOSED");
  });
});

describe("onStateChange 콜백", () => {
  it("상태 전이 시 콜백이 호출된다", async () => {
    const events: Array<{ from: string; to: string }> = [];
    const breaker = createCircuitBreaker(fail, {
      threshold: 1,
      resetTimeout: 1000,
      onStateChange: (e) => events.push(e),
    });

    await expect(breaker.call()).rejects.toThrow(); // CLOSED → OPEN
    expect(events).toEqual([{ from: "CLOSED", to: "OPEN" }]);
  });
});

describe("isFailure 옵션", () => {
  it("isFailure가 false를 반환하면 실패로 집계하지 않는다", async () => {
    class NotFoundError extends Error {}
    const notFound = () => Promise.reject(new NotFoundError("404"));

    const breaker = createCircuitBreaker(notFound, {
      threshold: 2,
      isFailure: (e) => !(e instanceof NotFoundError),
    });

    await expect(breaker.call()).rejects.toThrow();
    await expect(breaker.call()).rejects.toThrow();
    await expect(breaker.call()).rejects.toThrow();

    // NotFoundError는 실패로 간주하지 않으므로 여전히 CLOSED
    expect(breaker.state).toBe("CLOSED");
    expect(breaker.failures).toBe(0);
  });
});

describe("reset()", () => {
  it("OPEN 상태를 CLOSED로 강제 복귀한다", async () => {
    const breaker = createCircuitBreaker(fail, { threshold: 1 });
    await expect(breaker.call()).rejects.toThrow();
    expect(breaker.state).toBe("OPEN");

    breaker.reset();
    expect(breaker.state).toBe("CLOSED");
    expect(breaker.failures).toBe(0);
  });
});

describe("실사용 시나리오", () => {
  it("retry + circuitBreaker 조합 — 빠른 실패 전환", async () => {
    let callCount = 0;
    const flaky = async () => {
      callCount++;
      throw new Error("down");
    };

    const breaker = createCircuitBreaker(flaky, { threshold: 3 });

    // 3번 실패하면 OPEN
    for (let i = 0; i < 3; i++) {
      await expect(breaker.call()).rejects.toThrow();
    }
    expect(breaker.state).toBe("OPEN");

    // OPEN 상태에서는 실제 함수 호출 없이 즉시 에러
    await expect(breaker.call()).rejects.toBeInstanceOf(CircuitOpenError);
    expect(callCount).toBe(3); // 3번에서 멈춤
  });
});
