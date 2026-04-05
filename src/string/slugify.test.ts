import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("공백을 하이픈으로 변환한다", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("소문자로 변환한다", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("lowercase: false이면 대소문자 유지", () => {
    expect(slugify("Hello World", { lowercase: false })).toBe("Hello-World");
  });

  it("악센트 문자를 기본 라틴으로 변환한다", () => {
    expect(slugify("café au lait")).toBe("cafe-au-lait");
    expect(slugify("résumé")).toBe("resume");
    expect(slugify("naïve")).toBe("naive");
    expect(slugify("über")).toBe("uber");
  });

  it("특수 문자를 제거한다", () => {
    expect(slugify("hello! @world#")).toBe("hello-world");
    expect(slugify("price: $100.00")).toBe("price-100-00");
  });

  it("마침표와 쉼표는 제거된다", () => {
    expect(slugify("hello, world.")).toBe("hello-world");
  });

  it("연속 공백·하이픈을 하나로 통합한다", () => {
    expect(slugify("hello   world")).toBe("hello-world");
    expect(slugify("hello---world")).toBe("hello-world");
    expect(slugify("hello _ world")).toBe("hello-world");
  });

  it("앞뒤 separator를 trim한다", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  it("separator를 커스터마이즈할 수 있다", () => {
    expect(slugify("hello world", { separator: "_" })).toBe("hello_world");
    expect(slugify("foo bar baz", { separator: "." })).toBe("foo.bar.baz");
  });

  it("빈 문자열을 처리한다", () => {
    expect(slugify("")).toBe("");
  });

  it("숫자를 포함한 문자열을 처리한다", () => {
    expect(slugify("chapter 2 intro")).toBe("chapter-2-intro");
  });

  it("한글은 특수문자로 취급되어 제거 후 합산된다", () => {
    // 한글은 \w에 포함되지 않아 공백으로 대체되어 slug가 빈 문자열이 될 수 있음
    // 영문+한글 혼합
    expect(slugify("hello 안녕 world")).toBe("hello-world");
  });
});
