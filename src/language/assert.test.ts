import { describe, it, expect, vi } from "vitest";
import {
  assert,
  assertDefined,
  assertInstanceOf,
  assertType,
  unreachable,
  softAssert,
  assertInRange,
  AssertionError,
} from "./assert";

describe("assert", () => {
  it("조건이 참이면 통과한다", () => {
    expect(() => assert(true)).not.toThrow();
    expect(() => assert(1)).not.toThrow();
    expect(() => assert("non-empty")).not.toThrow();
  });

  it("조건이 거짓이면 AssertionError를 던진다", () => {
    expect(() => assert(false)).toThrow(AssertionError);
    expect(() => assert(null)).toThrow(AssertionError);
    expect(() => assert(0)).toThrow(AssertionError);
    expect(() => assert("")).toThrow(AssertionError);
  });

  it("메시지를 포함한다", () => {
    expect(() => assert(false, "must be true")).toThrow("must be true");
  });

  it("기본 메시지가 있다", () => {
    expect(() => assert(false)).toThrow("Assertion failed");
  });
});

describe("assertDefined", () => {
  it("정의된 값은 통과한다", () => {
    expect(() => assertDefined(0)).not.toThrow();
    expect(() => assertDefined("")).not.toThrow();
    expect(() => assertDefined(false)).not.toThrow();
  });

  it("null은 에러를 던진다", () => {
    expect(() => assertDefined(null)).toThrow(AssertionError);
  });

  it("undefined는 에러를 던진다", () => {
    expect(() => assertDefined(undefined)).toThrow(AssertionError);
  });

  it("커스텀 메시지를 지원한다", () => {
    expect(() => assertDefined(null, "not found")).toThrow("not found");
  });
});

describe("assertInstanceOf", () => {
  it("올바른 인스턴스는 통과한다", () => {
    expect(() => assertInstanceOf(new Error(), Error)).not.toThrow();
    expect(() => assertInstanceOf(new TypeError("x"), Error)).not.toThrow();
  });

  it("잘못된 인스턴스는 에러를 던진다", () => {
    expect(() => assertInstanceOf("string", Error)).toThrow(AssertionError);
    expect(() => assertInstanceOf(42, Error)).toThrow("Expected instance of Error");
  });
});

describe("assertType", () => {
  it("올바른 타입은 통과한다", () => {
    expect(() => assertType("hello", "string")).not.toThrow();
    expect(() => assertType(42, "number")).not.toThrow();
    expect(() => assertType(true, "boolean")).not.toThrow();
    expect(() => assertType(() => {}, "function")).not.toThrow();
  });

  it("잘못된 타입은 에러를 던진다", () => {
    expect(() => assertType(42, "string")).toThrow(AssertionError);
    expect(() => assertType("hi", "number")).toThrow("Expected typeof number, got string");
  });
});

describe("unreachable", () => {
  it("호출되면 항상 에러를 던진다", () => {
    expect(() => unreachable("bad" as never)).toThrow(AssertionError);
    expect(() => unreachable("bad" as never)).toThrow("bad");
  });

  it("커스텀 메시지를 지원한다", () => {
    expect(() => unreachable("x" as never, "impossible")).toThrow("impossible");
  });

  it("exhaustive switch에서 사용한다", () => {
    type Color = "red" | "blue";
    function handle(c: Color): string {
      switch (c) {
        case "red": return "R";
        case "blue": return "B";
        default: unreachable(c);
      }
    }
    expect(handle("red")).toBe("R");
  });
});

describe("softAssert", () => {
  it("조건이 참이면 true를 반환한다", () => {
    expect(softAssert(true)).toBe(true);
  });

  it("조건이 거짓이면 false를 반환하고 console.error를 호출한다", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(softAssert(false, "oops")).toBe(false);
    expect(spy).toHaveBeenCalledWith("[SoftAssert] oops");
    spy.mockRestore();
  });
});

describe("assertInRange", () => {
  it("범위 내 값은 통과한다", () => {
    expect(() => assertInRange(5, 0, 10)).not.toThrow();
    expect(() => assertInRange(0, 0, 10)).not.toThrow();
    expect(() => assertInRange(10, 0, 10)).not.toThrow();
  });

  it("범위 밖 값은 에러를 던진다", () => {
    expect(() => assertInRange(-1, 0, 10)).toThrow(AssertionError);
    expect(() => assertInRange(11, 0, 10)).toThrow(AssertionError);
  });

  it("label을 포함한다", () => {
    expect(() => assertInRange(99, 0, 10, "age")).toThrow(
      "age must be between 0 and 10, got 99",
    );
  });
});

describe("AssertionError", () => {
  it("Error를 상속한다", () => {
    const err = new AssertionError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AssertionError);
    expect(err.name).toBe("AssertionError");
    expect(err.message).toBe("test");
  });
});
