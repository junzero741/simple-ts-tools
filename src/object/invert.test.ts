import { describe, expect, it } from "vitest";
import { invert } from "./invert";

describe("invert", () => {
  it("숫자 값을 키로, 문자열 키를 값으로 뒤집는다", () => {
    expect(invert({ a: 1, b: 2, c: 3 })).toEqual({ "1": "a", "2": "b", "3": "c" });
  });

  it("문자열 값과 키도 뒤집는다", () => {
    expect(invert({ sun: "0", mon: "1", tue: "2" })).toEqual({
      "0": "sun",
      "1": "mon",
      "2": "tue",
    });
  });

  it("값이 중복되면 마지막 키가 남는다", () => {
    const result = invert({ a: 1, b: 1, c: 2 });
    expect(result["1"]).toBe("b"); // "a"가 "b"로 덮어써짐
    expect(result["2"]).toBe("c");
  });

  it("빈 객체를 처리한다", () => {
    expect(invert({} as Record<string, string>)).toEqual({});
  });

  it("두 번 뒤집으면 원본으로 돌아온다 (값 중복 없을 때)", () => {
    const original = { a: "x", b: "y", c: "z" };
    expect(invert(invert(original))).toEqual(original);
  });

  it("열거형 코드 → 이름 변환에 활용한다", () => {
    const StatusCode = { OK: 200, NOT_FOUND: 404, SERVER_ERROR: 500 } as const;
    const byCode = invert(StatusCode);
    expect(byCode[200]).toBe("OK");
    expect(byCode[404]).toBe("NOT_FOUND");
  });
});
