import { describe, it, expect } from "vitest";
import { render } from "./template.engine";

describe("render (template engine)", () => {
  describe("보간", () => {
    it("변수를 치환한다", () => {
      expect(render("Hello, {{name}}!", { name: "Alice" })).toBe("Hello, Alice!");
    });

    it("중첩 경로를 지원한다", () => {
      expect(render("{{user.name}}", { user: { name: "Bob" } })).toBe("Bob");
    });

    it("undefined는 빈 문자열", () => {
      expect(render("{{missing}}", {})).toBe("");
    });

    it("숫자/불리언도 문자열로 변환", () => {
      expect(render("{{n}}", { n: 42 })).toBe("42");
      expect(render("{{b}}", { b: true })).toBe("true");
    });
  });

  describe("파이프 (필터)", () => {
    it("upper", () => {
      expect(render("{{name | upper}}", { name: "alice" })).toBe("ALICE");
    });

    it("lower", () => {
      expect(render("{{name | lower}}", { name: "HELLO" })).toBe("hello");
    });

    it("trim", () => {
      expect(render("{{s | trim}}", { s: "  hi  " })).toBe("hi");
    });

    it("capitalize", () => {
      expect(render("{{s | capitalize}}", { s: "hello world" })).toBe("Hello world");
    });

    it("currency", () => {
      expect(render("{{price | currency}}", { price: 1234.5 })).toBe("$1,234.50");
    });

    it("json", () => {
      expect(render("{{data | json}}", { data: { a: 1 } })).toBe('{"a":1}');
    });

    it("default", () => {
      expect(render("{{name | default:'anon'}}", {})).toBe("anon");
      expect(render("{{name | default:'anon'}}", { name: "Bob" })).toBe("Bob");
    });

    it("체이닝 — 여러 필터", () => {
      expect(render("{{s | trim | upper}}", { s: "  hi  " })).toBe("HI");
    });

    it("커스텀 필터", () => {
      const result = render("{{n | double}}", { n: 5 }, {
        filters: { double: (v) => Number(v) * 2 },
      });
      expect(result).toBe("10");
    });
  });

  describe("{{#if}}", () => {
    it("참이면 내용을 렌더링한다", () => {
      expect(render("{{#if show}}visible{{/if}}", { show: true })).toBe("visible");
    });

    it("거짓이면 생략한다", () => {
      expect(render("{{#if show}}visible{{/if}}", { show: false })).toBe("");
    });

    it("falsy 값들", () => {
      expect(render("{{#if val}}yes{{/if}}", { val: 0 })).toBe("");
      expect(render("{{#if val}}yes{{/if}}", { val: "" })).toBe("");
      expect(render("{{#if val}}yes{{/if}}", { val: null })).toBe("");
      expect(render("{{#if val}}yes{{/if}}", {})).toBe("");
    });

    it("{{#else}} 분기", () => {
      expect(render("{{#if a}}A{{#else}}B{{/if}}", { a: true })).toBe("A");
      expect(render("{{#if a}}A{{#else}}B{{/if}}", { a: false })).toBe("B");
    });

    it("내부에 보간을 포함한다", () => {
      expect(
        render("{{#if admin}}Welcome, {{name}}!{{/if}}", { admin: true, name: "Root" }),
      ).toBe("Welcome, Root!");
    });
  });

  describe("{{#each}}", () => {
    it("배열을 반복한다 (원시값)", () => {
      expect(render("{{#each items}}{{.}}, {{/each}}", { items: ["a", "b", "c"] }))
        .toBe("a, b, c, ");
    });

    it("배열을 반복한다 (객체)", () => {
      expect(
        render("{{#each users}}{{name}}({{age}}) {{/each}}", {
          users: [
            { name: "A", age: 1 },
            { name: "B", age: 2 },
          ],
        }),
      ).toBe("A(1) B(2) ");
    });

    it("빈 배열이면 아무것도 렌더링하지 않는다", () => {
      expect(render("{{#each items}}{{.}}{{/each}}", { items: [] })).toBe("");
    });

    it("undefined 배열이면 아무것도 렌더링하지 않는다", () => {
      expect(render("{{#each items}}{{.}}{{/each}}", {})).toBe("");
    });

    it("@index에 접근한다", () => {
      expect(
        render("{{#each items}}{{@index}}:{{.}} {{/each}}", { items: ["a", "b"] }),
      ).toBe("0:a 1:b ");
    });
  });

  describe("중첩", () => {
    it("if 안에 each", () => {
      const tpl = "{{#if show}}{{#each items}}{{.}} {{/each}}{{/if}}";
      expect(render(tpl, { show: true, items: [1, 2, 3] })).toBe("1 2 3 ");
      expect(render(tpl, { show: false, items: [1, 2, 3] })).toBe("");
    });

    it("each 안에 if", () => {
      const tpl = "{{#each items}}{{#if active}}{{name}} {{/if}}{{/each}}";
      const data = {
        items: [
          { name: "a", active: true },
          { name: "b", active: false },
          { name: "c", active: true },
        ],
      };
      expect(render(tpl, data)).toBe("a c ");
    });
  });

  describe("텍스트만", () => {
    it("템플릿 태그 없으면 그대로 반환", () => {
      expect(render("plain text", {})).toBe("plain text");
    });

    it("빈 문자열", () => {
      expect(render("", {})).toBe("");
    });
  });
});
