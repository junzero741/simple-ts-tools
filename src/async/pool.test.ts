import { describe, it, expect, vi } from "vitest";
import { createPool } from "./pool";

function createMockFactory() {
  let id = 0;
  return {
    create: vi.fn(() => ({ id: ++id })),
    destroy: vi.fn(),
  };
}

describe("createPool", () => {
  it("acquire로 리소스를 생성하고 release로 반환한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2 });

    const r1 = await pool.acquire();
    expect(r1).toEqual({ id: 1 });
    expect(pool.stats).toEqual({ total: 1, idle: 0, active: 1, waiting: 0 });

    pool.release(r1);
    expect(pool.stats).toEqual({ total: 1, idle: 1, active: 0, waiting: 0 });
    expect(destroy).not.toHaveBeenCalled();

    await pool.drain();
  });

  it("유휴 리소스를 재사용한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2 });

    const r1 = await pool.acquire();
    pool.release(r1);

    const r2 = await pool.acquire();
    expect(r2).toBe(r1);
    expect(create).toHaveBeenCalledTimes(1);

    pool.release(r2);
    await pool.drain();
  });

  it("max에 도달하면 release까지 대기한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    const r1 = await pool.acquire();

    let acquired = false;
    const p = pool.acquire().then((r) => {
      acquired = true;
      return r;
    });

    // 아직 대기 중
    await new Promise((r) => setTimeout(r, 10));
    expect(acquired).toBe(false);
    expect(pool.stats.waiting).toBe(1);

    pool.release(r1);
    const r2 = await p;
    expect(acquired).toBe(true);
    expect(r2).toBe(r1);

    pool.release(r2);
    await pool.drain();
  });

  it("acquireTimeout 초과 시 에러를 던진다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1, acquireTimeout: 50 });

    await pool.acquire();

    await expect(pool.acquire()).rejects.toThrow("Pool acquire timeout after 50ms");

    await pool.drain();
  });

  it("using은 자동으로 release한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    const result = await pool.using((r) => r.id * 10);
    expect(result).toBe(10);
    expect(pool.stats.active).toBe(0);
    expect(pool.stats.idle).toBe(1);

    await pool.drain();
  });

  it("using 내부에서 에러가 나도 release한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    await expect(
      pool.using(() => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(pool.stats.active).toBe(0);
    expect(pool.stats.idle).toBe(1);

    await pool.drain();
  });

  it("validate가 false면 리소스를 파괴 후 새로 생성한다", async () => {
    let id = 0;
    const destroyed: number[] = [];
    const pool = createPool({
      create: () => ({ id: ++id }),
      destroy: (r) => { destroyed.push(r.id); },
      validate: (r) => r.id !== 1,
      max: 2,
    });

    const r1 = await pool.acquire();
    expect(r1.id).toBe(1);
    pool.release(r1);

    // r1은 validate 실패 → 파괴, 새 리소스 생성
    const r2 = await pool.acquire();
    expect(r2.id).toBe(2);
    expect(destroyed).toContain(1);

    pool.release(r2);
    await pool.drain();
  });

  it("drain 후 acquire는 에러를 던진다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2 });

    await pool.drain();
    await expect(pool.acquire()).rejects.toThrow("Cannot acquire from a drained pool");
  });

  it("drain은 유휴 리소스를 전부 파괴한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 3 });

    const r1 = await pool.acquire();
    const r2 = await pool.acquire();
    pool.release(r1);
    pool.release(r2);

    await pool.drain();
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(pool.stats.total).toBe(0);
  });

  it("drain 시 대기 중인 acquire를 reject한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    await pool.acquire();
    const p = pool.acquire();

    await pool.drain();
    await expect(p).rejects.toThrow("Pool is draining");
  });

  it("destroy(resource)로 개별 리소스를 파괴한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2 });

    const r1 = await pool.acquire();
    await pool.destroy(r1);

    expect(destroy).toHaveBeenCalledWith(r1);
    expect(pool.stats.total).toBe(0);

    await pool.drain();
  });

  it("idleTimeout 후 유휴 리소스가 자동 파괴된다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2, idleTimeout: 50 });

    const r1 = await pool.acquire();
    pool.release(r1);
    expect(pool.stats.idle).toBe(1);

    await new Promise((r) => setTimeout(r, 80));
    expect(pool.stats.idle).toBe(0);
    expect(destroy).toHaveBeenCalledWith(r1);

    await pool.drain();
  });

  it("max < 1이면 에러를 던진다", () => {
    expect(() => createPool({ create: () => ({}), max: 0 })).toThrow("max must be at least 1");
  });

  it("min > max이면 에러를 던진다", () => {
    expect(() => createPool({ create: () => ({}), min: 3, max: 2 })).toThrow(
      "min must not exceed max",
    );
  });

  it("async create 팩토리를 지원한다", async () => {
    let id = 0;
    const pool = createPool({
      create: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { id: ++id };
      },
      max: 2,
    });

    const r1 = await pool.acquire();
    expect(r1).toEqual({ id: 1 });

    pool.release(r1);
    await pool.drain();
  });

  it("release 시 대기자에게 직접 전달한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    const r1 = await pool.acquire();
    const p = pool.acquire();

    pool.release(r1);
    const r2 = await p;
    expect(r2).toBe(r1);
    // 유휴 풀을 거치지 않으므로 idle은 0
    expect(pool.stats.idle).toBe(0);

    pool.release(r2);
    await pool.drain();
  });

  it("drain 후 release하면 리소스를 파괴한다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 1 });

    const r1 = await pool.acquire();
    await pool.drain();

    pool.release(r1);
    expect(destroy).toHaveBeenCalledWith(r1);
  });

  it("같은 리소스를 중복 release해도 안전하다", async () => {
    const { create, destroy } = createMockFactory();
    const pool = createPool({ create, destroy, max: 2 });

    const r1 = await pool.acquire();
    pool.release(r1);
    pool.release(r1); // 두 번째는 무시

    expect(pool.stats.idle).toBe(1);

    await pool.drain();
  });
});
