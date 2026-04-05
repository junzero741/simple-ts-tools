import { describe, expect, it, vi } from "vitest";
import { createBatch } from "./batch";

describe("createBatch", () => {
  describe("기본 배치 동작", () => {
    it("같은 틱의 load() 호출들을 하나의 batchFn 호출로 처리한다", async () => {
      const batchFn = vi.fn(async (keys: number[]) => keys.map(k => k * 2));
      const loader = createBatch(batchFn);

      const [a, b, c] = await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ]);

      expect(a).toBe(2);
      expect(b).toBe(4);
      expect(c).toBe(6);
      expect(batchFn).toHaveBeenCalledTimes(1);
      expect(batchFn).toHaveBeenCalledWith([1, 2, 3]);
    });

    it("단일 load()도 정상 동작한다", async () => {
      const batchFn = vi.fn(async (keys: number[]) => keys.map(k => k + 10));
      const loader = createBatch(batchFn);

      expect(await loader.load(5)).toBe(15);
      expect(batchFn).toHaveBeenCalledWith([5]);
    });

    it("다른 틱의 호출은 별도 배치로 처리된다", async () => {
      const batchFn = vi.fn(async (keys: number[]) => keys.map(k => k));
      const loader = createBatch(batchFn);

      await loader.load(1); // 첫 번째 배치
      await loader.load(2); // 두 번째 배치

      expect(batchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("결과 순서 보장", () => {
    it("키 순서와 결과 순서가 대응된다", async () => {
      // batchFn이 역순으로 처리해도 결과는 요청 순서에 맞게 반환
      const batchFn = async (keys: number[]) => {
        const data: Record<number, string> = { 1: "one", 2: "two", 3: "three" };
        // 실제 DB처럼 순서가 보장되지 않는 상황을 가정
        return keys.map(k => data[k] ?? new Error(`not found: ${k}`));
      };
      const loader = createBatch(batchFn);

      const [r1, r2, r3] = await Promise.all([
        loader.load(3),
        loader.load(1),
        loader.load(2),
      ]);

      expect(r1).toBe("three");
      expect(r2).toBe("one");
      expect(r3).toBe("two");
    });
  });

  describe("에러 처리", () => {
    it("batchFn이 Error 인스턴스를 반환한 키는 reject된다", async () => {
      const batchFn = async (keys: number[]) =>
        keys.map(k => (k === 2 ? new Error("not found") : k * 10));
      const loader = createBatch(batchFn);

      const results = await Promise.allSettled([
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ]);

      expect(results[0]).toMatchObject({ status: "fulfilled", value: 10 });
      expect(results[1]).toMatchObject({ status: "rejected" });
      expect(results[2]).toMatchObject({ status: "fulfilled", value: 30 });
    });

    it("batchFn 전체가 throw하면 배치의 모든 항목이 reject된다", async () => {
      const batchFn = async (_keys: number[]) => {
        throw new Error("DB connection failed");
      };
      const loader = createBatch(batchFn);

      const results = await Promise.allSettled([
        loader.load(1),
        loader.load(2),
      ]);

      expect(results[0].status).toBe("rejected");
      expect(results[1].status).toBe("rejected");
    });

    it("결과 배열 길이 불일치 시 모든 항목이 reject된다", async () => {
      const batchFn = async (keys: number[]) => [keys[0]]; // 길이 1 반환 (잘못됨)
      const loader = createBatch(batchFn);

      const results = await Promise.allSettled([
        loader.load(1),
        loader.load(2),
      ]);

      expect(results[0].status).toBe("rejected");
      expect(results[1].status).toBe("rejected");
      expect((results[0] as PromiseRejectedResult).reason.message).toContain(
        "same length"
      );
    });
  });

  describe("maxSize 옵션", () => {
    it("maxSize 초과 시 즉시 플러시한다", async () => {
      const batchFn = vi.fn(async (keys: number[]) => keys);
      const loader = createBatch(batchFn, { maxSize: 2 });

      // 3개를 동시에 load — 처음 2개가 첫 번째 배치, 마지막 1개가 두 번째 배치
      await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ]);

      expect(batchFn).toHaveBeenCalledTimes(2);
      expect(batchFn.mock.calls[0][0]).toEqual([1, 2]);
      expect(batchFn.mock.calls[1][0]).toEqual([3]);
    });
  });

  describe("maxWait 옵션", () => {
    it("maxWait ms 이내의 호출들을 배치로 묶는다", async () => {
      vi.useFakeTimers();
      const batchFn = vi.fn(async (keys: number[]) => keys);
      const loader = createBatch(batchFn, { maxWait: 10 });

      const p1 = loader.load(1);
      const p2 = loader.load(2);

      vi.advanceTimersByTime(10);
      await Promise.resolve(); // flush 후 처리

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe(1);
      expect(r2).toBe(2);
      expect(batchFn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe("실사용 시나리오", () => {
    it("N+1 쿼리 방지 — 여러 컴포넌트가 각각 user를 요청해도 DB 호출은 1번", async () => {
      const dbFetchCalls: number[][] = [];
      const userDb: Record<number, { id: number; name: string }> = {
        1: { id: 1, name: "Alice" },
        2: { id: 2, name: "Bob" },
        3: { id: 3, name: "Charlie" },
      };

      const userLoader = createBatch(async (ids: number[]) => {
        dbFetchCalls.push(ids);
        return ids.map(id => userDb[id] ?? new Error(`User ${id} not found`));
      });

      // 3개 "컴포넌트"가 독립적으로 user를 요청
      const [alice, bob, charlie] = await Promise.all([
        userLoader.load(1),
        userLoader.load(2),
        userLoader.load(3),
      ]);

      expect(alice.name).toBe("Alice");
      expect(bob.name).toBe("Bob");
      expect(charlie.name).toBe("Charlie");
      expect(dbFetchCalls).toHaveLength(1); // DB는 딱 한 번만 호출됨
      expect(dbFetchCalls[0].sort()).toEqual([1, 2, 3]);
    });

    it("존재하지 않는 키는 Error로 처리된다", async () => {
      const userDb: Record<number, string> = { 1: "Alice" };
      const loader = createBatch(async (ids: number[]) =>
        ids.map(id => (userDb[id] ? userDb[id] : new Error(`not found: ${id}`)))
      );

      const results = await Promise.allSettled([
        loader.load(1),
        loader.load(99),
      ]);

      expect(results[0]).toMatchObject({ status: "fulfilled", value: "Alice" });
      expect(results[1]).toMatchObject({ status: "rejected" });
    });
  });
});
