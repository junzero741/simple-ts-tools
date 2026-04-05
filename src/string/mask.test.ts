import { describe, expect, it } from "vitest";
import { mask, maskCard, maskEmail, maskPhone } from "./mask";

describe("mask", () => {
  it("지정 범위를 마스킹한다", () => {
    expect(mask("1234567890", 0, 6)).toBe("******7890");
    expect(mask("1234567890", 4, 8)).toBe("1234****90");
    expect(mask("1234567890", 6, 10)).toBe("123456****");
  });

  it("기본값은 전체 마스킹", () => {
    expect(mask("hello")).toBe("*****");
  });

  it("커스텀 마스킹 문자를 사용할 수 있다", () => {
    expect(mask("1234567890", 0, 6, "#")).toBe("######7890");
    expect(mask("hello", 1, 4, "X")).toBe("hXXXo");
  });

  it("빈 문자열을 처리한다", () => {
    expect(mask("")).toBe("");
  });

  it("start === end이면 마스킹 없음", () => {
    expect(mask("hello", 2, 2)).toBe("hello");
  });

  it("범위가 문자열 길이를 초과해도 처리한다", () => {
    expect(mask("hello", 0, 100)).toBe("*****");
    expect(mask("hello", 3, 100)).toBe("hel**");
  });
});

describe("maskEmail", () => {
  it("local 파트 앞 2자 이후를 마스킹한다", () => {
    expect(maskEmail("alice@example.com")).toBe("al***@example.com");
    expect(maskEmail("hello@gmail.com")).toBe("he***@gmail.com");
  });

  it("local이 2자 이하이면 그대로 반환한다", () => {
    expect(maskEmail("ab@test.com")).toBe("ab@test.com");
    expect(maskEmail("a@test.com")).toBe("a@test.com");
  });

  it("도메인 파트는 보존한다", () => {
    expect(maskEmail("user@company.co.kr")).toBe("us**@company.co.kr");
  });

  it("@가 없으면 그대로 반환한다", () => {
    expect(maskEmail("notanemail")).toBe("notanemail");
  });
});

describe("maskCard", () => {
  it("마지막 4자리만 보이고 나머지를 마스킹한다", () => {
    expect(maskCard("1234567890123456")).toBe("****-****-****-3456");
  });

  it("하이픈이 포함된 카드 번호도 처리한다", () => {
    expect(maskCard("1234-5678-9012-3456")).toBe("****-****-****-3456");
    expect(maskCard("1234 5678 9012 3456")).toBe("****-****-****-3456");
  });

  it("16자리 미만도 마스킹한다", () => {
    expect(maskCard("12345678")).toBe("****-5678");
  });
});

describe("maskPhone", () => {
  it("11자리 휴대폰 번호를 마스킹한다", () => {
    expect(maskPhone("01012345678")).toBe("010-****-5678");
  });

  it("하이픈 포함 휴대폰 번호를 처리한다", () => {
    expect(maskPhone("010-1234-5678")).toBe("010-****-5678");
  });

  it("10자리 일반전화(02 지역번호)를 마스킹한다", () => {
    expect(maskPhone("0212345678")).toBe("02-****-5678");
  });

  it("10자리 일반전화(031 등 3자리 지역번호)를 마스킹한다", () => {
    expect(maskPhone("0311234567")).toBe("031-****-4567");
  });
});
