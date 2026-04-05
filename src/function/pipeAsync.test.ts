import { describe, expect, it, vi } from "vitest";
import { pipeAsync } from "./pipeAsync";

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

describe("pipeAsync", () => {
  describe("기본 동작", () => {
    it("함수 없이 초기값만 전달하면 그 값을 Promise로 반환한다", async () => {
      expect(await pipeAsync(42)).toBe(42);
    });

    it("Promise 초기값도 unwrap한다", async () => {
      expect(await pipeAsync(Promise.resolve(42))).toBe(42);
    });

    it("단일 동기 함수를 적용한다", async () => {
      const result = await pipeAsync(5, x => x * 2);
      expect(result).toBe(10);
    });

    it("단일 비동기 함수를 적용한다", async () => {
      const result = await pipeAsync(5, async x => x * 2);
      expect(result).toBe(10);
    });

    it("항상 Promise를 반환한다", () => {
      const result = pipeAsync(1, x => x + 1);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("단계별 실행", () => {
    it("동기 함수만으로 구성된 파이프라인", async () => {
      const result = await pipeAsync(
        1,
        x => x + 1,   // 2
        x => x * 3,   // 6
        x => x - 2,   // 4
      );
      expect(result).toBe(4);
    });

    it("비동기 함수만으로 구성된 파이프라인", async () => {
      const result = await pipeAsync(
        "hello",
        async (s) => s.toUpperCase(),    // "HELLO"
        async (s) => `${s}!`,            // "HELLO!"
        async (s) => s.length,           // 6
      );
      expect(result).toBe(6);
    });

    it("동기·비동기 함수를 혼합할 수 있다", async () => {
      const result = await pipeAsync(
        [1, 2, 3, 4, 5],
        xs => xs.filter(x => x % 2 === 0),    // 동기: [2, 4]
        async xs => xs.map(x => x * 10),       // 비동기: [20, 40]
        xs => xs.reduce((a, b) => a + b, 0),   // 동기: 60
      );
      expect(result).toBe(60);
    });

    it("각 단계가 순서대로 실행된다", async () => {
      const order: number[] = [];
      await pipeAsync(
        0,
        async x => { order.push(1); await delay(10); return x + 1; },
        x => { order.push(2); return x + 1; },
        async x => { order.push(3); return x + 1; },
      );
      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe("Promise 초기값", () => {
    it("초기값이 Promise이면 resolve 후 파이프라인을 실행한다", async () => {
      const asyncSource = Promise.resolve(10);
      const result = await pipeAsync(
        asyncSource,
        x => x * 2,
        x => x + 5,
      );
      expect(result).toBe(25);
    });
  });

  describe("에러 처리", () => {
    it("동기 함수에서 throw하면 reject된다", async () => {
      const err = new Error("sync error");
      await expect(
        pipeAsync(1, () => { throw err; })
      ).rejects.toBe(err);
    });

    it("비동기 함수에서 reject하면 파이프라인이 reject된다", async () => {
      const err = new Error("async error");
      await expect(
        pipeAsync(1, async () => { throw err; })
      ).rejects.toBe(err);
    });

    it("에러 발생 이후 단계는 실행되지 않는다", async () => {
      const fn3 = vi.fn();
      await pipeAsync(
        1,
        x => x + 1,
        () => { throw new Error("fail"); },
        fn3,
      ).catch(() => {});
      expect(fn3).not.toHaveBeenCalled();
    });

    it("중간 단계 에러도 전체 파이프라인을 reject한다", async () => {
      await expect(
        pipeAsync(
          "input",
          async s => s.toUpperCase(),
          async () => { throw new Error("middle fail"); },
          async s => s + "!",
        )
      ).rejects.toThrow("middle fail");
    });
  });

  describe("타입 안전성 — 실제 사용 시나리오", () => {
    it("숫자 → 문자열 → 배열 타입 변환 체인", async () => {
      const result = await pipeAsync(
        42,
        n => n.toString(),         // number → string
        s => s.split(""),          // string → string[]
        arr => arr.length,         // string[] → number
      );
      expect(result).toBe(2); // "42".split("") → ["4", "2"] → length 2
    });

    it("객체 변환 파이프라인", async () => {
      interface Raw { name: string; age: string }
      interface Parsed { name: string; age: number }
      interface Enriched { name: string; age: number; adult: boolean }

      const result = await pipeAsync(
        { name: "Alice", age: "30" } as Raw,
        async (r): Promise<Parsed> => ({ name: r.name, age: parseInt(r.age) }),
        (p): Enriched => ({ ...p, adult: p.age >= 18 }),
      );

      expect(result).toEqual({ name: "Alice", age: 30, adult: true });
    });
  });

  describe("8단계 파이프라인", () => {
    it("최대 8단계 함수 체인이 동작한다", async () => {
      const result = await pipeAsync(
        0,
        x => x + 1,  // 1
        x => x + 1,  // 2
        x => x + 1,  // 3
        x => x + 1,  // 4
        x => x + 1,  // 5
        x => x + 1,  // 6
        x => x + 1,  // 7
        x => x + 1,  // 8
      );
      expect(result).toBe(8);
    });
  });
});
