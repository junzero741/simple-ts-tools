import { describe, expect, it } from "vitest";
import { mapValues } from "./mapValues";

describe("mapValues", () => {
  it("모든 값에 변환 함수를 적용한다", () => {
    expect(mapValues({ a: 1, b: 2, c: 3 }, x => x * 2)).toEqual({ a: 2, b: 4, c: 6 });
  });

  it("문자열을 숫자로 변환할 수 있다", () => {
    expect(mapValues({ x: "1", y: "2" }, Number)).toEqual({ x: 1, y: 2 });
  });

  it("키를 두 번째 인자로 받을 수 있다", () => {
    const result = mapValues({ a: 1, b: 2 }, (v, k) => `${k}:${v}`);
    expect(result).toEqual({ a: "a:1", b: "b:2" });
  });

  it("빈 객체는 빈 객체를 반환한다", () => {
    expect(mapValues({}, x => x)).toEqual({});
  });

  it("원본 객체를 변경하지 않는다", () => {
    const original = { a: 1, b: 2 };
    mapValues(original, x => x * 10);
    expect(original).toEqual({ a: 1, b: 2 });
  });

  it("중첩 객체 값도 변환할 수 있다", () => {
    const users = { alice: { age: 25 }, bob: { age: 30 } };
    const result = mapValues(users, u => u.age);
    expect(result).toEqual({ alice: 25, bob: 30 });
  });
});
