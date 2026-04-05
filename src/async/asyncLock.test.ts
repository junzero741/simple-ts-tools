import { describe, it, expect } from "vitest";
import { createAsyncLock } from "./asyncLock";

describe("createAsyncLock", () => {
  describe("acquire / release", () => {
    it("잠금을 획득하고 해제한다", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");
      expect(lock.isLocked("a")).toBe(true);
      lock.release("a");
      expect(lock.isLocked("a")).toBe(false);
    });

    it("잠긴 상태에서 두 번째 acquire는 대기한다", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");

      let acquired = false;
      const p = lock.acquire("a").then(() => { acquired = true; });

      await new Promise((r) => setTimeout(r, 10));
      expect(acquired).toBe(false);

      lock.release("a");
      await p;
      expect(acquired).toBe(true);

      lock.release("a");
    });

    it("FIFO 순서로 대기자를 깨운다", async () => {
      const lock = createAsyncLock();
      await lock.acquire("x");

      const order: number[] = [];
      const p1 = lock.acquire("x").then(() => order.push(1));
      const p2 = lock.acquire("x").then(() => order.push(2));

      lock.release("x");
      await p1;
      lock.release("x");
      await p2;

      expect(order).toEqual([1, 2]);
      lock.release("x");
    });
  });

  describe("키별 독립 잠금", () => {
    it("다른 키는 독립적으로 잠금한다", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");
      await lock.acquire("b"); // 다른 키이므로 즉시 획득

      expect(lock.isLocked("a")).toBe(true);
      expect(lock.isLocked("b")).toBe(true);

      lock.release("a");
      lock.release("b");
    });
  });

  describe("tryLock", () => {
    it("잠금 가능하면 true", () => {
      const lock = createAsyncLock();
      expect(lock.tryLock("a")).toBe(true);
      expect(lock.isLocked("a")).toBe(true);
      lock.release("a");
    });

    it("이미 잠겨있으면 false (대기 안 함)", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");
      expect(lock.tryLock("a")).toBe(false);
      lock.release("a");
    });
  });

  describe("withLock", () => {
    it("자동으로 acquire → fn → release", async () => {
      const lock = createAsyncLock();
      const result = await lock.withLock("a", async () => {
        expect(lock.isLocked("a")).toBe(true);
        return 42;
      });

      expect(result).toBe(42);
      expect(lock.isLocked("a")).toBe(false);
    });

    it("에러 시에도 release", async () => {
      const lock = createAsyncLock();
      await expect(
        lock.withLock("a", () => { throw new Error("boom"); }),
      ).rejects.toThrow("boom");

      expect(lock.isLocked("a")).toBe(false);
    });

    it("동시 withLock은 순차 실행된다", async () => {
      const lock = createAsyncLock();
      const order: number[] = [];

      const p1 = lock.withLock("x", async () => {
        await new Promise((r) => setTimeout(r, 20));
        order.push(1);
      });
      const p2 = lock.withLock("x", async () => {
        order.push(2);
      });

      await Promise.all([p1, p2]);
      expect(order).toEqual([1, 2]);
    });
  });

  describe("timeout", () => {
    it("타임아웃 초과 시 에러", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");

      await expect(lock.acquire("a", 30)).rejects.toThrow("timeout");

      lock.release("a");
    });
  });

  describe("activeLocks", () => {
    it("잠긴 키 목록을 반환한다", async () => {
      const lock = createAsyncLock();
      await lock.acquire("a");
      await lock.acquire("b");

      expect(lock.activeLocks.sort()).toEqual(["a", "b"]);

      lock.release("a");
      expect(lock.activeLocks).toEqual(["b"]);
      lock.release("b");
    });
  });

  describe("기본 키", () => {
    it("키 없이 사용할 수 있다", async () => {
      const lock = createAsyncLock();
      await lock.acquire();
      expect(lock.isLocked()).toBe(true);
      lock.release();
      expect(lock.isLocked()).toBe(false);
    });
  });

  describe("실전: 동시 접근 직렬화", () => {
    it("같은 리소스에 대한 동시 접근을 직렬화한다", async () => {
      const lock = createAsyncLock();
      let balance = 100;

      async function withdraw(amount: number) {
        await lock.withLock("account", async () => {
          const current = balance;
          await new Promise((r) => setTimeout(r, 5));
          balance = current - amount;
        });
      }

      await Promise.all([withdraw(30), withdraw(50)]);
      expect(balance).toBe(20); // 직렬화 없으면 경쟁 조건
    });
  });
});
