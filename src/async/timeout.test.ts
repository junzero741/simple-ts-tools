import { describe, expect, it, vi } from "vitest";
import { timeout } from "./timeout";

describe("timeout", () => {
  it("Promise가 타임아웃 전에 완료되면 값을 반환한다", async () => {
    const result = await timeout(Promise.resolve(42), 100);
    expect(result).toBe(42);
  });

  it("타임아웃이 초과되면 에러를 던진다", async () => {
    vi.useFakeTimers();
    const slow = new Promise<never>(() => {}); // 절대 완료되지 않음
    const promise = timeout(slow, 1000);

    vi.advanceTimersByTime(1001);

    await expect(promise).rejects.toThrow("Timed out after 1000ms");
    vi.useRealTimers();
  });

  it("커스텀 에러 메시지를 사용한다", async () => {
    vi.useFakeTimers();
    const slow = new Promise<never>(() => {});
    const promise = timeout(slow, 500, "Request took too long");

    vi.advanceTimersByTime(501);

    await expect(promise).rejects.toThrow("Request took too long");
    vi.useRealTimers();
  });

  it("원본 Promise가 reject하면 그 에러를 전파한다", async () => {
    const failing = Promise.reject(new Error("upstream error"));
    await expect(timeout(failing, 1000)).rejects.toThrow("upstream error");
  });

  it("문자열, 객체 등 다양한 타입을 처리한다", async () => {
    expect(await timeout(Promise.resolve("hello"), 100)).toBe("hello");
    expect(await timeout(Promise.resolve({ a: 1 }), 100)).toEqual({ a: 1 });
  });
});
