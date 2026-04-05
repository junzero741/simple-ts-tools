import { describe, expect, it } from "vitest";
import {
  isArray,
  isBoolean,
  isDefined,
  isFunction,
  isNil,
  isNumber,
  isObject,
  isString,
} from "./typeGuards";

describe("isNil", () => {
  it("null과 undefined를 true로 판별한다", () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
  });

  it("나머지 값은 false로 판별한다", () => {
    expect(isNil(0)).toBe(false);
    expect(isNil("")).toBe(false);
    expect(isNil(false)).toBe(false);
    expect(isNil([])).toBe(false);
    expect(isNil({})).toBe(false);
  });
});

describe("isDefined", () => {
  it("null/undefined가 아닌 값은 true로 판별한다", () => {
    expect(isDefined("hello")).toBe(true);
    expect(isDefined(0)).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined([])).toBe(true);
  });

  it("null과 undefined는 false로 판별한다", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });

  it("타입 가드로 NonNullable 타입을 추론한다", () => {
    const values: (string | null | undefined)[] = ["a", null, "b", undefined, "c"];
    const defined = values.filter(isDefined);
    // defined: string[] 로 추론됨
    expect(defined).toEqual(["a", "b", "c"]);
  });
});

describe("isString", () => {
  it("문자열을 true로 판별한다", () => {
    expect(isString("")).toBe(true);
    expect(isString("hello")).toBe(true);
  });

  it("비문자열은 false로 판별한다", () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(["a"])).toBe(false);
  });
});

describe("isNumber", () => {
  it("숫자를 true로 판별한다", () => {
    expect(isNumber(42)).toBe(true);
    expect(isNumber(0)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
    expect(isNumber(Infinity)).toBe(true);
  });

  it("NaN은 false로 판별한다", () => {
    expect(isNumber(NaN)).toBe(false);
  });

  it("비숫자는 false로 판별한다", () => {
    expect(isNumber("42")).toBe(false);
    expect(isNumber(null)).toBe(false);
  });
});

describe("isBoolean", () => {
  it("true/false를 true로 판별한다", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
  });

  it("비불리언은 false로 판별한다", () => {
    expect(isBoolean(1)).toBe(false);
    expect(isBoolean("true")).toBe(false);
    expect(isBoolean(null)).toBe(false);
  });
});

describe("isArray", () => {
  it("배열을 true로 판별한다", () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
  });

  it("비배열은 false로 판별한다", () => {
    expect(isArray({})).toBe(false);
    expect(isArray("abc")).toBe(false);
    expect(isArray(null)).toBe(false);
  });
});

describe("isObject", () => {
  it("plain 객체를 true로 판별한다", () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
    expect(isObject(Object.create(null))).toBe(true);
  });

  it("null, 배열, Date, Map 등은 false로 판별한다", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject([])).toBe(false);
    expect(isObject(new Date())).toBe(false);
    expect(isObject(new Map())).toBe(false);
    expect(isObject("hello")).toBe(false);
    expect(isObject(42)).toBe(false);
  });
});

describe("isFunction", () => {
  it("함수를 true로 판별한다", () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(function () {})).toBe(true);
    expect(isFunction(Math.round)).toBe(true);
  });

  it("비함수는 false로 판별한다", () => {
    expect(isFunction(42)).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction({})).toBe(false);
  });
});
