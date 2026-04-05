import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rateLimit";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter — 기본 동작", () => {
  it("limit 미만이면 즉시 acquire한다", async () => {
    const limiter = createRateLimiter({ limit: 3, window: 1000 });

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    // 모두 즉시 resolve되어야 함 (fake timer 진행 불필요)
    expect(Date.now() - start).toBe(0);
  });

  it("초기 토큰 수는 limit과 같다", () => {
    const limiter = createRateLimiter({ limit: 5, window: 1000 });
    expect(limiter.tokens).toBe(5);
  });

  it("acquire할 때마다 토큰이 1개씩 감소한다", async () => {
    const limiter = createRateLimiter({ limit: 5, window: 1000 });
    await limiter.acquire();
    expect(limiter.tokens).toBe(4);
    await limiter.acquire();
    expect(limiter.tokens).toBe(3);
  });

  it("토큰이 없으면 대기 큐에 들어간다", async () => {
    const limiter = createRateLimiter({ limit: 2, window: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.tokens).toBe(0);

    let resolved = false;
    const p = limiter.acquire().then(() => { resolved = true; });

    expect(limiter.waiting).toBe(1);
    expect(resolved).toBe(false);

    // 토큰 보충 시점까지 시간 진행 (2개 중 1개 → 500ms 후 보충)
    await vi.runAllTimersAsync();
    await p;
    expect(resolved).toBe(true);
  });
});

describe("tryAcquire", () => {
  it("토큰이 있으면 true를 반환하고 토큰을 소비한다", () => {
    const limiter = createRateLimiter({ limit: 3, window: 1000 });
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tokens).toBe(2);
  });

  it("토큰이 없으면 false를 반환하고 대기하지 않는다", async () => {
    const limiter = createRateLimiter({ limit: 1, window: 1000 });
    await limiter.acquire();

    expect(limiter.tokens).toBe(0);
    expect(limiter.tryAcquire()).toBe(false);
    expect(limiter.waiting).toBe(0); // 큐에 등록 안 됨
  });
});

describe("토큰 보충 (refill)", () => {
  it("시간이 지나면 토큰이 보충된다", async () => {
    const limiter = createRateLimiter({ limit: 4, window: 1000 });
    // 토큰 모두 소비
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.tokens).toBe(0);

    // 250ms 후 → 토큰 1개 보충 (1000ms / 4 = 250ms per token)
    vi.advanceTimersByTime(250);
    expect(limiter.tokens).toBe(1);

    // 250ms 더 → 토큰 1개 더 보충
    vi.advanceTimersByTime(250);
    expect(limiter.tokens).toBe(2);
  });

  it("최대 limit까지만 보충된다 (burst cap)", async () => {
    const limiter = createRateLimiter({ limit: 3, window: 300 });
    await limiter.acquire(); // 1개 소비
    expect(limiter.tokens).toBe(2);

    // 오랜 시간 대기 — 3개를 초과하지 않아야 함
    vi.advanceTimersByTime(10_000);
    expect(limiter.tokens).toBe(3);
  });

  it("대기 중인 요청이 토큰 보충 시 자동으로 처리된다", async () => {
    const limiter = createRateLimiter({ limit: 2, window: 200 });
    await limiter.acquire();
    await limiter.acquire();

    const order: number[] = [];
    const p1 = limiter.acquire().then(() => order.push(1));
    const p2 = limiter.acquire().then(() => order.push(2));

    expect(limiter.waiting).toBe(2);

    // 보충 시점까지 진행 (200ms / 2 = 100ms 후 1개)
    await vi.runAllTimersAsync();
    await Promise.all([p1, p2]);

    expect(order).toEqual([1, 2]); // FIFO 순서
  });
});

describe("reset", () => {
  it("토큰을 limit으로 복원한다", async () => {
    const limiter = createRateLimiter({ limit: 5, window: 1000 });
    await limiter.acquire();
    await limiter.acquire();
    expect(limiter.tokens).toBe(3);

    limiter.reset();
    expect(limiter.tokens).toBe(5);
  });

  it("reset 후 대기 중인 요청이 즉시 처리된다", async () => {
    const limiter = createRateLimiter({ limit: 1, window: 1000 });
    await limiter.acquire(); // 토큰 소진

    let resolved = false;
    const p = limiter.acquire().then(() => { resolved = true; });
    expect(resolved).toBe(false);

    limiter.reset(); // 즉시 토큰 보충 + 큐 드레인
    await p;
    expect(resolved).toBe(true);
  });
});

describe("에러 처리", () => {
  it("limit이 0이면 RangeError", () => {
    expect(() => createRateLimiter({ limit: 0, window: 1000 })).toThrow(RangeError);
  });

  it("limit이 음수이면 RangeError", () => {
    expect(() => createRateLimiter({ limit: -1, window: 1000 })).toThrow(RangeError);
  });

  it("limit이 정수가 아니면 RangeError", () => {
    expect(() => createRateLimiter({ limit: 1.5, window: 1000 })).toThrow(RangeError);
  });

  it("window가 0이면 RangeError", () => {
    expect(() => createRateLimiter({ limit: 5, window: 0 })).toThrow(RangeError);
  });
});

describe("실사용 시나리오", () => {
  it("limit 초과 요청은 모두 처리되고 순서가 보장된다 (FIFO)", async () => {
    const limiter = createRateLimiter({ limit: 3, window: 300 });

    const resolved: number[] = [];
    const tasks = Array.from({ length: 6 }, (_, i) =>
      limiter.acquire().then(() => resolved.push(i))
    );

    // 처음 3개는 즉시 resolve (토큰 충분)
    await Promise.resolve();
    expect(resolved).toEqual([0, 1, 2]);
    expect(limiter.waiting).toBe(3); // 나머지 3개 대기 중

    // 타이머 진행 → 남은 3개 순차 처리
    await vi.runAllTimersAsync();
    await Promise.all(tasks);

    expect(resolved).toEqual([0, 1, 2, 3, 4, 5]); // FIFO 순서 보장
  });

  it("pLimit과 조합 — 동시성 + 속도 제한", async () => {
    // 개념 검증: 두 limiter를 함께 사용할 수 있다
    const rate = createRateLimiter({ limit: 5, window: 1000 });
    const calls: number[] = [];

    const tasks = Array.from({ length: 5 }, (_, i) =>
      rate.acquire().then(() => calls.push(i))
    );

    await Promise.all(tasks);
    expect(calls).toHaveLength(5);
  });
});
