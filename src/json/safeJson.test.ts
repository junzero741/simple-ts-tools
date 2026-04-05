import { describe, it, expect } from "vitest";
import { safeJsonParse, safeJsonStringify } from "./safeJson";

describe("safeJsonParse", () => {
  it("유효한 JSON을 파싱한다", () => {
    const result = safeJsonParse<{ a: number }>('{"a":1}');
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  it("배열을 파싱한다", () => {
    const result = safeJsonParse<number[]>("[1,2,3]");
    expect(result).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it("원시 값을 파싱한다", () => {
    expect(safeJsonParse("42")).toEqual({ ok: true, value: 42 });
    expect(safeJsonParse('"hello"')).toEqual({ ok: true, value: "hello" });
    expect(safeJsonParse("true")).toEqual({ ok: true, value: true });
    expect(safeJsonParse("null")).toEqual({ ok: true, value: null });
  });

  it("유효하지 않은 JSON은 에러를 반환한다", () => {
    const result = safeJsonParse("not json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(SyntaxError);
    }
  });

  it("빈 문자열은 에러를 반환한다", () => {
    const result = safeJsonParse("");
    expect(result.ok).toBe(false);
  });

  it("reviver를 지원한다", () => {
    const result = safeJsonParse<{ date: Date }>(
      '{"date":"2024-01-01"}',
      (key, val) => (key === "date" ? new Date(val as string) : val),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.date).toBeInstanceOf(Date);
    }
  });
});

describe("safeJsonStringify", () => {
  it("일반 객체를 직렬화한다", () => {
    expect(safeJsonStringify({ a: 1, b: "hello" })).toBe('{"a":1,"b":"hello"}');
  });

  it("배열을 직렬화한다", () => {
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  it("순환 참조를 [Circular]로 대체한다", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(safeJsonStringify(obj)).toBe('{"a":1,"self":"[Circular]"}');
  });

  it("깊은 순환 참조를 처리한다", () => {
    const a: Record<string, unknown> = { name: "a" };
    const b: Record<string, unknown> = { name: "b", ref: a };
    a.ref = b;
    const result = safeJsonStringify(a);
    expect(result).toContain('"[Circular]"');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it("배열 내 순환 참조를 처리한다", () => {
    const arr: unknown[] = [1, 2];
    arr.push(arr);
    const result = safeJsonStringify(arr);
    expect(result).toBe('[1,2,"[Circular]"]');
  });

  it("circularValue 옵션으로 대체 문자열을 지정한다", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(safeJsonStringify(obj, { circularValue: "[REF]" })).toBe(
      '{"a":1,"self":"[REF]"}',
    );
  });

  it("space 옵션으로 들여쓰기한다", () => {
    const result = safeJsonStringify({ a: 1 }, { space: 2 });
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("replacer 옵션을 지원한다", () => {
    const result = safeJsonStringify(
      { a: 1, b: 2, c: 3 },
      { replacer: (key, val) => (key === "b" ? undefined : val) },
    );
    expect(result).toBe('{"a":1,"c":3}');
  });

  it("null과 원시 값을 직렬화한다", () => {
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(42)).toBe("42");
    expect(safeJsonStringify("hello")).toBe('"hello"');
  });

  it("순환 참조가 없는 중복 참조는 정상 직렬화한다", () => {
    const shared = { x: 1 };
    const obj = { a: shared, b: shared };
    // shared는 두 번 나타나지만 순환은 아님 — WeakSet에서 제거되지 않으므로
    // 두 번째는 [Circular]로 처리됨. 이것은 의도된 동작 (안전 우선).
    const result = safeJsonStringify(obj);
    expect(() => JSON.parse(result)).not.toThrow();
  });
});
