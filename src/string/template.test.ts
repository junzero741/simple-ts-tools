import { describe, expect, it } from "vitest";
import { template } from "./template";

describe("template", () => {
  it("단일 자리 표시자를 치환한다", () => {
    expect(template("안녕하세요, {{name}}님!", { name: "Alice" })).toBe(
      "안녕하세요, Alice님!"
    );
  });

  it("여러 자리 표시자를 치환한다", () => {
    expect(
      template("{{year}}년 {{month}}월 {{day}}일", { year: 2024, month: 6, day: 7 })
    ).toBe("2024년 6월 7일");
  });

  it("같은 변수가 여러 번 등장해도 모두 치환한다", () => {
    expect(template("{{name}}은 {{name}}입니다.", { name: "Alice" })).toBe(
      "Alice은 Alice입니다."
    );
  });

  it("숫자와 불리언 값도 문자열로 변환한다", () => {
    expect(template("{{count}}개, {{active}}", { count: 42, active: true })).toBe(
      "42개, true"
    );
  });

  it("정의되지 않은 변수는 빈 문자열로 치환한다", () => {
    expect(template("Hello, {{name}}{{suffix}}!", { name: "Alice" })).toBe(
      "Hello, Alice!"
    );
  });

  it("null/undefined 값은 빈 문자열로 치환한다", () => {
    expect(template("{{a}}{{b}}", { a: null, b: undefined })).toBe("");
  });

  it("자리 표시자가 없으면 원본을 반환한다", () => {
    expect(template("변수 없음", { name: "Alice" })).toBe("변수 없음");
  });

  it("빈 문자열을 처리한다", () => {
    expect(template("", { name: "Alice" })).toBe("");
  });

  it("데이터가 빈 객체이면 자리 표시자가 빈 문자열로 치환된다", () => {
    expect(template("Hello, {{name}}!", {})).toBe("Hello, !");
  });

  it("알림 메시지 패턴", () => {
    const msg = template(
      "{{sender}}님이 {{count}}개의 메시지를 보냈습니다.",
      { sender: "Bob", count: 3 }
    );
    expect(msg).toBe("Bob님이 3개의 메시지를 보냈습니다.");
  });
});
