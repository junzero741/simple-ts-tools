/**
 * 패턴 매칭 (Pattern Matching).
 *
 * Rust의 `match` 표현식에서 영감을 받은 타입 안전 패턴 매칭.
 * switch/case나 if/else 체인 대신 선언적으로 분기를 표현한다.
 *
 * @example
 * // 값 매칭
 * const label = match(status)
 *   .with(200, () => "OK")
 *   .with(404, () => "Not Found")
 *   .with(500, () => "Server Error")
 *   .otherwise(() => "Unknown");
 * // "OK"
 *
 * @example
 * // 조건 매칭 (when)
 * const grade = match(score)
 *   .when(s => s >= 90, () => "A")
 *   .when(s => s >= 80, () => "B")
 *   .when(s => s >= 70, () => "C")
 *   .otherwise(() => "F");
 *
 * @example
 * // 혼합 사용
 * const msg = match(code)
 *   .with("ECONNREFUSED", () => "연결 거부")
 *   .with("ETIMEDOUT", () => "시간 초과")
 *   .when(c => c.startsWith("E"), () => "알 수 없는 에러")
 *   .otherwise(() => "성공");
 *
 * @complexity Time: O(n) 최악, n = 등록된 패턴 수. Space: O(n).
 */

interface MatchBuilder<TInput, TOutput> {
  /** 값이 정확히 일치하면 해당 핸들러를 실행한다. */
  with<R>(value: TInput, handler: (input: TInput) => R): MatchBuilder<TInput, TOutput | R>;

  /** 여러 값 중 하나와 일치하면 해당 핸들러를 실행한다. */
  withMany<R>(values: TInput[], handler: (input: TInput) => R): MatchBuilder<TInput, TOutput | R>;

  /** 조건이 참이면 해당 핸들러를 실행한다. */
  when<R>(predicate: (input: TInput) => boolean, handler: (input: TInput) => R): MatchBuilder<TInput, TOutput | R>;

  /** 어떤 패턴에도 매치되지 않았을 때의 기본 핸들러. 결과를 반환한다. */
  otherwise<R>(handler: (input: TInput) => R): TOutput | R;

  /** 매치 실행. 매치되지 않으면 undefined. */
  run(): TOutput | undefined;

  /** 매치 실행. 매치되지 않으면 에러. */
  exhaustive(): TOutput;
}

type Pattern<TInput, TOutput> =
  | { type: "value"; value: TInput; handler: (input: TInput) => TOutput }
  | { type: "values"; values: TInput[]; handler: (input: TInput) => TOutput }
  | { type: "when"; predicate: (input: TInput) => boolean; handler: (input: TInput) => TOutput };

export function match<TInput>(input: TInput): MatchBuilder<TInput, never> {
  const patterns: Pattern<TInput, unknown>[] = [];

  function findMatch(): unknown | undefined {
    for (const pattern of patterns) {
      switch (pattern.type) {
        case "value":
          if (input === pattern.value) return pattern.handler(input);
          break;
        case "values":
          if (pattern.values.includes(input)) return pattern.handler(input);
          break;
        case "when":
          if (pattern.predicate(input)) return pattern.handler(input);
          break;
      }
    }
    return undefined;
  }

  const builder: MatchBuilder<TInput, never> = {
    with(value, handler) {
      patterns.push({ type: "value", value, handler });
      return builder as MatchBuilder<TInput, any>;
    },

    withMany(values, handler) {
      patterns.push({ type: "values", values, handler });
      return builder as MatchBuilder<TInput, any>;
    },

    when(predicate, handler) {
      patterns.push({ type: "when", predicate, handler });
      return builder as MatchBuilder<TInput, any>;
    },

    otherwise(handler) {
      const result = findMatch();
      return result !== undefined ? result : handler(input);
    },

    run() {
      return findMatch() as any;
    },

    exhaustive() {
      const result = findMatch();
      if (result === undefined) {
        throw new Error(`No pattern matched for value: ${String(input)}`);
      }
      return result as any;
    },
  };

  return builder;
}
