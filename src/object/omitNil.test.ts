import { describe, expect, it } from "vitest";
import { omitFalsy, omitNil } from "./omitNil";

describe("omitNil", () => {
  it("null과 undefined 키를 제거한다", () => {
    const result = omitNil({ a: 1, b: null, c: undefined, d: 0, e: "" });
    expect(result).toEqual({ a: 1, d: 0, e: "" });
  });

  it("null만 있는 경우", () => {
    expect(omitNil({ a: null, b: null })).toEqual({});
  });

  it("undefined만 있는 경우", () => {
    expect(omitNil({ a: undefined })).toEqual({});
  });

  it("null·undefined가 없으면 원본과 동일한 값을 반환한다", () => {
    const result = omitNil({ a: 1, b: "hello", c: true });
    expect(result).toEqual({ a: 1, b: "hello", c: true });
  });

  it("0, false, 빈 문자열은 유지한다 (falsy이지만 의미 있는 값)", () => {
    const result = omitNil({ zero: 0, falseVal: false, empty: "", valid: 1 });
    expect(result).toEqual({ zero: 0, falseVal: false, empty: "", valid: 1 });
  });

  it("빈 객체는 빈 객체를 반환한다", () => {
    expect(omitNil({})).toEqual({});
  });

  it("원본 객체를 변경하지 않는다", () => {
    const obj = { a: 1, b: null };
    omitNil(obj);
    expect(obj).toEqual({ a: 1, b: null });
  });

  it("실사용: API 파라미터 정리", () => {
    const params = omitNil({
      page: 1,
      pageSize: 20,
      search: null,       // 검색어 없음
      category: undefined, // 카테고리 미선택
      sort: "createdAt",
    });
    expect(params).toEqual({ page: 1, pageSize: 20, sort: "createdAt" });
    // search, category는 쿼리스트링에 포함되지 않음
  });

  it("실사용: 쿼리 파라미터 — null/undefined 필드 모두 제거", () => {
    const payload = omitNil({
      name: "Alice",
      email: undefined,  // 수정하지 않음 → 제거
      age: null,         // 값 없음 → 제거 (null을 유지하려면 omitBy 사용)
    });
    // omitNil은 null과 undefined 모두 제거
    // null을 유지하고 undefined만 제거하려면: omitBy(obj, v => v === undefined)
    expect(payload).toEqual({ name: "Alice" });
  });
});

describe("omitFalsy", () => {
  it("모든 falsy 값(null, undefined, false, 0, '')을 제거한다", () => {
    const result = omitFalsy({
      a: 1,
      b: null,
      c: undefined,
      d: 0,
      e: "",
      f: false,
      g: "hello",
    });
    expect(result).toEqual({ a: 1, g: "hello" });
  });

  it("모든 값이 truthy이면 원본과 동일한 값을 반환한다", () => {
    const result = omitFalsy({ a: 1, b: "hello", c: true });
    expect(result).toEqual({ a: 1, b: "hello", c: true });
  });

  it("모든 값이 falsy이면 빈 객체를 반환한다", () => {
    expect(omitFalsy({ a: null, b: 0, c: "" })).toEqual({});
  });

  it("omitNil과의 차이: 0과 false를 제거한다", () => {
    const obj = { count: 0, enabled: false, name: "test" };
    expect(omitNil(obj)).toEqual({ count: 0, enabled: false, name: "test" }); // 0, false 유지
    expect(omitFalsy(obj)).toEqual({ name: "test" });                          // 0, false 제거
  });

  it("실사용: 동적 CSS 클래스 객체 정리", () => {
    const isActive = false;
    const isDisabled = true;
    const classes = omitFalsy({
      "btn-active": isActive,
      "btn-disabled": isDisabled,
      "btn-primary": true,
    });
    expect(classes).toEqual({ "btn-disabled": true, "btn-primary": true });
  });
});
