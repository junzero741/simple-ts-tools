import { describe, expect, it } from "vitest";
import { isEmpty } from "./isEmpty";

describe("isEmpty", () => {
  it("빈 문자열은 true", () => expect(isEmpty("")).toBe(true));
  it("공백만 있으면 true", () => {
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty("\t\n")).toBe(true);
  });
  it("null / undefined는 true", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });
  it("내용이 있으면 false", () => {
    expect(isEmpty("hello")).toBe(false);
    expect(isEmpty(" a ")).toBe(false);
  });
});
