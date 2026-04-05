// 입력 정규화 파이프라인 (Input Sanitization Pipeline).
//
// === 예상 사용처 ===
// - 회원가입/로그인 폼 입력 정규화 (이메일 소문자, 공백 제거)
// - 검색어 전처리 (trim, 연속 공백 제거, 소문자)
// - 사용자 입력 댓글/게시글 정리 (XSS 태그 제거, 길이 제한)
// - 전화번호/우편번호 입력 정규화 (숫자만 추출)
// - CSV/엑셀 import 시 셀 값 정리
// - API 요청 body 전처리 미들웨어
//
// const cleanEmail = createSanitizer<string>()
//   .trim()
//   .lowercase()
//   .replace(/\s+/g, "")
//   .ensure(s => s.includes("@"), "Invalid email");
//
// cleanEmail.run("  Alice@Example.COM  ") → "alice@example.com"
// cleanEmail.run("no-at") → throws "Invalid email"

export interface Sanitizer<T> {
  /** 정규화를 실행한다. */
  run(input: T): T;

  /** 정규화를 실행하되, 실패 시 기본값을 반환한다. */
  runOr(input: T, fallback: T): T;

  /** 정규화를 실행하고 Result를 반환한다. */
  runSafe(input: T): { ok: true; value: T } | { ok: false; error: string };
}

export interface StringSanitizer extends Sanitizer<string> {
  trim(): StringSanitizer;
  lowercase(): StringSanitizer;
  uppercase(): StringSanitizer;
  replace(pattern: RegExp | string, replacement: string): StringSanitizer;
  removeWhitespace(): StringSanitizer;
  collapseSpaces(): StringSanitizer;
  truncate(maxLength: number): StringSanitizer;
  stripHtml(): StringSanitizer;
  digitsOnly(): StringSanitizer;
  alphanumericOnly(): StringSanitizer;
  default(value: string): StringSanitizer;
  ensure(predicate: (value: string) => boolean, message: string): StringSanitizer;
  transform(fn: (value: string) => string): StringSanitizer;
}

export interface NumberSanitizer extends Sanitizer<number> {
  clamp(min: number, max: number): NumberSanitizer;
  round(decimals?: number): NumberSanitizer;
  floor(): NumberSanitizer;
  ceil(): NumberSanitizer;
  abs(): NumberSanitizer;
  default(value: number): NumberSanitizer;
  ensure(predicate: (value: number) => boolean, message: string): NumberSanitizer;
  transform(fn: (value: number) => number): NumberSanitizer;
}

type Step<T> = (value: T) => T;

function buildSanitizer<T>(steps: Step<T>[]): Sanitizer<T> {
  return {
    run(input: T): T {
      let value = input;
      for (const step of steps) value = step(value);
      return value;
    },

    runOr(input: T, fallback: T): T {
      try {
        return this.run(input);
      } catch {
        return fallback;
      }
    },

    runSafe(input: T) {
      try {
        return { ok: true, value: this.run(input) };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    },
  };
}

export function stringSanitizer(): StringSanitizer {
  return buildStringSanitizer([]);
}

function buildStringSanitizer(steps: Step<string>[]): StringSanitizer {
  function add(step: Step<string>): StringSanitizer {
    return buildStringSanitizer([...steps, step]);
  }

  const base = buildSanitizer(steps);

  return {
    ...base,
    trim: () => add((s) => s.trim()),
    lowercase: () => add((s) => s.toLowerCase()),
    uppercase: () => add((s) => s.toUpperCase()),
    replace: (p, r) => add((s) => s.replace(p, r)),
    removeWhitespace: () => add((s) => s.replace(/\s/g, "")),
    collapseSpaces: () => add((s) => s.replace(/\s+/g, " ").trim()),
    truncate: (max) => add((s) => (s.length > max ? s.slice(0, max) : s)),
    stripHtml: () => add((s) => s.replace(/<[^>]*>/g, "")),
    digitsOnly: () => add((s) => s.replace(/\D/g, "")),
    alphanumericOnly: () => add((s) => s.replace(/[^a-zA-Z0-9]/g, "")),
    default: (d) => add((s) => (s === "" ? d : s)),
    ensure: (pred, msg) => add((s) => { if (!pred(s)) throw new Error(msg); return s; }),
    transform: (fn) => add(fn),
  };
}

export function numberSanitizer(): NumberSanitizer {
  return buildNumberSanitizer([]);
}

function buildNumberSanitizer(steps: Step<number>[]): NumberSanitizer {
  function add(step: Step<number>): NumberSanitizer {
    return buildNumberSanitizer([...steps, step]);
  }

  const base = buildSanitizer(steps);

  return {
    ...base,
    clamp: (min, max) => add((n) => Math.min(Math.max(n, min), max)),
    round: (d = 0) => add((n) => { const f = 10 ** d; return Math.round(n * f) / f; }),
    floor: () => add(Math.floor),
    ceil: () => add(Math.ceil),
    abs: () => add(Math.abs),
    default: (d) => add((n) => (isNaN(n) ? d : n)),
    ensure: (pred, msg) => add((n) => { if (!pred(n)) throw new Error(msg); return n; }),
    transform: (fn) => add(fn),
  };
}
