import { describe, expect, it, vi } from "vitest";
import { tap } from "./tap";

describe("tap", () => {
  it("원래 값을 그대로 반환한다", () => {
    const fn = vi.fn();
    const result = tap(fn)(42);
    expect(result).toBe(42);
  });

  it("객체 참조도 그대로 반환한다", () => {
    const obj = { a: 1 };
    const fn = vi.fn();
    const result = tap(fn)(obj);
    expect(result).toBe(obj);
  });

  it("부수 효과 함수를 값과 함께 호출한다", () => {
    const fn = vi.fn();
    tap(fn)("hello");
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("hello");
  });

  it("fn의 반환값이 결과에 영향을 주지 않는다", () => {
    const fn = (_: number) => 999;
    const result = tap(fn)(7);
    expect(result).toBe(7);
  });

  it("배열 map에서 값을 변경하지 않고 부수 효과를 실행한다", () => {
    const log: number[] = [];
    const result = [1, 2, 3].map(tap(x => log.push(x)));
    expect(result).toEqual([1, 2, 3]);
    expect(log).toEqual([1, 2, 3]);
  });

  it("pipe 체인 중간에 삽입해도 데이터 흐름이 유지된다", () => {
    const log: number[] = [];
    const double = (x: number) => x * 2;
    const addTen = (x: number) => x + 10;

    // pipe 없이 직접 합성
    const result = addTen(tap<number>(x => log.push(x))(double(5)));
    expect(result).toBe(20);   // (5*2)+10
    expect(log).toEqual([10]); // double 이후 값
  });

  it("여러 번 호출해도 독립적으로 동작한다", () => {
    const calls: number[] = [];
    const logger = tap<number>(x => calls.push(x));
    logger(1);
    logger(2);
    logger(3);
    expect(calls).toEqual([1, 2, 3]);
  });

  it("undefined / null 값도 통과시킨다", () => {
    const fn = vi.fn();
    expect(tap(fn)(null as unknown as number)).toBeNull();
    expect(tap(fn)(undefined as unknown as number)).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
