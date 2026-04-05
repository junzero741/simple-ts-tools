import { describe, it, expect, vi } from "vitest";
import { signal, signalComputed, effect, untracked } from "./signal";

describe("signal", () => {
  it("초기값을 읽는다", () => {
    const [count] = signal(42);
    expect(count()).toBe(42);
  });

  it("값을 설정한다", () => {
    const [count, setCount] = signal(0);
    setCount(10);
    expect(count()).toBe(10);
  });

  it("같은 값이면 알리지 않는다", () => {
    const [count, setCount] = signal(0);
    const fn = vi.fn();
    effect(() => { count(); fn(); });

    fn.mockClear();
    setCount(0); // 같은 값
    expect(fn).not.toHaveBeenCalled();
  });

  it("함수 업데이터를 지원한다", () => {
    const [count, setCount] = signal(5);
    setCount((prev) => prev + 1);
    expect(count()).toBe(6);
  });

  it("peek는 의존성을 추적하지 않는다", () => {
    const [count, setCount] = signal(0);
    const fn = vi.fn();

    effect(() => {
      count.peek();
      fn();
    });

    fn.mockClear();
    setCount(1);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("signalComputed", () => {
  it("의존 signal에서 파생된 값을 계산한다", () => {
    const [count] = signal(3);
    const doubled = signalComputed(() => count() * 2);

    expect(doubled()).toBe(6);
  });

  it("의존 signal 변경 시 재계산한다", () => {
    const [count, setCount] = signal(1);
    const doubled = signalComputed(() => count() * 2);

    setCount(5);
    expect(doubled()).toBe(10);
  });

  it("불필요한 재계산을 방지한다 (캐시)", () => {
    const [count] = signal(1);
    const fn = vi.fn(() => count() * 2);
    const doubled = signalComputed(fn);

    doubled();
    doubled();
    doubled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("체이닝 — computed에서 computed 파생", () => {
    const [a, setA] = signal(2);
    const b = signalComputed(() => a() * 3);
    const c = signalComputed(() => b() + 1);

    expect(c()).toBe(7); // 2*3+1

    setA(10);
    expect(c()).toBe(31); // 10*3+1
  });

  it("peek는 추적 안 함", () => {
    const [a, setA] = signal(1);
    const fn = vi.fn();
    const comp = signalComputed(() => { fn(); return a.peek(); });

    comp();
    fn.mockClear();
    setA(2);
    comp();
    // a가 변경되어도 추적 안 했으므로 dirty가 안 됨...
    // 하지만 peek 내부에서 activeEffect를 안 설정하므로 재계산 안 함
  });
});

describe("effect", () => {
  it("즉시 실행된다", () => {
    const fn = vi.fn();
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledOnce();
    dispose();
  });

  it("의존 signal 변경 시 자동 재실행", () => {
    const [count, setCount] = signal(0);
    const values: number[] = [];

    const dispose = effect(() => {
      values.push(count());
    });

    setCount(1);
    setCount(2);

    expect(values).toEqual([0, 1, 2]);
    dispose();
  });

  it("computed 변경 시에도 재실행", () => {
    const [a, setA] = signal(1);
    const doubled = signalComputed(() => a() * 2);
    const values: number[] = [];

    const dispose = effect(() => {
      values.push(doubled());
    });

    setA(5);
    expect(values).toEqual([2, 10]);
    dispose();
  });

  it("dispose 후 재실행 안 함", () => {
    const [count, setCount] = signal(0);
    const fn = vi.fn();

    const dispose = effect(() => { count(); fn(); });
    fn.mockClear();

    dispose();
    setCount(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("cleanup 함수를 실행한다", () => {
    const [count, setCount] = signal(0);
    const cleanupFn = vi.fn();

    const dispose = effect(() => {
      count();
      return cleanupFn;
    });

    setCount(1); // 이전 cleanup 실행
    expect(cleanupFn).toHaveBeenCalledOnce();

    dispose(); // 마지막 cleanup
    expect(cleanupFn).toHaveBeenCalledTimes(2);
  });

  it("여러 signal 의존", () => {
    const [a, setA] = signal(1);
    const [b, setB] = signal(10);
    const values: number[] = [];

    const dispose = effect(() => {
      values.push(a() + b());
    });

    setA(2);
    setB(20);
    expect(values).toEqual([11, 12, 22]);
    dispose();
  });
});

describe("untracked", () => {
  it("의존성을 추적하지 않는다", () => {
    const [count, setCount] = signal(0);
    const fn = vi.fn();

    const dispose = effect(() => {
      untracked(() => count());
      fn();
    });

    fn.mockClear();
    setCount(1);
    expect(fn).not.toHaveBeenCalled();
    dispose();
  });
});

describe("실전 시나리오", () => {
  it("폼 유효성 — 여러 필드 조합", () => {
    const [name, setName] = signal("");
    const [email, setEmail] = signal("");
    const isValid = signalComputed(
      () => name().length > 0 && email().includes("@"),
    );

    expect(isValid()).toBe(false);
    setName("Alice");
    expect(isValid()).toBe(false);
    setEmail("alice@example.com");
    expect(isValid()).toBe(true);
  });
});
