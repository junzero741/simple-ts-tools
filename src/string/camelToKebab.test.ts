import { describe, expect, it } from "vitest";
import { camelToKebab } from "./camelToKebab";

describe("camelToKebab", () => {
  it("camelCase를 변환한다", () => {
    expect(camelToKebab("backgroundColor")).toBe("background-color");
    expect(camelToKebab("myVariableName")).toBe("my-variable-name");
  });

  it("PascalCase를 변환한다", () => {
    expect(camelToKebab("MyComponent")).toBe("my-component");
    expect(camelToKebab("UserProfileCard")).toBe("user-profile-card");
  });

  it("연속 대문자(약어)를 올바르게 처리한다", () => {
    expect(camelToKebab("XMLParser")).toBe("xml-parser");
    expect(camelToKebab("getHTTPSResponse")).toBe("get-https-response");
    expect(camelToKebab("parseHTML")).toBe("parse-html");
  });

  it("이미 소문자 단어는 그대로 반환한다", () => {
    expect(camelToKebab("hello")).toBe("hello");
  });

  it("숫자가 포함된 경우를 처리한다", () => {
    expect(camelToKebab("grid12Columns")).toBe("grid12-columns");
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(camelToKebab("")).toBe("");
  });
});
