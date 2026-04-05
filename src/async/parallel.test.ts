import { describe, expect, it, vi } from "vitest";
import { parallel } from "./parallel";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe("parallel", () => {
  describe("기본 동작", () => {
    it("모든 함수의 결과를 튜플로 반환한다", async () => {
      const [a, b, c] = await parallel([
        () => Promise.resolve(1),
        () => Promise.resolve("hello"),
        () => Promise.resolve(true),
      ]);
      expect(a).toBe(1);
      expect(b).toBe("hello");
      expect(c).toBe(true);
    });

    it("원래 순서를 보장한다", async () => {
      const results = await parallel([
        async () => { await delay(30); return "slow"; },
        async () => { await delay(5); return "fast"; },
        async () => { await delay(15); return "medium"; },
      ]);
      expect(results).toEqual(["slow", "fast", "medium"]);
    });

    it("빈 배열은 빈 배열을 반환한다", async () => {
      const results = await parallel([]);
      expect(results).toEqual([]);
    });

    it("단일 함수", async () => {
      const [val] = await parallel([() => Promise.resolve(42)]);
      expect(val).toBe(42);
    });
  });

  describe("concurrency 제한", () => {
    it("concurrency: 1이면 순서대로 실행된다", async () => {
      const order: number[] = [];
      await parallel([
        async () => { order.push(1); await delay(30); order.push(4); },
        async () => { order.push(2); await delay(10); order.push(5); },
        async () => { order.push(3); order.push(6); },
      ], { concurrency: 1 });
      // concurrency=1: fn1 완료 후 fn2 시작, fn2 완료 후 fn3 시작
      expect(order).toEqual([1, 4, 2, 5, 3, 6]);
    });

    it("concurrency가 함수 수보다 크면 모두 동시에 실행된다", async () => {
      const started: number[] = [];
      await parallel([
        async () => { started.push(1); await delay(20); },
        async () => { started.push(2); await delay(20); },
      ], { concurrency: 10 });
      expect(started).toEqual([1, 2]);
    });

    it("concurrency 제한 시 동시 실행 수를 초과하지 않는다", async () => {
      let running = 0;
      let maxRunning = 0;

      const fns = Array.from({ length: 6 }, () =>
        async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          await delay(10);
          running--;
        }
      );

      await parallel(fns, { concurrency: 2 });
      expect(maxRunning).toBeLessThanOrEqual(2);
    });

    it("결과 순서는 함수 순서와 일치한다 (concurrency 제한 시에도)", async () => {
      const results = await parallel([
        async () => { await delay(30); return 1; },
        async () => { await delay(5); return 2; },
        async () => { await delay(15); return 3; },
        async () => { await delay(1); return 4; },
      ], { concurrency: 2 });
      expect(results).toEqual([1, 2, 3, 4]);
    });
  });

  describe("에러 처리", () => {
    it("하나라도 실패하면 전체가 reject된다", async () => {
      await expect(
        parallel([
          () => Promise.resolve(1),
          () => Promise.reject(new Error("fail")),
          () => Promise.resolve(3),
        ])
      ).rejects.toThrow("fail");
    });

    it("concurrency <= 0이면 에러를 던진다", async () => {
      await expect(
        parallel([() => Promise.resolve(1)], { concurrency: 0 })
      ).rejects.toThrow("concurrency must be > 0");
    });
  });

  describe("실사용 시나리오", () => {
    it("여러 API 호출을 동시에 처리한다", async () => {
      const fetchUser = vi.fn().mockResolvedValue({ id: 1, name: "Alice" });
      const fetchPosts = vi.fn().mockResolvedValue([{ id: 10, title: "Post 1" }]);
      const fetchConfig = vi.fn().mockResolvedValue({ theme: "dark" });

      const [user, posts, config] = await parallel([
        () => fetchUser(),
        () => fetchPosts(),
        () => fetchConfig(),
      ]);

      expect(user).toEqual({ id: 1, name: "Alice" });
      expect(posts).toEqual([{ id: 10, title: "Post 1" }]);
      expect(config).toEqual({ theme: "dark" });
      expect(fetchUser).toHaveBeenCalledTimes(1);
      expect(fetchPosts).toHaveBeenCalledTimes(1);
    });

    it("rate limit이 있는 API를 concurrency로 제어한다", async () => {
      let callCount = 0;

      const calls = Array.from({ length: 5 }, (_, i) =>
        async () => {
          callCount++;
          await delay(5);
          return i;
        }
      );

      const results = await parallel(calls, { concurrency: 2 });
      expect(results).toEqual([0, 1, 2, 3, 4]);
      expect(callCount).toBe(5);
    });
  });
});
