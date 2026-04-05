import { describe, expect, it } from "vitest";
import { createAsyncQueue } from "./asyncQueue";

describe("createAsyncQueue — 기본 동작", () => {
  it("초기 상태: size=0, closed=false", () => {
    const q = createAsyncQueue<number>();
    expect(q.size).toBe(0);
    expect(q.closed).toBe(false);
  });

  it("push 후 즉시 pop 가능", async () => {
    const q = createAsyncQueue<number>();
    await q.push(1);
    await q.push(2);
    expect(q.size).toBe(2);

    expect(await q.pop()).toBe(1);
    expect(await q.pop()).toBe(2);
    expect(q.size).toBe(0);
  });

  it("FIFO 순서 보장", async () => {
    const q = createAsyncQueue<string>();
    await q.push("a");
    await q.push("b");
    await q.push("c");

    expect(await q.pop()).toBe("a");
    expect(await q.pop()).toBe("b");
    expect(await q.pop()).toBe("c");
  });
});

describe("pop() — 비어있을 때 대기", () => {
  it("pop()이 push() 전에 호출되면 push 시점에 resolve된다", async () => {
    const q = createAsyncQueue<number>();

    const popPromise = q.pop(); // 아직 비어 있음 → 대기
    await q.push(42);

    expect(await popPromise).toBe(42);
  });

  it("pop()이 버퍼를 건너뛰고 직접 전달된다 (zero-copy fast path)", async () => {
    const q = createAsyncQueue<number>();

    let received: number | undefined;
    const popPromise = q.pop().then((v) => { received = v; });

    expect(received).toBeUndefined();
    await q.push(99); // pop 대기자에게 직접 전달
    await popPromise;
    expect(received).toBe(99);
    expect(q.size).toBe(0); // 버퍼에 쌓이지 않음
  });
});

describe("close()", () => {
  it("close 후 pop()은 남은 항목을 소비한다", async () => {
    const q = createAsyncQueue<number>();
    await q.push(1);
    await q.push(2);
    q.close();

    expect(await q.pop()).toBe(1);
    expect(await q.pop()).toBe(2);
    expect(await q.pop()).toBeUndefined(); // 비어있고 닫혔으면 undefined
  });

  it("close 후 push()는 에러를 던진다", async () => {
    const q = createAsyncQueue<number>();
    q.close();
    await expect(q.push(1)).rejects.toThrow("closed");
  });

  it("close()는 대기 중인 pop()을 undefined로 resolve한다", async () => {
    const q = createAsyncQueue<number>();
    const p = q.pop(); // 대기 중
    q.close();
    expect(await p).toBeUndefined();
  });

  it("중복 close()는 무시된다", () => {
    const q = createAsyncQueue<number>();
    q.close();
    expect(() => q.close()).not.toThrow();
    expect(q.closed).toBe(true);
  });
});

describe("capacity (backpressure)", () => {
  it("capacity 초과 시 push()가 대기한다", async () => {
    const q = createAsyncQueue<number>({ capacity: 2 });
    await q.push(1);
    await q.push(2);
    expect(q.size).toBe(2);

    let pushed = false;
    const pushPromise = q.push(3).then(() => { pushed = true; });

    // 아직 소비 전 — push 대기 중
    expect(pushed).toBe(false);

    await q.pop(); // 하나 꺼내면 push가 완료됨
    await pushPromise;
    expect(pushed).toBe(true);
    expect(q.size).toBe(2);
  });

  it("capacity 없으면 backpressure 없이 즉시 push", async () => {
    const q = createAsyncQueue<number>();
    for (let i = 0; i < 1000; i++) {
      await q.push(i);
    }
    expect(q.size).toBe(1000);
  });
});

describe("for await...of (AsyncIterator)", () => {
  it("모든 항목을 순서대로 소비한다", async () => {
    const q = createAsyncQueue<number>();
    await q.push(1);
    await q.push(2);
    await q.push(3);
    q.close();

    const collected: number[] = [];
    for await (const item of q) {
      collected.push(item);
    }
    expect(collected).toEqual([1, 2, 3]);
  });

  it("push와 소비가 동시에 진행된다", async () => {
    const q = createAsyncQueue<number>({ capacity: 2 });
    const collected: number[] = [];

    // producer
    const producer = (async () => {
      for (let i = 0; i < 5; i++) {
        await q.push(i);
      }
      q.close();
    })();

    // consumer
    for await (const item of q) {
      collected.push(item);
    }

    await producer;
    expect(collected).toEqual([0, 1, 2, 3, 4]);
  });

  it("멀티 consumer — 각 항목은 한 번씩만 소비된다", async () => {
    const q = createAsyncQueue<number>({ capacity: 5 });
    const consumed: number[] = [];

    for (let i = 0; i < 5; i++) await q.push(i);
    q.close();

    const worker = async () => {
      let item: number | undefined;
      while ((item = await q.pop()) !== undefined) {
        consumed.push(item);
      }
    };

    await Promise.all([worker(), worker(), worker()]);
    expect(consumed.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("실사용 시나리오", () => {
  it("파이프라인 처리 — transform 후 다음 큐로 전달", async () => {
    const inputQ = createAsyncQueue<number>({ capacity: 5 });
    const outputQ = createAsyncQueue<string>({ capacity: 5 });

    // transform stage
    const transformer = (async () => {
      for await (const n of inputQ) {
        await outputQ.push(`item-${n}`);
      }
      outputQ.close();
    })();

    // produce
    for (let i = 0; i < 3; i++) await inputQ.push(i);
    inputQ.close();

    // collect results
    const results: string[] = [];
    for await (const s of outputQ) {
      results.push(s);
    }
    await transformer;

    expect(results).toEqual(["item-0", "item-1", "item-2"]);
  });
});
