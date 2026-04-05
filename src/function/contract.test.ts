import { describe, it, expect } from "vitest";
import { contract, withInvariant, ContractError } from "./contract";

describe("contract", () => {
  describe("precondition", () => {
    it("조건 통과 시 정상 실행", () => {
      const div = contract(
        (a: number, b: number) => a / b,
        { pre: [(_a, b) => b !== 0, "divisor must not be zero"] },
      );

      expect(div(10, 2)).toBe(5);
    });

    it("조건 실패 시 ContractError", () => {
      const div = contract(
        (a: number, b: number) => a / b,
        { pre: [(_a, b) => b !== 0, "divisor must not be zero"] },
      );

      expect(() => div(10, 0)).toThrow(ContractError);
      expect(() => div(10, 0)).toThrow("divisor must not be zero");
    });

    it("여러 precondition", () => {
      const clamp = contract(
        (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
        {
          pre: [
            [(_v, min, max) => min <= max, "min must not exceed max"],
            [(v) => isFinite(v), "value must be finite"],
          ],
        },
      );

      expect(clamp(5, 0, 10)).toBe(5);
      expect(() => clamp(5, 10, 0)).toThrow("min must not exceed max");
      expect(() => clamp(Infinity, 0, 10)).toThrow("value must be finite");
    });

    it("메시지 없는 함수 조건", () => {
      const positive = contract(
        (n: number) => n,
        { pre: (n: number) => n > 0 },
      );

      expect(positive(1)).toBe(1);
      expect(() => positive(-1)).toThrow("precondition");
    });
  });

  describe("postcondition", () => {
    it("결과 검증 통과", () => {
      const abs = contract(
        (n: number) => Math.abs(n),
        { post: [(result) => result >= 0, "result must be non-negative"] },
      );

      expect(abs(-5)).toBe(5);
    });

    it("결과 검증 실패", () => {
      const broken = contract(
        (_n: number) => -1,
        { post: [(result) => result >= 0, "result must be non-negative"] },
      );

      expect(() => broken(5)).toThrow("result must be non-negative");
    });

    it("postcondition 에러 타입 확인", () => {
      const broken = contract(
        () => -1,
        { post: [(r) => r >= 0, "bad"] },
      );

      try {
        broken();
      } catch (e) {
        expect(e).toBeInstanceOf(ContractError);
        expect((e as ContractError).type).toBe("postcondition");
      }
    });
  });

  describe("pre + post 조합", () => {
    it("둘 다 통과", () => {
      const safeSqrt = contract(
        (n: number) => Math.sqrt(n),
        {
          pre: [(n) => n >= 0, "input must be non-negative"],
          post: [(r) => !isNaN(r), "result must not be NaN"],
        },
      );

      expect(safeSqrt(4)).toBe(2);
    });
  });

  describe("invariant", () => {
    it("호출 전후 invariant를 검증한다", () => {
      let state = 0;

      const inc = contract(
        () => { state++; return state; },
        { invariant: [() => state >= 0, "state must be non-negative"] },
      );

      expect(inc()).toBe(1);
      expect(inc()).toBe(2);
    });

    it("invariant 위반 시 에러", () => {
      let state = -1;

      const fn = contract(
        () => state,
        { invariant: [() => state >= 0, "state must be non-negative"] },
      );

      expect(() => fn()).toThrow("state must be non-negative");
    });
  });

  describe("ContractError", () => {
    it("Error를 상속한다", () => {
      const err = new ContractError("precondition", "test");
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("ContractError");
      expect(err.type).toBe("precondition");
    });
  });
});

describe("withInvariant", () => {
  it("메서드 호출 전후 invariant를 검증한다", () => {
    class Counter {
      count = 0;
      increment() { this.count++; }
      decrement() { this.count--; }
    }

    const counter = withInvariant(
      new Counter(),
      (c) => c.count >= 0,
      "count must be non-negative",
    );

    counter.increment();
    counter.increment();
    expect(counter.count).toBe(2);

    counter.decrement();
    counter.decrement();
    expect(counter.count).toBe(0);

    expect(() => counter.decrement()).toThrow("count must be non-negative");
  });

  it("프로퍼티 접근은 정상 동작", () => {
    const obj = withInvariant(
      { value: 42, get: function() { return this.value; } },
      () => true,
    );

    expect(obj.value).toBe(42);
  });
});
