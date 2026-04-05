import { describe, expect, it } from "vitest";
import { isEmail } from "./isEmail";

describe("isEmail", () => {
  it("유효한 이메일을 true로 판별한다", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("user.name@example.com")).toBe(true);
    expect(isEmail("user+tag@example.co.kr")).toBe(true);
    expect(isEmail("user_name@sub.domain.com")).toBe(true);
    expect(isEmail("user-name@example.org")).toBe(true);
    expect(isEmail("123@example.com")).toBe(true);
  });

  it("유효하지 않은 이메일을 false로 판별한다", () => {
    expect(isEmail("user@")).toBe(false);           // 도메인 없음
    expect(isEmail("@example.com")).toBe(false);    // 로컬 파트 없음
    expect(isEmail("userexample.com")).toBe(false); // @ 없음
    expect(isEmail("user@example")).toBe(false);    // TLD 없음
    expect(isEmail("user @example.com")).toBe(false); // 공백 포함
    expect(isEmail("")).toBe(false);
    expect(isEmail("user@.com")).toBe(false);       // 도메인 이름 없음
  });

  it("TLD가 1자이면 false로 판별한다", () => {
    expect(isEmail("user@example.c")).toBe(false);
  });

  it("TLD가 2자 이상이면 true로 판별한다", () => {
    expect(isEmail("user@example.io")).toBe(true);
    expect(isEmail("user@example.museum")).toBe(true);
  });
});
