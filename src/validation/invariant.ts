// 환경 검증 (Environment Invariant Checker).
//
// === 예상 사용처 ===
// - 서버 시작 시 필수 환경변수 존재 확인 (PORT, DB_URL, API_KEY 누락 방지)
// - 배포 전 런타임 요구사항 검증 (Node 버전, 필수 바이너리, 디렉토리 존재)
// - 라이브러리 초기화 시 선행 조건 검증 (config 유효성, 의존성 로드 확인)
// - 피처 플래그 의존성 검증 (A 기능 활성화 시 B 설정도 필수)
// - 마이그레이션 전 데이터 정합성 체크 (필수 컬럼 존재, 외래키 유효)
// - CI/CD에서 빌드 환경 사전 검증 (도구 버전, 시크릿 설정)
//
// const result = checkInvariants((check) => {
//   check.env("DATABASE_URL", "DB 연결 문자열 필수");
//   check.env("API_KEY", "API 키 필수");
//   check.that(port > 0 && port < 65536, "PORT must be 1-65535");
//   check.oneOf(env, ["development", "staging", "production"], "Invalid NODE_ENV");
// });
//
// if (!result.ok) {
//   console.error(result.errors);
//   process.exit(1);
// }

export interface InvariantResult {
  ok: boolean;
  errors: InvariantError[];
  passed: number;
  failed: number;
}

export interface InvariantError {
  message: string;
  category?: string;
}

export interface InvariantChecker {
  /** 조건이 참인지 검증한다. */
  that(condition: boolean, message: string, category?: string): void;

  /** 값이 null/undefined가 아닌지 검증한다. */
  defined(value: unknown, message: string, category?: string): void;

  /** 환경변수가 존재하는지 검증한다. */
  env(name: string, message?: string): void;

  /** 값이 허용 목록에 있는지 검증한다. */
  oneOf<T>(value: T, allowed: T[], message: string, category?: string): void;

  /** 문자열이 비어있지 않은지 검증한다. */
  notEmpty(value: string | undefined | null, message: string, category?: string): void;

  /** 숫자가 범위 내인지 검증한다. */
  inRange(value: number, min: number, max: number, message: string, category?: string): void;

  /** 정규식 패턴에 매칭되는지 검증한다. */
  matches(value: string, pattern: RegExp, message: string, category?: string): void;

  /** 커스텀 검증 함수. false면 실패. */
  check(fn: () => boolean, message: string, category?: string): void;
}

/**
 * 여러 불변 조건을 한 번에 검증한다.
 * 하나가 실패해도 나머지를 모두 검사하여 전체 에러 목록을 반환.
 */
export function checkInvariants(
  fn: (checker: InvariantChecker) => void,
): InvariantResult {
  const errors: InvariantError[] = [];
  let passed = 0;

  function fail(message: string, category?: string): void {
    errors.push({ message, category });
  }

  function pass(): void {
    passed++;
  }

  const checker: InvariantChecker = {
    that(condition, message, category) {
      condition ? pass() : fail(message, category);
    },

    defined(value, message, category) {
      value !== null && value !== undefined ? pass() : fail(message, category);
    },

    env(name, message) {
      const exists =
        typeof globalThis !== "undefined" &&
        typeof (globalThis as any).process !== "undefined" &&
        (globalThis as any).process.env?.[name] !== undefined;

      // 브라우저 환경에서는 import.meta.env 체크 불가하므로 skip
      exists
        ? pass()
        : fail(message ?? `Environment variable "${name}" is required`, "env");
    },

    oneOf(value, allowed, message, category) {
      allowed.includes(value) ? pass() : fail(message, category);
    },

    notEmpty(value, message, category) {
      value !== null && value !== undefined && value.trim().length > 0
        ? pass()
        : fail(message, category);
    },

    inRange(value, min, max, message, category) {
      value >= min && value <= max ? pass() : fail(message, category);
    },

    matches(value, pattern, message, category) {
      pattern.test(value) ? pass() : fail(message, category);
    },

    check(fn, message, category) {
      try {
        fn() ? pass() : fail(message, category);
      } catch {
        fail(message, category);
      }
    },
  };

  fn(checker);

  return {
    ok: errors.length === 0,
    errors,
    passed,
    failed: errors.length,
  };
}

/**
 * 불변 조건이 하나라도 실패하면 에러를 던진다.
 * 서버 시작 시 사용.
 */
export function enforceInvariants(
  fn: (checker: InvariantChecker) => void,
): void {
  const result = checkInvariants(fn);
  if (!result.ok) {
    const messages = result.errors.map((e) =>
      e.category ? `[${e.category}] ${e.message}` : e.message,
    );
    throw new Error(
      `Invariant check failed (${result.failed}/${result.passed + result.failed}):\n` +
      messages.map((m) => `  - ${m}`).join("\n"),
    );
  }
}
