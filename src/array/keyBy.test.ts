import { describe, expect, it } from "vitest";
import { keyBy } from "./keyBy";

describe("keyBy", () => {
  it("숫자 id로 Record를 만든다", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    expect(keyBy(users, (u) => u.id)).toEqual({
      1: { id: 1, name: "Alice" },
      2: { id: 2, name: "Bob" },
    });
  });

  it("문자열 키로 Record를 만든다", () => {
    const items = [
      { code: "A", value: 10 },
      { code: "B", value: 20 },
    ];
    expect(keyBy(items, (i) => i.code)).toEqual({
      A: { code: "A", value: 10 },
      B: { code: "B", value: 20 },
    });
  });

  it("키 충돌 시 마지막 항목이 남는다", () => {
    const arr = [
      { role: "admin", name: "Alice" },
      { role: "admin", name: "Bob" },
    ];
    expect(keyBy(arr, (x) => x.role)).toEqual({
      admin: { role: "admin", name: "Bob" },
    });
  });

  it("빈 배열이면 빈 객체를 반환한다", () => {
    expect(keyBy([], (x: { id: number }) => x.id)).toEqual({});
  });

  it("파생 키(계산값)도 사용 가능하다", () => {
    const words = ["apple", "banana", "avocado"];
    const result = keyBy(words, (w) => w[0]);
    expect(result).toEqual({ a: "avocado", b: "banana" });
  });
});
