import { describe, expect, it, vi } from "vitest";
import { memoize } from "./memoize";

describe("memoize", () => {
  it("같은 인자로 재호출 시 원본 함수를 한 번만 실행한다", () => {
    const fn = vi.fn((n: number) => n * 2);
    const memo = memoize(fn);

    expect(memo(5)).toBe(10);
    expect(memo(5)).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("다른 인자는 각각 실행한다", () => {
    const fn = vi.fn((n: number) => n * 2);
    const memo = memoize(fn);

    memo(1);
    memo(2);
    memo(1); // 캐시 히트

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("여러 인자를 조합하여 캐시 키를 만든다", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const memo = memoize(fn);

    expect(memo(1, 2)).toBe(3);
    expect(memo(1, 2)).toBe(3);
    expect(memo(2, 1)).toBe(3); // 인자 순서가 달라서 별도 캐시

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it(".clear()로 캐시를 초기화하면 재계산한다", () => {
    const fn = vi.fn((n: number) => n * 2);
    const memo = memoize(fn);

    memo(5);
    memo.clear();
    memo(5);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it(".cache Map에 직접 접근할 수 있다", () => {
    const memo = memoize((n: number) => n * 2);
    memo(3);
    expect(memo.cache.has(JSON.stringify([3]))).toBe(true);
    expect(memo.cache.size).toBe(1);
  });

  it("커스텀 keyFn을 사용할 수 있다", () => {
    const fn = vi.fn((obj: { id: number }) => obj.id * 10);
    const memo = memoize(fn, (obj) => String(obj.id));

    memo({ id: 1 });
    memo({ id: 1 }); // 기본 JSON.stringify면 참조가 달라 캐시 미스 가능 — keyFn으로 해결

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
