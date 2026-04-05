import { describe, expect, it } from "vitest";
import { createDeferred } from "./deferred";

describe("createDeferred", () => {
  it("초기 상태는 pending이다", () => {
    const d = createDeferred<number>();
    expect(d.status).toBe("pending");
  });

  it("resolve 호출 후 promise가 해당 값으로 settle된다", async () => {
    const d = createDeferred<string>();
    d.resolve("hello");
    expect(await d.promise).toBe("hello");
    expect(d.status).toBe("fulfilled");
  });

  it("reject 호출 후 promise가 reject된다", async () => {
    const d = createDeferred<number>();
    d.reject(new Error("fail"));
    await expect(d.promise).rejects.toThrow("fail");
    expect(d.status).toBe("rejected");
  });

  it("resolve 이후 중복 resolve는 무시된다", async () => {
    const d = createDeferred<number>();
    d.resolve(1);
    d.resolve(2); // 무시
    expect(await d.promise).toBe(1);
  });

  it("resolve 이후 reject는 무시된다", async () => {
    const d = createDeferred<string>();
    d.resolve("ok");
    d.reject(new Error("ignored")); // 무시
    expect(await d.promise).toBe("ok");
    expect(d.status).toBe("fulfilled");
  });

  it("reject 이후 resolve는 무시된다", async () => {
    const d = createDeferred<string>();
    d.reject(new Error("first"));
    d.resolve("ignored"); // 무시
    await expect(d.promise).rejects.toThrow("first");
    expect(d.status).toBe("rejected");
  });

  it("void 타입 기본값으로 사용할 수 있다", async () => {
    const d = createDeferred();
    d.resolve();
    await expect(d.promise).resolves.toBeUndefined();
  });

  it("외부에서 비동기로 resolve할 수 있다", async () => {
    const d = createDeferred<number>();
    setTimeout(() => d.resolve(42), 10);
    expect(await d.promise).toBe(42);
  });

  it("핸드셰이크 패턴: 두 흐름 사이의 신호", async () => {
    const ready = createDeferred<void>();
    const results: string[] = [];

    // consumer: ready 신호 대기 후 동작
    const consumer = (async () => {
      await ready.promise;
      results.push("consumer done");
    })();

    // producer: 작업 완료 후 신호 발신
    results.push("producer working");
    ready.resolve();
    await consumer;

    expect(results).toEqual(["producer working", "consumer done"]);
  });
});
