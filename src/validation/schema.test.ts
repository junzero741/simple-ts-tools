import { describe, it, expect } from "vitest";
import { s } from "./schema";

describe("schema", () => {
  describe("s.string", () => {
    it("문자열을 통과시킨다", () => {
      expect(s.string().parse("hello")).toEqual({ ok: true, value: "hello" });
    });

    it("문자열이 아니면 실패한다", () => {
      const result = s.string().parse(42);
      expect(result.ok).toBe(false);
      expect(result.errors![0].message).toContain("Expected string");
    });

    it("min — 최소 길이", () => {
      expect(s.string().min(3).parse("abc").ok).toBe(true);
      expect(s.string().min(3).parse("ab").ok).toBe(false);
    });

    it("max — 최대 길이", () => {
      expect(s.string().max(3).parse("abc").ok).toBe(true);
      expect(s.string().max(3).parse("abcd").ok).toBe(false);
    });

    it("pattern — 정규식 매칭", () => {
      expect(s.string().pattern(/^\d+$/).parse("123").ok).toBe(true);
      expect(s.string().pattern(/^\d+$/).parse("abc").ok).toBe(false);
    });

    it("체이닝 — min + max + pattern", () => {
      const schema = s.string().min(2).max(5).pattern(/^[a-z]+$/);
      expect(schema.parse("abc").ok).toBe(true);
      expect(schema.parse("a").ok).toBe(false);
      expect(schema.parse("abcdef").ok).toBe(false);
      expect(schema.parse("ABC").ok).toBe(false);
    });
  });

  describe("s.number", () => {
    it("숫자를 통과시킨다", () => {
      expect(s.number().parse(42)).toEqual({ ok: true, value: 42 });
    });

    it("NaN은 실패한다", () => {
      expect(s.number().parse(NaN).ok).toBe(false);
    });

    it("min / max", () => {
      expect(s.number().min(0).max(100).parse(50).ok).toBe(true);
      expect(s.number().min(0).parse(-1).ok).toBe(false);
      expect(s.number().max(100).parse(101).ok).toBe(false);
    });

    it("int", () => {
      expect(s.number().int().parse(42).ok).toBe(true);
      expect(s.number().int().parse(3.14).ok).toBe(false);
    });
  });

  describe("s.boolean", () => {
    it("불리언을 통과시킨다", () => {
      expect(s.boolean().parse(true)).toEqual({ ok: true, value: true });
      expect(s.boolean().parse("true").ok).toBe(false);
    });
  });

  describe("s.literal", () => {
    it("리터럴 값과 일치", () => {
      expect(s.literal("admin").parse("admin").ok).toBe(true);
      expect(s.literal("admin").parse("user").ok).toBe(false);
      expect(s.literal(42).parse(42).ok).toBe(true);
    });
  });

  describe("s.enum", () => {
    it("열거 값 중 하나와 일치", () => {
      const schema = s.enum(["a", "b", "c"] as const);
      expect(schema.parse("a").ok).toBe(true);
      expect(schema.parse("d").ok).toBe(false);
    });
  });

  describe("s.array", () => {
    it("배열 요소를 검증한다", () => {
      expect(s.array(s.number()).parse([1, 2, 3])).toEqual({ ok: true, value: [1, 2, 3] });
    });

    it("요소가 실패하면 경로 포함 에러", () => {
      const result = s.array(s.number()).parse([1, "two", 3]);
      expect(result.ok).toBe(false);
      expect(result.errors![0].path).toContain("1");
    });

    it("배열이 아니면 실패", () => {
      expect(s.array(s.string()).parse("not array").ok).toBe(false);
    });

    it("min / max", () => {
      expect(s.array(s.number()).min(2).parse([1, 2]).ok).toBe(true);
      expect(s.array(s.number()).min(2).parse([1]).ok).toBe(false);
      expect(s.array(s.number()).max(2).parse([1, 2, 3]).ok).toBe(false);
    });
  });

  describe("s.object", () => {
    it("객체 shape을 검증한다", () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });

      expect(schema.parse({ name: "alice", age: 30 })).toEqual({
        ok: true,
        value: { name: "alice", age: 30 },
      });
    });

    it("필드 실패 시 경로 포함 에러", () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });

      const result = schema.parse({ name: 42, age: "thirty" });
      expect(result.ok).toBe(false);
      expect(result.errors!.length).toBe(2);
      expect(result.errors!.some((e) => e.path.includes("name"))).toBe(true);
      expect(result.errors!.some((e) => e.path.includes("age"))).toBe(true);
    });

    it("중첩 객체", () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
          address: s.object({
            city: s.string(),
          }),
        }),
      });

      const result = schema.parse({ user: { name: "a", address: { city: 123 } } });
      expect(result.ok).toBe(false);
      expect(result.errors![0].path).toEqual(["user", "address", "city"]);
    });

    it("객체가 아니면 실패", () => {
      expect(s.object({ a: s.string() }).parse("not object").ok).toBe(false);
      expect(s.object({ a: s.string() }).parse([]).ok).toBe(false);
      expect(s.object({ a: s.string() }).parse(null).ok).toBe(false);
    });
  });

  describe("optional", () => {
    it("undefined를 허용한다", () => {
      const schema = s.string().optional();
      expect(schema.parse("hello").ok).toBe(true);
      expect(schema.parse(undefined)).toEqual({ ok: true, value: undefined });
    });

    it("null도 undefined로 처리한다", () => {
      expect(s.number().optional().parse(null)).toEqual({ ok: true, value: undefined });
    });

    it("잘못된 타입은 여전히 실패", () => {
      expect(s.string().optional().parse(42).ok).toBe(false);
    });
  });

  describe("default", () => {
    it("undefined일 때 기본값을 사용한다", () => {
      expect(s.string().default("fallback").parse(undefined)).toEqual({
        ok: true,
        value: "fallback",
      });
    });

    it("값이 있으면 그대로 사용한다", () => {
      expect(s.string().default("fallback").parse("actual")).toEqual({
        ok: true,
        value: "actual",
      });
    });

    it("object에서 default 사용", () => {
      const schema = s.object({
        role: s.enum(["admin", "user"] as const).default("user"),
        name: s.string(),
      });

      const result = schema.parse({ name: "alice" });
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ name: "alice", role: "user" });
    });
  });

  describe("transform", () => {
    it("값을 변환한다", () => {
      const schema = s.string().transform((v) => v.toUpperCase());
      expect(schema.parse("hello")).toEqual({ ok: true, value: "HELLO" });
    });

    it("검증 후 변환한다", () => {
      const schema = s.string().min(1).transform((v) => v.length);
      expect(schema.parse("abc")).toEqual({ ok: true, value: 3 });
      expect(schema.parse("").ok).toBe(false);
    });

    it("transform 에러를 잡는다", () => {
      const schema = s.string().transform(() => { throw new Error("transform fail"); });
      const result = schema.parse("test");
      expect(result.ok).toBe(false);
      expect(result.errors![0].message).toBe("transform fail");
    });
  });

  describe("복합 실전 예제", () => {
    it("사용자 스키마", () => {
      const UserSchema = s.object({
        name: s.string().min(1).max(50),
        age: s.number().min(0).max(150).int(),
        email: s.string().optional(),
        tags: s.array(s.string()).max(10),
        role: s.enum(["admin", "user"] as const).default("user"),
      });

      const result = UserSchema.parse({
        name: "alice",
        age: 30,
        tags: ["dev"],
      });

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({
        name: "alice",
        age: 30,
        tags: ["dev"],
        role: "user",
      });
    });

    it("모든 필드 실패 시 에러 수집", () => {
      const schema = s.object({
        a: s.string(),
        b: s.number(),
        c: s.boolean(),
      });

      const result = schema.parse({ a: 1, b: "x", c: "y" });
      expect(result.ok).toBe(false);
      expect(result.errors!.length).toBe(3);
    });
  });
});
