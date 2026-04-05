/**
 * 시간 구간 파싱/연산 (Duration).
 *
 * 사람이 읽기 쉬운 문자열(`"2h30m"`, `"1d12h"`)과 밀리초 간 변환,
 * 덧셈/뺄셈, 비교, 포맷팅을 지원한다.
 *
 * @example
 * // 문자열 → 밀리초
 * duration("2h30m").ms;           // 9_000_000
 * duration("1d").ms;              // 86_400_000
 * duration("500ms").ms;           // 500
 *
 * @example
 * // 밀리초 → 사람 읽기 포맷
 * duration(3_661_000).format();   // "1h1m1s"
 * duration(90_000).format();      // "1m30s"
 *
 * @example
 * // 연산
 * duration("1h").add("30m").format();       // "1h30m"
 * duration("2h").subtract("45m").format();  // "1h15m"
 * duration("1h").gt(duration("30m"));       // true
 *
 * @example
 * // 단위 변환
 * duration("1d12h").toSeconds();  // 129600
 * duration("2h").toMinutes();     // 120
 *
 * @complexity Time: O(1). Space: O(1).
 */

const UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

const PARSE_RE = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)/g;

export interface Duration {
  /** 밀리초 값 */
  readonly ms: number;

  /** 다른 Duration을 더한다. */
  add(other: string | number | Duration): Duration;

  /** 다른 Duration을 뺀다. */
  subtract(other: string | number | Duration): Duration;

  /** 배수를 곱한다. */
  multiply(factor: number): Duration;

  /** 사람 읽기 포맷으로 변환한다. (예: "1h30m") */
  format(): string;

  /** 초 단위로 변환한다. */
  toSeconds(): number;

  /** 분 단위로 변환한다. */
  toMinutes(): number;

  /** 시간 단위로 변환한다. */
  toHours(): number;

  /** 일 단위로 변환한다. */
  toDays(): number;

  /** 크기 비교 */
  gt(other: Duration): boolean;
  gte(other: Duration): boolean;
  lt(other: Duration): boolean;
  lte(other: Duration): boolean;
  eq(other: Duration): boolean;
}

function parseToMs(input: string | number | Duration): number {
  if (typeof input === "number") return input;
  if (typeof input === "object" && "ms" in input) return input.ms;

  const str = input as string;

  // 순수 숫자 문자열이면 밀리초로 해석
  const num = Number(str);
  if (!isNaN(num)) return num;

  let total = 0;
  let matched = false;
  let match: RegExpExecArray | null;

  PARSE_RE.lastIndex = 0;
  while ((match = PARSE_RE.exec(str)) !== null) {
    matched = true;
    const value = parseFloat(match[1]);
    const unit = match[2];
    total += value * UNITS[unit];
  }

  if (!matched) throw new Error(`Invalid duration string: "${str}"`);

  return total;
}

function createDuration(ms: number): Duration {
  const d: Duration = {
    get ms() { return ms; },

    add(other) { return createDuration(ms + parseToMs(other)); },
    subtract(other) { return createDuration(ms - parseToMs(other)); },
    multiply(factor) { return createDuration(ms * factor); },

    format(): string {
      if (ms === 0) return "0ms";

      let remaining = Math.abs(ms);
      const parts: string[] = [];
      const prefix = ms < 0 ? "-" : "";

      const units: [string, number][] = [
        ["d", UNITS.d],
        ["h", UNITS.h],
        ["m", UNITS.m],
        ["s", UNITS.s],
        ["ms", UNITS.ms],
      ];

      for (const [label, size] of units) {
        if (remaining >= size) {
          const count = Math.floor(remaining / size);
          remaining %= size;
          parts.push(`${count}${label}`);
        }
      }

      return prefix + parts.join("");
    },

    toSeconds() { return ms / 1_000; },
    toMinutes() { return ms / 60_000; },
    toHours() { return ms / 3_600_000; },
    toDays() { return ms / 86_400_000; },

    gt(other) { return ms > other.ms; },
    gte(other) { return ms >= other.ms; },
    lt(other) { return ms < other.ms; },
    lte(other) { return ms <= other.ms; },
    eq(other) { return ms === other.ms; },
  };

  return d;
}

/**
 * Duration을 생성한다.
 * @param input 밀리초 숫자, 또는 사람 읽기 문자열 (예: `"2h30m"`, `"1d"`, `"500ms"`)
 */
export function duration(input: string | number): Duration {
  return createDuration(parseToMs(input));
}
