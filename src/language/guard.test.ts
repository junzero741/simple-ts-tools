import { describe, it, expect } from "vitest";
import { is } from "./guard";

describe("is (타입 가드 조합기)", () => {
  describe("기본 가드", () => {
    it("string", () => {
      expect(is.string("hello")).toBe(true);
      expect(is.string(42)).toBe(false);
      expect(is.string("")).toBe(true);
    });

    it("number — NaN은 false", () => {
      expect(is.number(42)).toBe(true);
      expect(is.number(0)).toBe(true);
      expect(is.number(NaN)).toBe(false);
      expect(is.number("42")).toBe(false);
    });

    it("boolean", () => {
      expect(is.boolean(true)).toBe(true);
      expect(is.boolean(false)).toBe(true);
      expect(is.boolean(0)).toBe(false);
    });

    it("nil — null 또는 undefined", () => {
      expect(is.nil(null)).toBe(true);
      expect(is.nil(undefined)).toBe(true);
      expect(is.nil(0)).toBe(false);
      expect(is.nil("")).toBe(false);
    });

    it("defined — null/undefined가 아닌 값", () => {
      expect(is.defined(0)).toBe(true);
      expect(is.defined("")).toBe(true);
      expect(is.defined(null)).toBe(false);
      expect(is.defined(undefined)).toBe(false);
    });

    it("object — 배열 제외", () => {
      expect(is.object({})).toBe(true);
      expect(is.object({ a: 1 })).toBe(true);
      expect(is.object([])).toBe(false);
      expect(is.object(null)).toBe(false);
    });

    it("array", () => {
      expect(is.array([])).toBe(true);
      expect(is.array([1, 2])).toBe(true);
      expect(is.array({})).toBe(false);
    });

    it("date — 유효한 Date만", () => {
      expect(is.date(new Date())).toBe(true);
      expect(is.date(new Date("invalid"))).toBe(false);
      expect(is.date("2024-01-01")).toBe(false);
    });

    it("function", () => {
      expect(is.function(() => {})).toBe(true);
      expect(is.function(42)).toBe(false);
    });

    it("promise", () => {
      expect(is.promise(Promise.resolve())).toBe(true);
      expect(is.promise({ then: () => {} })).toBe(true);
      expect(is.promise({})).toBe(false);
    });
  });

  describe("literal", () => {
    it("정확한 값과 일치", () => {
      const isAdmin = is.literal("admin");
      expect(isAdmin("admin")).toBe(true);
      expect(isAdmin("user")).toBe(false);
    });
  });

  describe("arrayOf", () => {
    it("모든 요소가 가드를 만족해야 true", () => {
      expect(is.arrayOf(is.number)([1, 2, 3])).toBe(true);
      expect(is.arrayOf(is.number)([1, "2", 3])).toBe(false);
      expect(is.arrayOf(is.string)([])).toBe(true);
    });

    it("배열이 아니면 false", () => {
      expect(is.arrayOf(is.number)("not array")).toBe(false);
    });
  });

  describe("optional / nullable", () => {
    it("optional — undefined이거나 가드 만족", () => {
      const opt = is.optional(is.string);
      expect(opt("hello")).toBe(true);
      expect(opt(undefined)).toBe(true);
      expect(opt(null)).toBe(false);
      expect(opt(42)).toBe(false);
    });

    it("nullable — null/undefined이거나 가드 만족", () => {
      const nul = is.nullable(is.string);
      expect(nul("hello")).toBe(true);
      expect(nul(null)).toBe(true);
      expect(nul(undefined)).toBe(true);
      expect(nul(42)).toBe(false);
    });
  });

  describe("or / and / not", () => {
    it("or — 하나라도 만족하면 true", () => {
      const guard = is.or(is.string, is.number);
      expect(guard("hi")).toBe(true);
      expect(guard(42)).toBe(true);
      expect(guard(true)).toBe(false);
    });

    it("and — 모두 만족해야 true", () => {
      const positiveNumber = is.and(
        is.number,
        ((v: unknown) => typeof v === "number" && v > 0) as any,
      );
      expect(positiveNumber(5)).toBe(true);
      expect(positiveNumber(-1)).toBe(false);
      expect(positiveNumber("5")).toBe(false);
    });

    it("not — 반전", () => {
      const notString = is.not(is.string);
      expect(notString(42)).toBe(true);
      expect(notString("hi")).toBe(false);
    });
  });

  describe("shape", () => {
    it("모든 프로퍼티가 가드를 만족해야 true", () => {
      const isUser = is.shape({
        name: is.string,
        age: is.number,
      });

      expect(isUser({ name: "alice", age: 30 })).toBe(true);
      expect(isUser({ name: "alice", age: "30" })).toBe(false);
      expect(isUser({ name: "alice" })).toBe(false);
    });

    it("optional 프로퍼티 지원", () => {
      const isUser = is.shape({
        name: is.string,
        email: is.optional(is.string),
      });

      expect(isUser({ name: "alice" })).toBe(true);
      expect(isUser({ name: "alice", email: "a@b.com" })).toBe(true);
      expect(isUser({ name: "alice", email: 42 })).toBe(false);
    });

    it("중첩 shape", () => {
      const isAddress = is.shape({
        city: is.string,
        zip: is.string,
      });
      const isUser = is.shape({
        name: is.string,
        address: isAddress,
      });

      expect(isUser({ name: "alice", address: { city: "Seoul", zip: "06000" } })).toBe(true);
      expect(isUser({ name: "alice", address: { city: "Seoul" } })).toBe(false);
    });

    it("배열/null에 false", () => {
      const guard = is.shape({ a: is.number });
      expect(guard(null)).toBe(false);
      expect(guard([])).toBe(false);
    });
  });

  describe("oneOf", () => {
    it("열거된 값 중 하나인지 검사", () => {
      const isStatus = is.oneOf("active", "inactive", "pending");
      expect(isStatus("active")).toBe(true);
      expect(isStatus("deleted")).toBe(false);
    });
  });

  describe("instanceOf", () => {
    it("인스턴스 검사", () => {
      expect(is.instanceOf(Date)(new Date())).toBe(true);
      expect(is.instanceOf(Date)("2024")).toBe(false);
      expect(is.instanceOf(Error)(new TypeError("x"))).toBe(true);
    });
  });

  describe("recordOf", () => {
    it("모든 값이 가드를 만족하는 객체", () => {
      expect(is.recordOf(is.number)({ a: 1, b: 2 })).toBe(true);
      expect(is.recordOf(is.number)({ a: 1, b: "2" })).toBe(false);
      expect(is.recordOf(is.string)([])).toBe(false);
    });
  });

  describe("tuple", () => {
    it("순서와 타입이 정확히 일치해야 true", () => {
      const isPoint = is.tuple(is.number, is.number);
      expect(isPoint([1, 2])).toBe(true);
      expect(isPoint([1, "2"])).toBe(false);
      expect(isPoint([1])).toBe(false);
      expect(isPoint([1, 2, 3])).toBe(false);
    });

    it("혼합 타입 튜플", () => {
      const guard = is.tuple(is.string, is.number, is.boolean);
      expect(guard(["a", 1, true])).toBe(true);
      expect(guard(["a", 1, "true"])).toBe(false);
    });
  });
});
