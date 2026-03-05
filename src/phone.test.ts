import { describe, it, expect } from "vitest";
import { formatPhoneNumber } from "./phone";

describe("formatPhoneNumber", () => {
  it("11자리 휴대폰 번호", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("10자리 번호", () => {
    expect(formatPhoneNumber("0311234567")).toBe("031-123-4567");
  });

  it("이미 하이픈이 있는 경우", () => {
    expect(formatPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
  });

  it("길이가 맞지 않으면 원본 반환", () => {
    expect(formatPhoneNumber("1234")).toBe("1234");
  });
});
