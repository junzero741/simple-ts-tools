import { describe, expect, it } from "vitest";
import { mapKeys } from "./mapKeys";

describe("mapKeys", () => {
  it("모든 키에 변환 함수를 적용한다", () => {
    const result = mapKeys({ foo_bar: 1, baz_qux: 2 }, k =>
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    );
    expect(result).toEqual({ fooBar: 1, bazQux: 2 });
  });

  it("값은 그대로 유지된다", () => {
    const obj = { a: [1, 2], b: { x: 3 } };
    const result = mapKeys(obj, k => k.toUpperCase());
    expect(result.A).toBe(obj.a);
    expect(result.B).toBe(obj.b);
  });

  it("키 변환 함수로 대문자 변환을 할 수 있다", () => {
    expect(mapKeys({ a: 1, b: 2 }, k => k.toUpperCase())).toEqual({ A: 1, B: 2 });
  });

  it("빈 객체는 빈 객체를 반환한다", () => {
    expect(mapKeys({}, k => k)).toEqual({});
  });

  it("원본 객체를 변경하지 않는다", () => {
    const original = { a: 1 };
    mapKeys(original, k => k.toUpperCase());
    expect(original).toEqual({ a: 1 });
  });
});
