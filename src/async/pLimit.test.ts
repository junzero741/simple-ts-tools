import { describe, expect, it, vi } from "vitest";
import { pLimit } from "./pLimit";

describe("pLimit", () => {
  describe("기본 동작", () => {
    it("작업 결과를 그대로 반환한다", async () => {
      const limit = pLimit(2);
      const result = await limit(() => Promise.resolve(42));
      expect(result).toBe(42);
    });

    it("여러 작업을 순서대로 처리한다", async () => {
      const limit = pLimit(2);
      const results = await Promise.all([
        limit(() => Promise.resolve(1)),
        limit(() => Promise.resolve(2)),
        limit(() => Promise.resolve(3)),
      ]);
      expect(results).toEqual([1, 2, 3]);
    });

    it("작업이 reject되면 해당 promise만 reject된다", async () => {
      const limit = pLimit(2);
      const err = new Error("fail");
      await expect(limit(() => Promise.reject(err))).rejects.toBe(err);
    });

    it("실패한 작업 이후에도 다른 작업은 정상 실행된다", async () => {
      const limit = pLimit(2);
      await limit(() => Promise.reject(new Error("fail"))).catch(() => {});
      const result = await limit(() => Promise.resolve("ok"));
      expect(result).toBe("ok");
    });
  });

  describe("동시성 제한", () => {
    it("concurrency=1이면 직렬 실행된다", async () => {
      const limit = pLimit(1);
      const order: number[] = [];

      await Promise.all([
        limit(async () => { order.push(1); await Promise.resolve(); order.push(1); }),
        limit(async () => { order.push(2); await Promise.resolve(); order.push(2); }),
        limit(async () => { order.push(3); await Promise.resolve(); order.push(3); }),
      ]);

      // 직렬: 1이 완전히 끝난 후 2, 2가 끝난 후 3
      expect(order).toEqual([1, 1, 2, 2, 3, 3]);
    });

    it("동시에 실행되는 작업 수가 concurrency를 넘지 않는다", async () => {
      const limit = pLimit(3);
      let concurrent = 0;
      let maxConcurrent = 0;

      const tasks = Array.from({ length: 10 }, () =>
        limit(async () => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrent--;
        })
      );

      await Promise.all(tasks);
      expect(maxConcurrent).toBeLessThanOrEqual(3);
      expect(maxConcurrent).toBeGreaterThan(0);
    });

    it("concurrency=2에서 동시 2개 초과 실행 안 됨", async () => {
      const limit = pLimit(2);
      const running: number[] = [];
      let max = 0;

      const track = (id: number) =>
        limit(async () => {
          running.push(id);
          max = Math.max(max, running.length);
          await new Promise(resolve => setImmediate(resolve));
          running.splice(running.indexOf(id), 1);
        });

      await Promise.all([track(1), track(2), track(3), track(4)]);
      expect(max).toBeLessThanOrEqual(2);
    });
  });

  describe("activeCount / pendingCount", () => {
    it("초기 상태에서 모두 0이다", () => {
      const limit = pLimit(2);
      expect(limit.activeCount).toBe(0);
      expect(limit.pendingCount).toBe(0);
    });

    it("실행 중일 때 activeCount가 올바르다", async () => {
      const limit = pLimit(2);
      let resolve1!: () => void;
      let resolve2!: () => void;

      const p1 = limit(() => new Promise<void>(r => { resolve1 = r; }));
      const p2 = limit(() => new Promise<void>(r => { resolve2 = r; }));
      const p3 = limit(() => Promise.resolve());

      await new Promise(resolve => setImmediate(resolve)); // flush microtasks

      expect(limit.activeCount).toBe(2);
      expect(limit.pendingCount).toBe(1);

      resolve1();
      resolve2();
      await Promise.all([p1, p2, p3]);

      expect(limit.activeCount).toBe(0);
      expect(limit.pendingCount).toBe(0);
    });
  });

  describe("clearQueue", () => {
    it("대기 중인 작업이 제거되어 실행되지 않는다", async () => {
      const limit = pLimit(1);
      const executed: number[] = [];
      let blockResolve!: () => void;

      // 첫 번째 작업은 블로킹
      const blocker = limit(() => new Promise<void>(r => { blockResolve = r; }));

      // 2, 3번은 큐에 쌓임
      const p2 = limit(async () => { executed.push(2); });
      const p3 = limit(async () => { executed.push(3); });

      await new Promise(resolve => setImmediate(resolve));
      expect(limit.pendingCount).toBe(2);

      limit.clearQueue(); // 큐 비우기
      expect(limit.pendingCount).toBe(0);

      blockResolve(); // 블로킹 해제
      await blocker;

      // clearQueue는 pending promise를 settle하지 않으므로 p2, p3는 영원히 pending
      // 실행된 건 없음
      expect(executed).toEqual([]);

      // p2, p3는 pending 상태로 남으므로 테스트에서 await 하지 않음
      // 메모리 누수를 방지하기 위해 명시적으로 catch
      p2.catch(() => {});
      p3.catch(() => {});
    });
  });

  describe("에러 처리", () => {
    it("concurrency가 0이면 RangeError를 던진다", () => {
      expect(() => pLimit(0)).toThrow(RangeError);
    });

    it("concurrency가 음수이면 RangeError를 던진다", () => {
      expect(() => pLimit(-1)).toThrow(RangeError);
    });

    it("concurrency가 정수가 아니면 RangeError를 던진다", () => {
      expect(() => pLimit(1.5)).toThrow(RangeError);
    });
  });

  describe("실사용 시나리오", () => {
    it("API 호출 시뮬레이션 — 결과 순서 보장", async () => {
      const limit = pLimit(3);
      const delays = [30, 10, 20, 5, 15];
      const results = await Promise.all(
        delays.map((d, i) =>
          limit(() => new Promise<number>(resolve => setTimeout(() => resolve(i), d)))
        )
      );
      // 입력 순서대로 결과가 정렬된다 (Promise.all 보장)
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it("연속 사용 — 앞 배치 완료 후 재사용 가능", async () => {
      const limit = pLimit(2);

      const batch1 = await Promise.all([
        limit(() => Promise.resolve("a")),
        limit(() => Promise.resolve("b")),
      ]);
      expect(batch1).toEqual(["a", "b"]);

      const batch2 = await Promise.all([
        limit(() => Promise.resolve("c")),
        limit(() => Promise.resolve("d")),
      ]);
      expect(batch2).toEqual(["c", "d"]);
    });
  });
});
