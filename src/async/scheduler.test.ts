import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScheduler } from "./scheduler";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createScheduler — 기본 동작", () => {
  it("등록 즉시 스케줄이 시작된다", () => {
    const scheduler = createScheduler();
    const task = scheduler.every(1000, vi.fn());
    expect(task.isScheduled).toBe(true);
  });

  it("intervalMs 후 fn이 실행된다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(1000, fn);

    expect(fn).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("여러 interval 후 누적 실행", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(500, fn);

    await vi.advanceTimersByTimeAsync(500);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(500);
    expect(fn).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(500);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("runCount가 실행 횟수를 추적한다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(1000, fn);

    expect(task.runCount).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(task.runCount).toBe(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(task.runCount).toBe(2);
  });

  it("lastRunAt이 실행 완료 시각을 기록한다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(1000, fn);

    expect(task.lastRunAt).toBeNull();
    await vi.advanceTimersByTimeAsync(1000);
    expect(task.lastRunAt).toBeInstanceOf(Date);
  });
});

describe("stop() / start()", () => {
  it("stop() 후 fn이 실행되지 않는다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(1000, fn);

    task.stop();
    expect(task.isScheduled).toBe(false);

    await vi.advanceTimersByTimeAsync(3000);
    expect(fn).not.toHaveBeenCalled();
  });

  it("stop() 후 start()로 재개된다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(1000, fn);

    task.stop();
    task.start();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("start()를 여러 번 호출해도 중복 타이머가 생기지 않는다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(1000, fn);

    task.stop();
    task.start();
    task.start(); // 중복 호출
    task.start();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1); // 한 번만 실행
  });
});

describe("exclusive 옵션 (중복 실행 방지)", () => {
  it("exclusive: true — 이전 실행 중이면 건너뛴다", async () => {
    let resolveFirst: () => void;
    const slowFn = vi.fn().mockImplementationOnce(
      () => new Promise<void>((res) => { resolveFirst = res; }),
    ).mockResolvedValue(undefined);

    const scheduler = createScheduler();
    scheduler.every(100, slowFn, { exclusive: true });

    await vi.advanceTimersByTimeAsync(100); // 1st 시작 (아직 완료 안 됨)
    await vi.advanceTimersByTimeAsync(100); // 2nd 시작 시도 → 건너뜀
    await vi.advanceTimersByTimeAsync(100); // 3rd 시도 → 건너뜀

    expect(slowFn).toHaveBeenCalledTimes(1); // 첫 번째만 실행됨

    resolveFirst!(); // 첫 번째 완료
  });

  it("exclusive: false — 이전 실행 중에도 새 실행 시작", async () => {
    const calls: number[] = [];
    let resolveFns: Array<() => void> = [];

    const fn = vi.fn().mockImplementation(
      () => new Promise<void>((res) => { resolveFns.push(res); }),
    );

    const scheduler = createScheduler();
    scheduler.every(100, fn, { exclusive: false });

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(100);

    // exclusive: false이므로 두 번 호출됨 (이전 실행 완료 전에 새 실행 가능)
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(2);

    resolveFns.forEach(r => r());
  });
});

describe("runImmediately 옵션", () => {
  it("runImmediately: true이면 등록 즉시 실행된다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(1000, fn, { runImmediately: true });

    await Promise.resolve(); // 마이크로태스크 플러시
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("runImmediately: false(기본)이면 첫 interval 후에 실행된다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(1000, fn);

    await Promise.resolve();
    expect(fn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("에러 처리", () => {
  it("fn에서 에러가 발생해도 스케줄러가 계속 동작한다", async () => {
    let count = 0;
    const fn = vi.fn().mockImplementation(() => {
      count++;
      if (count === 1) throw new Error("일시적 에러");
      return Promise.resolve();
    });

    const scheduler = createScheduler();
    scheduler.every(500, fn, { onError: () => {} });

    await vi.advanceTimersByTimeAsync(500); // 에러 발생
    await vi.advanceTimersByTimeAsync(500); // 정상 실행
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("lastError가 직전 에러를 기록한다", async () => {
    const err = new Error("작업 실패");
    const fn = vi.fn().mockRejectedValue(err);
    const scheduler = createScheduler();
    const task = scheduler.every(500, fn, { onError: () => {} });

    await vi.advanceTimersByTimeAsync(500);
    expect(task.lastError).toBe(err);
  });

  it("onError 콜백이 에러와 taskId를 받는다", async () => {
    const onError = vi.fn();
    const err = new Error("fail");
    const scheduler = createScheduler();
    const task = scheduler.every(500, vi.fn().mockRejectedValue(err), {
      id: "my-task",
      onError,
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(onError).toHaveBeenCalledWith(err, "my-task");
  });

  it("intervalMs가 0 이하이면 RangeError", () => {
    const scheduler = createScheduler();
    expect(() => scheduler.every(0, vi.fn())).toThrow(RangeError);
    expect(() => scheduler.every(-100, vi.fn())).toThrow(RangeError);
  });
});

describe("task.run() — 즉시 실행", () => {
  it("스케줄과 무관하게 즉시 실행된다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(10_000, fn);

    await task.run(); // 즉시 실행 (타이머 없이)
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("run() 후 runCount가 증가한다", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    const task = scheduler.every(10_000, fn);

    await task.run();
    expect(task.runCount).toBe(1);
    await task.run();
    expect(task.runCount).toBe(2);
  });
});

describe("stopAll() / startAll()", () => {
  it("stopAll()은 모든 작업을 중단한다", async () => {
    const fn1 = vi.fn().mockResolvedValue(undefined);
    const fn2 = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(500, fn1);
    scheduler.every(500, fn2);

    scheduler.stopAll();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it("startAll()은 중단된 모든 작업을 재개한다", async () => {
    const fn1 = vi.fn().mockResolvedValue(undefined);
    const fn2 = vi.fn().mockResolvedValue(undefined);
    const scheduler = createScheduler();
    scheduler.every(500, fn1);
    scheduler.every(500, fn2);

    scheduler.stopAll();
    scheduler.startAll();
    await vi.advanceTimersByTimeAsync(500);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it("tasks Map에 등록된 작업이 모두 포함된다", () => {
    const scheduler = createScheduler();
    scheduler.every(1000, vi.fn(), { id: "task-a" });
    scheduler.every(1000, vi.fn(), { id: "task-b" });

    expect(scheduler.tasks.has("task-a")).toBe(true);
    expect(scheduler.tasks.has("task-b")).toBe(true);
    expect(scheduler.tasks.size).toBe(2);
  });
});

describe("실사용 시나리오", () => {
  it("DB 정리 작업 — 5분 주기, 에러 발생해도 지속", async () => {
    let cleanupCount = 0;
    const errors: unknown[] = [];

    const scheduler = createScheduler();
    scheduler.every(
      5 * 60_000,
      async () => {
        cleanupCount++;
        if (cleanupCount === 2) throw new Error("DB 연결 실패");
      },
      { id: "db-cleanup", onError: (e) => errors.push(e) },
    );

    await vi.advanceTimersByTimeAsync(5 * 60_000);  // 1회 (성공)
    await vi.advanceTimersByTimeAsync(5 * 60_000);  // 2회 (실패)
    await vi.advanceTimersByTimeAsync(5 * 60_000);  // 3회 (성공)

    expect(cleanupCount).toBe(3);
    expect(errors).toHaveLength(1);
  });
});
