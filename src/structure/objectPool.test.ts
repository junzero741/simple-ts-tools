import { describe, it, expect, vi } from "vitest";
import { createObjectPool } from "./objectPool";

type Vec2 = { x: number; y: number };

function createVecPool(opts = {}) {
  return createObjectPool<Vec2>(
    () => ({ x: 0, y: 0 }),
    (v) => { v.x = 0; v.y = 0; },
    opts,
  );
}

describe("createObjectPool", () => {
  describe("acquire / release", () => {
    it("객체를 생성하고 반환한다", () => {
      const pool = createVecPool();

      const v = pool.acquire();
      expect(v).toEqual({ x: 0, y: 0 });
      expect(pool.inUse).toBe(1);

      pool.release(v);
      expect(pool.inUse).toBe(0);
      expect(pool.available).toBe(1);
    });

    it("release된 객체를 재사용한다", () => {
      const factory = vi.fn(() => ({ x: 0, y: 0 }));
      const pool = createObjectPool<Vec2>(factory, (v) => { v.x = 0; v.y = 0; });

      const v1 = pool.acquire();
      v1.x = 99;
      pool.release(v1);

      const v2 = pool.acquire();
      expect(v2).toBe(v1);  // 같은 참조
      expect(v2.x).toBe(0); // reset됨
      expect(factory).toHaveBeenCalledTimes(1); // 한 번만 생성
    });

    it("풀이 비면 새로 생성한다", () => {
      const factory = vi.fn(() => ({ x: 0, y: 0 }));
      const pool = createObjectPool<Vec2>(factory, () => {});

      pool.acquire();
      pool.acquire();
      pool.acquire();

      expect(factory).toHaveBeenCalledTimes(3);
    });
  });

  describe("reset", () => {
    it("release 시 reset을 실행한다", () => {
      const reset = vi.fn();
      const pool = createObjectPool(() => ({ id: 1 }), reset);

      const obj = pool.acquire();
      pool.release(obj);

      expect(reset).toHaveBeenCalledWith(obj);
    });
  });

  describe("max", () => {
    it("max 초과 시 release된 객체를 버린다", () => {
      const pool = createVecPool({ max: 2 });

      const objs = [pool.acquire(), pool.acquire(), pool.acquire()];

      pool.release(objs[0]);
      pool.release(objs[1]);
      pool.release(objs[2]); // max=2이므로 이건 버려짐

      expect(pool.available).toBe(2);
    });
  });

  describe("prewarm", () => {
    it("시작 시 미리 생성한다", () => {
      const factory = vi.fn(() => ({ x: 0, y: 0 }));
      const pool = createObjectPool<Vec2>(factory, () => {}, { prewarm: 5 });

      expect(factory).toHaveBeenCalledTimes(5);
      expect(pool.available).toBe(5);
      expect(pool.created).toBe(5);
    });

    it("prewarm된 객체를 acquire로 사용한다", () => {
      const factory = vi.fn(() => ({ x: 0, y: 0 }));
      const pool = createObjectPool<Vec2>(factory, () => {}, { prewarm: 3 });

      pool.acquire();
      pool.acquire();

      expect(factory).toHaveBeenCalledTimes(3); // prewarm만, 추가 생성 없음
      expect(pool.available).toBe(1);
    });
  });

  describe("releaseAll", () => {
    it("여러 객체를 한 번에 반환한다", () => {
      const pool = createVecPool();
      const objs = [pool.acquire(), pool.acquire(), pool.acquire()];

      pool.releaseAll(objs);
      expect(pool.available).toBe(3);
      expect(pool.inUse).toBe(0);
    });
  });

  describe("drain", () => {
    it("유휴 객체를 모두 제거한다", () => {
      const pool = createVecPool();
      const v = pool.acquire();
      pool.release(v);

      expect(pool.available).toBe(1);
      pool.drain();
      expect(pool.available).toBe(0);
    });

    it("사용 중 객체에 영향 없다", () => {
      const pool = createVecPool();
      pool.acquire();
      pool.drain();

      expect(pool.inUse).toBe(1);
    });
  });

  describe("created / inUse / available", () => {
    it("통계가 정확하다", () => {
      const pool = createVecPool();

      expect(pool.created).toBe(0);
      expect(pool.inUse).toBe(0);
      expect(pool.available).toBe(0);

      const v1 = pool.acquire();
      const v2 = pool.acquire();
      expect(pool.created).toBe(2);
      expect(pool.inUse).toBe(2);

      pool.release(v1);
      expect(pool.inUse).toBe(1);
      expect(pool.available).toBe(1);

      pool.release(v2);
      expect(pool.inUse).toBe(0);
      expect(pool.available).toBe(2);
    });
  });

  describe("고빈도 시나리오", () => {
    it("1000번 acquire/release 반복 — 1개만 생성", () => {
      const factory = vi.fn(() => ({ x: 0, y: 0 }));
      const pool = createObjectPool<Vec2>(factory, (v) => { v.x = 0; v.y = 0; });

      for (let i = 0; i < 1000; i++) {
        const v = pool.acquire();
        v.x = i;
        pool.release(v);
      }

      expect(factory).toHaveBeenCalledTimes(1);
      expect(pool.created).toBe(1);
    });
  });
});
