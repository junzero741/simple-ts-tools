import { describe, it, expect } from "vitest";
import { formatPhoneNumber } from "./formatPhoneNumber";

describe("formatPhoneNumber", () => {
  it("11자리 휴대폰 번호", () => {
    expect(formatPhoneNumber("01012345678")).toBe("010-1234-5678");
  });

  it("10자리 번호", () => {
    expect(formatPhoneNumber("0113456789")).toBe("011-345-6789");
  });

  it("이미 하이픈이 있는 경우", () => {
    expect(formatPhoneNumber("010-1234-5678")).toBe("010-1234-5678");
  });
});
