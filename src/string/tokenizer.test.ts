import { describe, it, expect } from "vitest";
import { createTokenizer } from "./tokenizer";

function createMathLexer() {
  return createTokenizer([
    { type: "NUMBER", pattern: /\d+(\.\d+)?/, transform: (v) => Number(v) },
    { type: "OP", pattern: /[+\-*/]/ },
    { type: "PAREN", pattern: /[()]/ },
    { type: "WS", pattern: /\s+/, skip: true },
  ]);
}

describe("createTokenizer", () => {
  describe("기본 토큰화", () => {
    it("수식을 토큰화한다", () => {
      const lexer = createMathLexer();
      const tokens = lexer.tokenize("3 + 42");

      expect(tokens).toEqual([
        { type: "NUMBER", value: "3", pos: 0, transformed: 3 },
        { type: "OP", value: "+", pos: 2 },
        { type: "NUMBER", value: "42", pos: 4, transformed: 42 },
      ]);
    });

    it("괄호 포함 수식", () => {
      const tokens = createMathLexer().tokenize("(1 + 2) * 3");

      expect(tokens.map((t) => t.type)).toEqual([
        "PAREN", "NUMBER", "OP", "NUMBER", "PAREN", "OP", "NUMBER",
      ]);
    });

    it("소수점 숫자", () => {
      const tokens = createMathLexer().tokenize("3.14");
      expect(tokens[0].value).toBe("3.14");
      expect(tokens[0].transformed).toBe(3.14);
    });
  });

  describe("skip", () => {
    it("skip 토큰은 결과에 포함하지 않는다", () => {
      const tokens = createMathLexer().tokenize("  1  +  2  ");
      expect(tokens.every((t) => t.type !== "WS")).toBe(true);
      expect(tokens.length).toBe(3);
    });
  });

  describe("transform", () => {
    it("토큰 값을 변환한다", () => {
      const lexer = createTokenizer([
        { type: "BOOL", pattern: /true|false/, transform: (v) => v === "true" },
        { type: "WS", pattern: /\s+/, skip: true },
      ]);

      const tokens = lexer.tokenize("true false");
      expect(tokens[0].transformed).toBe(true);
      expect(tokens[1].transformed).toBe(false);
    });
  });

  describe("pos (위치)", () => {
    it("각 토큰의 시작 위치를 기록한다", () => {
      const tokens = createMathLexer().tokenize("1+2");
      expect(tokens[0].pos).toBe(0);
      expect(tokens[1].pos).toBe(1);
      expect(tokens[2].pos).toBe(2);
    });
  });

  describe("에러", () => {
    it("인식 불가 문자에 에러를 던진다", () => {
      const lexer = createTokenizer([
        { type: "NUM", pattern: /\d+/ },
      ]);

      expect(() => lexer.tokenize("123abc")).toThrow("Unexpected character 'a' at position 3");
    });
  });

  describe("stream (지연 평가)", () => {
    it("이터레이터로 토큰을 생성한다", () => {
      const tokens = [...createMathLexer().stream("1 + 2")];
      expect(tokens.length).toBe(3);
      expect(tokens[0]).toEqual({ type: "NUMBER", value: "1", pos: 0, transformed: 1 });
    });

    it("for...of로 순회 가능", () => {
      const types: string[] = [];
      for (const token of createMathLexer().stream("3 * 4")) {
        types.push(token.type);
      }
      expect(types).toEqual(["NUMBER", "OP", "NUMBER"]);
    });
  });

  describe("실전: 검색 쿼리 파서", () => {
    it("key:value 검색어를 토큰화한다", () => {
      const lexer = createTokenizer([
        { type: "FILTER", pattern: /[a-zA-Z]+:[^\s]+/ },
        { type: "NEGATE", pattern: /-[a-zA-Z]+/ },
        { type: "WORD", pattern: /[^\s]+/ },
        { type: "WS", pattern: /\s+/, skip: true },
      ]);

      const tokens = lexer.tokenize('name:alice age:30 -inactive hello');
      expect(tokens).toEqual([
        { type: "FILTER", value: "name:alice", pos: 0 },
        { type: "FILTER", value: "age:30", pos: 11 },
        { type: "NEGATE", value: "-inactive", pos: 18 },
        { type: "WORD", value: "hello", pos: 28 },
      ]);
    });
  });

  describe("실전: JSON-like 토크나이저", () => {
    it("간단한 JSON 구조를 토큰화한다", () => {
      const lexer = createTokenizer([
        { type: "LBRACE", pattern: /\{/ },
        { type: "RBRACE", pattern: /\}/ },
        { type: "COLON", pattern: /:/ },
        { type: "COMMA", pattern: /,/ },
        { type: "STRING", pattern: /"[^"]*"/, transform: (v) => v.slice(1, -1) },
        { type: "NUMBER", pattern: /\d+/, transform: Number },
        { type: "WS", pattern: /\s+/, skip: true },
      ]);

      const tokens = lexer.tokenize('{"name": "Alice", "age": 30}');
      expect(tokens.map((t) => t.type)).toEqual([
        "LBRACE", "STRING", "COLON", "STRING", "COMMA",
        "STRING", "COLON", "NUMBER", "RBRACE",
      ]);
      expect(tokens.find((t) => t.type === "NUMBER")!.transformed).toBe(30);
    });
  });

  describe("빈 입력", () => {
    it("빈 문자열은 빈 배열", () => {
      expect(createMathLexer().tokenize("")).toEqual([]);
    });
  });
});
