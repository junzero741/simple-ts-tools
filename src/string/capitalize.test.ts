import { describe, expect, it } from "vitest";
import { capitalize } from "./capitalize";

describe("capitalize", () => {
  it("첫 글자를 대문자로, 나머지를 소문자로 변환한다", () => {
    expect(capitalize("hello world")).toBe("Hello world");
    expect(capitalize("HELLO WORLD")).toBe("Hello world");
  });

  it("이미 올바른 형태면 그대로 반환한다", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });

  it("빈 문자열은 그대로 반환한다", () => {
    expect(capitalize("")).toBe("");
  });

  it("한 글자도 처리한다", () => {
    expect(capitalize("a")).toBe("A");
    expect(capitalize("Z")).toBe("Z");
  });
});
