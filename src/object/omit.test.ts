import { describe, expect, it } from "vitest";
import { omit } from "./omit";

describe("omit", () => {
  it("지정한 키를 제외한 객체를 반환한다", () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ["b"])).toEqual({ a: 1, c: 3 });
  });

  it("빈 키 배열이면 원본과 동일한 객체를 반환한다", () => {
    expect(omit({ a: 1, b: 2 }, [])).toEqual({ a: 1, b: 2 });
  });

  it("여러 키를 동시에 제외한다", () => {
    expect(omit({ id: 1, name: "Alice", password: "secret", token: "xyz" }, ["password", "token"]))
      .toEqual({ id: 1, name: "Alice" });
  });

  it("원본 객체를 변경하지 않는다", () => {
    const original = { a: 1, b: 2 };
    omit(original, ["a"]);
    expect(original).toEqual({ a: 1, b: 2 });
  });

  it("중첩 값도 참조 그대로 복사한다", () => {
    const inner = { x: 10 };
    const result = omit({ a: inner, b: 2 }, ["b"]);
    expect(result.a).toBe(inner);
  });
});
