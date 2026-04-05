import { describe, it, expect } from "vitest";
import { createSemaphore } from "./semaphore";

describe("createSemaphore", () => {
  it("permits 수만큼 동시에 acquire 가능하다", async () => {
    const sem = createSemaphore(2);

    await sem.acquire();
    await sem.acquire();
    expect(sem.available).toBe(0);

    sem.release();
    expect(sem.available).toBe(1);

    sem.release();
    expect(sem.available).toBe(2);
  });

  it("permits 초과 시 대기한다", async () => {
    const sem = createSemaphore(1);
    await sem.acquire();

    let acquired = false;
    const p = sem.acquire().then(() => { acquired = true; });

    await new Promise((r) => setTimeout(r, 10));
    expect(acquired).toBe(false);
    expect(sem.waiting).toBe(1);

    sem.release();
    await p;
    expect(acquired).toBe(true);
  });

  it("FIFO 순서로 대기자를 깨운다", async () => {
    const sem = createSemaphore(1);
    await sem.acquire();

    const order: number[] = [];
    const p1 = sem.acquire().then(() => order.push(1));
    const p2 = sem.acquire().then(() => order.push(2));
    const p3 = sem.acquire().then(() => order.push(3));

    sem.release();
    await p1;
    sem.release();
    await p2;
    sem.release();
    await p3;

    expect(order).toEqual([1, 2, 3]);
  });

  it("using은 자동으로 release한다", async () => {
    const sem = createSemaphore(1);

    const result = await sem.using(() => 42);
    expect(result).toBe(42);
    expect(sem.available).toBe(1);
  });

  it("using 내부에서 에러가 나도 release한다", async () => {
    const sem = createSemaphore(1);

    await expect(
      sem.using(() => { throw new Error("boom"); }),
    ).rejects.toThrow("boom");

    expect(sem.available).toBe(1);
  });

  it("using은 async 함수를 지원한다", async () => {
    const sem = createSemaphore(1);

    const result = await sem.using(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return "done";
    });
    expect(result).toBe("done");
  });

  it("동시 실행 수를 제한한다", async () => {
    const sem = createSemaphore(2);
    let concurrent = 0;
    let maxConcurrent = 0;

    const work = () =>
      sem.using(async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 20));
        concurrent--;
      });

    await Promise.all(Array.from({ length: 6 }, () => work()));

    expect(maxConcurrent).toBe(2);
  });

  it("release가 permits를 초과하지 않는다", async () => {
    const sem = createSemaphore(2);

    sem.release();
    sem.release();
    sem.release();

    expect(sem.available).toBe(2);
  });

  it("permits < 1이면 에러를 던진다", () => {
    expect(() => createSemaphore(0)).toThrow("permits must be at least 1");
  });

  it("available과 waiting 속성이 정확하다", async () => {
    const sem = createSemaphore(2);

    expect(sem.available).toBe(2);
    expect(sem.waiting).toBe(0);

    await sem.acquire();
    expect(sem.available).toBe(1);

    await sem.acquire();
    expect(sem.available).toBe(0);

    const p = sem.acquire();
    expect(sem.waiting).toBe(1);

    sem.release();
    await p;
    expect(sem.waiting).toBe(0);

    sem.release();
    sem.release();
  });
});
