// 토크나이저 (Tokenizer / Lexer).
//
// === 예상 사용처 ===
// - DSL(도메인 특화 언어) 파서 (필터 표현식, 쿼리 언어, 수식)
// - 템플릿 엔진 내부 토큰 분리 ({{변수}}, {% 제어문 %})
// - 검색 쿼리 파싱 ("name:alice age:>30 -inactive")
// - CLI 인자 파싱 (따옴표 처리, 이스케이프 처리)
// - 마크다운/위키 문법 토큰화
// - 코드 하이라이터 (키워드, 문자열, 숫자, 연산자 분류)
// - CSV/TSV 커스텀 파서 (구분자 변경, 따옴표 처리)
//
// const lexer = createTokenizer([
//   { type: "NUMBER",  pattern: /\d+(\.\d+)?/ },
//   { type: "OP",      pattern: /[+\-*/]/ },
//   { type: "PAREN",   pattern: /[()]/ },
//   { type: "WS",      pattern: /\s+/, skip: true },
// ]);
//
// lexer.tokenize("3 + (42 * 2)")
// → [{ type: "NUMBER", value: "3", pos: 0 },
//    { type: "OP", value: "+", pos: 2 },
//    { type: "PAREN", value: "(", pos: 4 }, ...]

export interface TokenRule {
  type: string;
  pattern: RegExp;
  /** true면 결과에서 제외 (공백 등). */
  skip?: boolean;
  /** 매치된 값을 변환한다. */
  transform?: (value: string) => unknown;
}

export interface Token {
  type: string;
  value: string;
  pos: number;
  transformed?: unknown;
}

export interface Tokenizer {
  /** 입력 문자열을 토큰으로 분리한다. */
  tokenize(input: string): Token[];

  /** 토큰 스트림을 반환한다 (지연 평가). */
  stream(input: string): Iterable<Token>;
}

export function createTokenizer(rules: TokenRule[]): Tokenizer {
  // 각 패턴을 sticky flag로 변환
  const compiled = rules.map((rule) => ({
    ...rule,
    regex: new RegExp(rule.pattern.source, "y"),
  }));

  function matchAt(input: string, pos: number): { rule: typeof compiled[0]; match: string } | null {
    for (const rule of compiled) {
      rule.regex.lastIndex = pos;
      const m = rule.regex.exec(input);
      if (m) return { rule, match: m[0] };
    }
    return null;
  }

  const tokenizer: Tokenizer = {
    tokenize(input: string): Token[] {
      const tokens: Token[] = [];
      let pos = 0;

      while (pos < input.length) {
        const result = matchAt(input, pos);

        if (!result) {
          throw new Error(
            `Unexpected character '${input[pos]}' at position ${pos}`,
          );
        }

        if (!result.rule.skip) {
          const token: Token = {
            type: result.rule.type,
            value: result.match,
            pos,
          };
          if (result.rule.transform) {
            token.transformed = result.rule.transform(result.match);
          }
          tokens.push(token);
        }

        pos += result.match.length;
      }

      return tokens;
    },

    *stream(input: string): Iterable<Token> {
      let pos = 0;

      while (pos < input.length) {
        const result = matchAt(input, pos);

        if (!result) {
          throw new Error(
            `Unexpected character '${input[pos]}' at position ${pos}`,
          );
        }

        if (!result.rule.skip) {
          const token: Token = {
            type: result.rule.type,
            value: result.match,
            pos,
          };
          if (result.rule.transform) {
            token.transformed = result.rule.transform(result.match);
          }
          yield token;
        }

        pos += result.match.length;
      }
    },
  };

  return tokenizer;
}
