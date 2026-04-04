import { describe, expect, it, vi } from "vitest";
import { once } from "./once";

describe("once", () => {
  it("함수를 딱 한 번만 실행한다", () => {
    const fn = vi.fn(() => 42);
    const wrapped = once(fn);

    wrapped();
    wrapped();
    wrapped();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("첫 번째 반환값을 이후 호출에서도 반환한다", () => {
    let counter = 0;
    const wrapped = once(() => ++counter);

    expect(wrapped()).toBe(1);
    expect(wrapped()).toBe(1);
    expect(wrapped()).toBe(1);
  });

  it("첫 번째 호출의 인자를 사용한다", () => {
    const fn = vi.fn((x: number) => x * 2);
    const wrapped = once(fn);

    expect(wrapped(5)).toBe(10);
    expect(wrapped(99)).toBe(10); // 두 번째 인자는 무시됨
    expect(fn).toHaveBeenCalledWith(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("비동기 함수도 한 번만 실행한다", async () => {
    const fn = vi.fn(async (x: number) => x * 2);
    const wrapped = once(fn);

    const [r1, r2] = await Promise.all([wrapped(5), wrapped(5)]);
    expect(r1).toBe(10);
    expect(r2).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it(".reset() 후 다음 호출에서 재실행된다", () => {
    let counter = 0;
    const wrapped = once(() => ++counter);

    expect(wrapped()).toBe(1);
    wrapped.reset();
    expect(wrapped()).toBe(2); // 재실행
    expect(wrapped()).toBe(2); // 다시 캐시
  });

  it("side effect가 있는 초기화 코드를 한 번만 실행한다", () => {
    const sideEffects: string[] = [];
    const init = once(() => {
      sideEffects.push("initialized");
      return { ready: true };
    });

    init();
    init();
    init();

    expect(sideEffects).toEqual(["initialized"]);
  });
});
