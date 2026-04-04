import { describe, expect, it } from "vitest";
import { camelToKebab } from "./camelToKebab";
import { kebabToCamel } from "./kebabToCamel";

describe("kebabToCamel", () => {
  it("kebab-case를 camelCase로 변환한다", () => {
    expect(kebabToCamel("background-color")).toBe("backgroundColor");
    expect(kebabToCamel("my-component-name")).toBe("myComponentName");
  });

  it("하이픈이 없으면 그대로 반환한다", () => {
    expect(kebabToCamel("already")).toBe("already");
  });

  it("단일 세그먼트도 처리한다", () => {
    expect(kebabToCamel("hello-world")).toBe("helloWorld");
  });

  it("연속 세그먼트를 처리한다", () => {
    expect(kebabToCamel("a-b-c-d")).toBe("aBCD");
  });

  it("빈 문자열은 빈 문자열을 반환한다", () => {
    expect(kebabToCamel("")).toBe("");
  });

  it("camelToKebab의 역연산이 된다 (단순 케이스)", () => {
    // 단순 camelCase는 왕복 변환이 가능하다
    const original = "backgroundColor";
    expect(kebabToCamel(camelToKebab(original))).toBe(original);
  });
});
