import { describe, expect, it } from "vitest";
import { pick } from "./pick";

describe("pick", () => {
  it("지정한 키만 추출한다", () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("빈 키 배열이면 빈 객체를 반환한다", () => {
    expect(pick({ a: 1, b: 2 }, [])).toEqual({});
  });

  it("존재하지 않는 키는 무시된다", () => {
    const obj = { a: 1 } as { a: number; b?: number };
    expect(pick(obj, ["a", "b"])).toEqual({ a: 1 });
  });

  it("중첩 값도 참조 그대로 복사한다", () => {
    const inner = { x: 10 };
    const result = pick({ a: inner, b: 2 }, ["a"]);
    expect(result.a).toBe(inner);
  });

  it("타입이 올바르게 추론된다", () => {
    const result = pick({ id: 1, name: "Alice", password: "secret" }, ["id", "name"]);
    // TypeScript: result는 { id: number; name: string } 타입
    expect(result).toEqual({ id: 1, name: "Alice" });
  });
});
