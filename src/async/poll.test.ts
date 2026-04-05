import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { poll, PollTimeoutError } from "./poll";

describe("poll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("기본 동작", () => {
    it("predicate가 즉시 true면 한 번만 호출한다", async () => {
      const fn = vi.fn().mockResolvedValue({ status: "done" });
      const promise = poll(fn, r => r.status === "done");

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ status: "done" });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("predicate가 처음에 false면 재시도한다", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce({ status: "pending" })
        .mockResolvedValueOnce({ status: "pending" })
        .mockResolvedValueOnce({ status: "done" });

      const promise = poll(fn, r => r.status === "done");

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toEqual({ status: "done" });
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("predicate가 true가 된 시점의 값을 반환한다", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(100);

      const promise = poll(fn, v => v >= 100);

      await vi.runAllTimersAsync();
      expect(await promise).toBe(100);
    });
  });

  describe("interval 옵션", () => {
    it("기본 interval은 1000ms이다", async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount >= 3 ? "done" : "pending";
      });

      const promise = poll(fn, v => v === "done");

      // 첫 호출 즉시
      await Promise.resolve();
      expect(fn).toHaveBeenCalledTimes(1);

      // 1000ms 후 두 번째
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      // 다시 1000ms 후 세 번째
      await vi.advanceTimersByTimeAsync(1000);
      await promise;
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("커스텀 interval을 사용한다", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce("pending")
        .mockResolvedValueOnce("done");

      const promise = poll(fn, v => v === "done", { interval: 500 });

      await Promise.resolve(); // 첫 호출
      await vi.advanceTimersByTimeAsync(500);
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("timeout 옵션", () => {
    it("timeout 초과 시 PollTimeoutError를 던진다", async () => {
      const fn = vi.fn().mockResolvedValue("pending");

      const promise = poll(fn, () => false, { interval: 500, timeout: 1200 });
      // 먼저 catch를 붙여 unhandled rejection 방지
      const caught = promise.catch(e => e);

      await vi.runAllTimersAsync();
      const error = await caught;

      expect(error).toBeInstanceOf(PollTimeoutError);
    });

    it("PollTimeoutError에 시도 횟수와 경과 시간이 담겨있다", async () => {
      const fn = vi.fn().mockResolvedValue("pending");

      const promise = poll(fn, () => false, { interval: 100, timeout: 350 });
      const caught = promise.catch(e => e);

      await vi.runAllTimersAsync();
      const error = await caught;

      expect(error).toBeInstanceOf(PollTimeoutError);
      expect((error as PollTimeoutError).attempts).toBeGreaterThanOrEqual(1);
      expect((error as PollTimeoutError).elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it("timeout 없이 조건 충족 전까지 계속 시도한다", async () => {
      let count = 0;
      const fn = vi.fn().mockImplementation(async () => ++count);

      const promise = poll(fn, v => v >= 10, { interval: 100 });

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe(10);
      expect(fn).toHaveBeenCalledTimes(10);
    });
  });

  describe("onAttempt 콜백", () => {
    it("매 시도 전에 현재 시도 번호와 함께 호출된다", async () => {
      const attempts: number[] = [];
      const fn = vi
        .fn()
        .mockResolvedValueOnce("pending")
        .mockResolvedValueOnce("done");

      const promise = poll(fn, v => v === "done", {
        onAttempt: (n) => attempts.push(n),
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(attempts).toEqual([1, 2]);
    });
  });

  describe("fn이 reject되는 경우", () => {
    it("fn이 throw하면 poll도 reject된다", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("network error"));

      const promise = poll(fn, () => false);
      const caught = promise.catch(e => e);

      await vi.runAllTimersAsync();
      const error = await caught;

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("network error");
    });
  });

  describe("실사용 시나리오", () => {
    it("백그라운드 잡 완료 대기", async () => {
      const statuses = ["queued", "running", "running", "done"];
      let idx = 0;
      const fetchJobStatus = vi.fn().mockImplementation(async () => ({
        status: statuses[Math.min(idx++, statuses.length - 1)],
      }));

      const promise = poll(
        () => fetchJobStatus("job-123"),
        r => r.status === "done",
        { interval: 1000, timeout: 30_000 }
      );

      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result.status).toBe("done");
      expect(fetchJobStatus).toHaveBeenCalledTimes(4);
    });

    it("서버 헬스 체크 — ready 상태까지 대기", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce({ ready: false })
        .mockResolvedValueOnce({ ready: false })
        .mockResolvedValueOnce({ ready: true });

      const promise = poll(fn, res => res.ready, { interval: 500, timeout: 10_000 });

      await vi.runAllTimersAsync();
      const res = await promise;

      expect(res.ready).toBe(true);
    });

    it("진행률 100% 대기 — onAttempt로 UI 업데이트", async () => {
      const progress = [25, 50, 75, 100];
      let i = 0;
      const fn = vi.fn().mockImplementation(async () => progress[i++]);
      const updates: number[] = [];

      const promise = poll(fn, v => v === 100, {
        interval: 500,
        onAttempt: (attempt) => updates.push(attempt),
      });

      await vi.runAllTimersAsync();
      await promise;

      expect(updates).toEqual([1, 2, 3, 4]);
    });
  });
});
