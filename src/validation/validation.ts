/**
 * 컴포저블 스키마 검증 유틸리티.
 *
 * Rule<T>를 조합해 스키마를 정의하고, validate()로 실행한다.
 * 각 필드에서 첫 번째로 실패한 규칙의 메시지를 반환한다.
 *
 * @example
 * const result = validate(formData, {
 *   name: [required(), minLength(2), maxLength(30)],
 *   email: [required(), emailRule()],
 *   age: [required(), minValue(0), maxValue(150)],
 * });
 * if (!result.valid) console.log(result.errors.name); // "2자 이상 입력해주세요"
 */

// ─── 핵심 타입 ────────────────────────────────────────────────────────────────

/** 단일 검증 규칙. 통과하면 null, 실패하면 에러 메시지. */
export type Rule<T = unknown> = (value: T) => string | null;

/** 필드별 규칙 배열로 구성된 스키마. */
export type Schema<T extends Record<string, unknown>> = {
  [K in keyof T]?: Rule<T[K]>[];
};

/** validate() 반환 타입 */
export type ValidationResult<T extends Record<string, unknown>> =
  | { valid: true }
  | { valid: false; errors: Partial<Record<keyof T, string>> };

// ─── validate ────────────────────────────────────────────────────────────────

/**
 * 데이터 객체를 스키마에 따라 검증한다.
 * 각 필드에서 첫 번째로 실패한 규칙의 메시지가 errors에 담긴다.
 */
export function validate<T extends Record<string, unknown>>(
  data: T,
  schema: Schema<T>
): ValidationResult<T> {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const key in schema) {
    const rules = schema[key];
    if (!rules) continue;
    for (const rule of rules) {
      const msg = rule(data[key] as T[typeof key]);
      if (msg !== null) {
        errors[key] = msg;
        break; // 필드당 첫 번째 에러만
      }
    }
  }

  return Object.keys(errors).length === 0
    ? { valid: true }
    : { valid: false, errors };
}

// ─── 내장 규칙 ────────────────────────────────────────────────────────────────

/**
 * null / undefined / 빈 문자열 / 빈 배열을 거부한다.
 */
export function required(message = "필수 항목입니다"): Rule {
  return (value) => {
    if (value == null) return message;
    if (typeof value === "string" && value.trim() === "") return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
  };
}

/**
 * 문자열 최소 길이 규칙.
 */
export function minLength(n: number, message?: string): Rule<string> {
  return (value) => {
    if (value == null || value.length >= n) return null;
    return message ?? `${n}자 이상 입력해주세요`;
  };
}

/**
 * 문자열 최대 길이 규칙.
 */
export function maxLength(n: number, message?: string): Rule<string> {
  return (value) => {
    if (value == null || value.length <= n) return null;
    return message ?? `${n}자 이하로 입력해주세요`;
  };
}

/**
 * 숫자 최솟값 규칙.
 */
export function minValue(n: number, message?: string): Rule<number> {
  return (value) => {
    if (value == null || value >= n) return null;
    return message ?? `${n} 이상이어야 합니다`;
  };
}

/**
 * 숫자 최댓값 규칙.
 */
export function maxValue(n: number, message?: string): Rule<number> {
  return (value) => {
    if (value == null || value <= n) return null;
    return message ?? `${n} 이하이어야 합니다`;
  };
}

/**
 * 정규식 패턴 규칙.
 */
export function pattern(
  regex: RegExp,
  message = "형식이 올바르지 않습니다"
): Rule<string> {
  return (value) => {
    if (value == null || regex.test(value)) return null;
    return message;
  };
}

/**
 * 이메일 형식 규칙.
 */
export function emailRule(
  message = "이메일 형식이 올바르지 않습니다"
): Rule<string> {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern(EMAIL_RE, message);
}

/**
 * URL 형식 규칙.
 */
export function urlRule(
  message = "올바른 URL이 아닙니다"
): Rule<string> {
  return (value) => {
    if (value == null || value === "") return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  };
}

/**
 * 배열 최소 항목 수 규칙.
 */
export function minItems(n: number, message?: string): Rule<unknown[]> {
  return (value) => {
    if (value == null || value.length >= n) return null;
    return message ?? `${n}개 이상 선택해주세요`;
  };
}

/**
 * 배열 최대 항목 수 규칙.
 */
export function maxItems(n: number, message?: string): Rule<unknown[]> {
  return (value) => {
    if (value == null || value.length <= n) return null;
    return message ?? `${n}개 이하로 선택해주세요`;
  };
}

/**
 * 허용된 값 목록 규칙.
 */
export function oneOf<T>(
  allowed: T[],
  message?: string
): Rule<T> {
  return (value) => {
    if (value == null || allowed.includes(value)) return null;
    return message ?? `허용되지 않는 값입니다: ${String(value)}`;
  };
}

/**
 * 커스텀 규칙을 만든다. 조건이 true이면 통과, false이면 message 반환.
 *
 * @example
 * custom(v => v !== "admin", "예약된 이름은 사용할 수 없습니다")
 */
export function custom<T>(
  predicate: (value: T) => boolean,
  message: string
): Rule<T> {
  return (value) => (predicate(value) ? null : message);
}
