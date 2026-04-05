import { describe, it, expect, vi } from "vitest";
import { createDisposable, using } from "./disposable";

describe("createDisposable", () => {
  it("dispose 시 등록된 cleanup을 역순으로 실행한다", async () => {
    const order: number[] = [];
    const d = createDisposable();

    d.add(() => { order.push(1); });
    d.add(() => { order.push(2); });
    d.add(() => { order.push(3); });

    await d.dispose();
    expect(order).toEqual([3, 2, 1]);
  });

  it("async cleanup을 지원한다", async () => {
    const d = createDisposable();
    let cleaned = false;

    d.add(async () => {
      await new Promise((r) => setTimeout(r, 5));
      cleaned = true;
    });

    await d.dispose();
    expect(cleaned).toBe(true);
  });

  it("중복 dispose는 무시된다", async () => {
    const fn = vi.fn();
    const d = createDisposable();
    d.add(fn);

    await d.dispose();
    await d.dispose();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dispose 후 add하면 에러를 던진다", async () => {
    const d = createDisposable();
    await d.dispose();

    expect(() => d.add(() => {})).toThrow("Cannot add to a disposed Disposable");
  });

  it("add 반환값으로 개별 cleanup을 해제한다", async () => {
    const order: string[] = [];
    const d = createDisposable();

    d.add(() => { order.push("a"); });
    const remove = d.add(() => { order.push("b"); });
    d.add(() => { order.push("c"); });

    remove(); // "b" 해제
    expect(d.size).toBe(2);

    await d.dispose();
    expect(order).toEqual(["c", "a"]);
  });

  it("개별 해제를 중복 호출해도 안전하다", () => {
    const d = createDisposable();
    const remove = d.add(() => {});
    remove();
    remove();
    expect(d.size).toBe(0);
  });

  it("cleanup 에러가 하나면 그대로 throw한다", async () => {
    const d = createDisposable();
    d.add(() => { throw new Error("fail"); });

    await expect(d.dispose()).rejects.toThrow("fail");
  });

  it("cleanup 에러가 여러 개면 AggregateError를 throw한다", async () => {
    const d = createDisposable();
    d.add(() => { throw new Error("first"); });
    d.add(() => { throw new Error("second"); });

    await expect(d.dispose()).rejects.toThrow("2 cleanup(s) failed during dispose");
  });

  it("일부 cleanup이 실패해도 나머지를 실행한다", async () => {
    const order: string[] = [];
    const d = createDisposable();

    d.add(() => { order.push("a"); });
    d.add(() => { throw new Error("fail"); });
    d.add(() => { order.push("c"); });

    try { await d.dispose(); } catch { /* expected */ }
    expect(order).toEqual(["c", "a"]);
  });

  it("disposed 속성이 정확하다", async () => {
    const d = createDisposable();
    expect(d.disposed).toBe(false);

    await d.dispose();
    expect(d.disposed).toBe(true);
  });

  it("size가 정확하다", () => {
    const d = createDisposable();
    expect(d.size).toBe(0);

    d.add(() => {});
    d.add(() => {});
    expect(d.size).toBe(2);
  });
});

describe("using", () => {
  it("fn 실행 후 자동 dispose한다", async () => {
    let disposed = false;

    const result = await using(async (d) => {
      d.add(() => { disposed = true; });
      return 42;
    });

    expect(result).toBe(42);
    expect(disposed).toBe(true);
  });

  it("fn이 에러를 던져도 dispose한다", async () => {
    let disposed = false;

    await expect(
      using(async (d) => {
        d.add(() => { disposed = true; });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(disposed).toBe(true);
  });

  it("동기 fn도 지원한다", async () => {
    let disposed = false;

    const result = await using((d) => {
      d.add(() => { disposed = true; });
      return "sync";
    });

    expect(result).toBe("sync");
    expect(disposed).toBe(true);
  });
});
