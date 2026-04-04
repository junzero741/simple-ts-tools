import { describe, expect, it } from "vitest";
import { omitBy } from "./omitBy";

describe("omitBy", () => {
  it("조건을 통과한 값을 제외한 나머지를 반환한다", () => {
    expect(omitBy({ a: 1, b: 0, c: 2 }, (v) => (v as number) === 0)).toEqual({
      a: 1,
      c: 2,
    });
  });

  it("null / undefined 값을 제거한다", () => {
    const obj = { a: 1, b: null, c: undefined, d: 2 };
    expect(omitBy(obj, (v) => v == null)).toEqual({ a: 1, d: 2 });
  });

  it("키를 기준으로 private 필드를 제거한다", () => {
    const config = { _secret: "x", host: "localhost", _internal: true, port: 3000 };
    expect(
      omitBy(config, (_, k) => String(k).startsWith("_"))
    ).toEqual({ host: "localhost", port: 3000 });
  });

  it("모두 제외하면 빈 객체를 반환한다", () => {
    expect(omitBy({ a: 1, b: 2 }, () => true)).toEqual({});
  });

  it("모두 통과하면 원본과 동일한 객체를 반환한다", () => {
    expect(omitBy({ a: 1, b: 2 }, () => false)).toEqual({ a: 1, b: 2 });
  });

  it("빈 객체를 처리한다", () => {
    expect(omitBy({}, () => true)).toEqual({});
  });
});
