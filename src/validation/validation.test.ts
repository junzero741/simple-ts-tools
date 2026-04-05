import { describe, expect, it } from "vitest";
import {
  custom,
  emailRule,
  maxItems,
  maxLength,
  maxValue,
  minItems,
  minLength,
  minValue,
  oneOf,
  pattern,
  required,
  urlRule,
  validate,
} from "./validation";

// ─── validate ────────────────────────────────────────────────────────────────

describe("validate", () => {
  it("모든 규칙 통과 시 { valid: true }", () => {
    const result = validate(
      { name: "Alice", age: 25 },
      { name: [required(), minLength(2)], age: [required()] }
    );
    expect(result.valid).toBe(true);
  });

  it("규칙 실패 시 { valid: false, errors }", () => {
    const result = validate(
      { name: "" },
      { name: [required()] }
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBe("필수 항목입니다");
  });

  it("필드당 첫 번째 실패 메시지만 담긴다", () => {
    const result = validate(
      { name: "A" },
      { name: [required(), minLength(2), maxLength(30)] }
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.name).toBe("2자 이상 입력해주세요");
  });

  it("여러 필드에 에러가 있으면 모두 수집한다", () => {
    const result = validate(
      { name: "", email: "bad" },
      {
        name: [required()],
        email: [required(), emailRule()],
      }
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    }
  });

  it("스키마에 없는 필드는 무시된다", () => {
    const result = validate(
      { name: "Alice", extra: "ignored" } as Record<string, unknown>,
      { name: [required()] }
    );
    expect(result.valid).toBe(true);
  });
});

// ─── required ────────────────────────────────────────────────────────────────

describe("required", () => {
  it("값이 있으면 통과", () => {
    expect(required()("hello")).toBeNull();
    expect(required()(0)).toBeNull();
    expect(required()(false)).toBeNull();
    expect(required()(["x"])).toBeNull();
  });

  it("null / undefined 는 실패", () => {
    expect(required()(null)).not.toBeNull();
    expect(required()(undefined)).not.toBeNull();
  });

  it("빈 문자열은 실패", () => {
    expect(required()("")).not.toBeNull();
    expect(required()("   ")).not.toBeNull();
  });

  it("빈 배열은 실패", () => {
    expect(required()([])).not.toBeNull();
  });

  it("커스텀 메시지를 사용한다", () => {
    expect(required("입력하세요")("")).toBe("입력하세요");
  });
});

// ─── minLength / maxLength ────────────────────────────────────────────────────

describe("minLength", () => {
  it("충분히 길면 통과", () => {
    expect(minLength(3)("abc")).toBeNull();
    expect(minLength(3)("abcd")).toBeNull();
  });

  it("너무 짧으면 실패", () => {
    expect(minLength(3)("ab")).not.toBeNull();
  });

  it("빈 문자열은 실패 (길이 0 < n)", () => {
    expect(minLength(1)("")).not.toBeNull();
  });

  it("커스텀 메시지", () => {
    expect(minLength(5, "5글자 이상")("hi")).toBe("5글자 이상");
  });
});

describe("maxLength", () => {
  it("충분히 짧으면 통과", () => {
    expect(maxLength(5)("hello")).toBeNull();
    expect(maxLength(5)("hi")).toBeNull();
  });

  it("너무 길면 실패", () => {
    expect(maxLength(3)("hello")).not.toBeNull();
  });
});

// ─── minValue / maxValue ──────────────────────────────────────────────────────

describe("minValue", () => {
  it("충분히 크면 통과", () => {
    expect(minValue(0)(5)).toBeNull();
    expect(minValue(0)(0)).toBeNull();
  });

  it("너무 작으면 실패", () => {
    expect(minValue(0)(-1)).not.toBeNull();
  });
});

describe("maxValue", () => {
  it("충분히 작으면 통과", () => {
    expect(maxValue(100)(99)).toBeNull();
    expect(maxValue(100)(100)).toBeNull();
  });

  it("너무 크면 실패", () => {
    expect(maxValue(100)(101)).not.toBeNull();
  });
});

// ─── pattern / emailRule / urlRule ────────────────────────────────────────────

describe("pattern", () => {
  it("패턴에 맞으면 통과", () => {
    expect(pattern(/^\d+$/)("123")).toBeNull();
  });

  it("패턴에 맞지 않으면 실패", () => {
    expect(pattern(/^\d+$/)("abc")).not.toBeNull();
  });
});

describe("emailRule", () => {
  it("올바른 이메일은 통과", () => {
    expect(emailRule()("user@example.com")).toBeNull();
    expect(emailRule()("a.b+c@x.co.kr")).toBeNull();
  });

  it("잘못된 이메일은 실패", () => {
    expect(emailRule()("notanemail")).not.toBeNull();
    expect(emailRule()("@domain.com")).not.toBeNull();
    expect(emailRule()("user@")).not.toBeNull();
  });

  it("null/undefined는 통과 (required와 조합 사용)", () => {
    expect(emailRule()(null as unknown as string)).toBeNull();
  });
});

describe("urlRule", () => {
  it("올바른 URL은 통과", () => {
    expect(urlRule()("https://example.com")).toBeNull();
    expect(urlRule()("http://localhost:3000")).toBeNull();
  });

  it("잘못된 URL은 실패", () => {
    expect(urlRule()("not-a-url")).not.toBeNull();
    expect(urlRule()("example.com")).not.toBeNull(); // protocol 없음
  });

  it("빈 문자열은 통과 (required와 조합)", () => {
    expect(urlRule()("")).toBeNull();
  });
});

// ─── minItems / maxItems ──────────────────────────────────────────────────────

describe("minItems", () => {
  it("충분히 많으면 통과", () => {
    expect(minItems(2)(["a", "b", "c"])).toBeNull();
    expect(minItems(2)(["a", "b"])).toBeNull();
  });

  it("너무 적으면 실패", () => {
    expect(minItems(2)(["a"])).not.toBeNull();
    expect(minItems(1)([])).not.toBeNull();
  });
});

describe("maxItems", () => {
  it("충분히 적으면 통과", () => {
    expect(maxItems(3)(["a", "b"])).toBeNull();
  });

  it("너무 많으면 실패", () => {
    expect(maxItems(2)(["a", "b", "c"])).not.toBeNull();
  });
});

// ─── oneOf / custom ───────────────────────────────────────────────────────────

describe("oneOf", () => {
  it("허용된 값이면 통과", () => {
    expect(oneOf(["admin", "user", "guest"])("user")).toBeNull();
  });

  it("허용되지 않은 값이면 실패", () => {
    expect(oneOf(["admin", "user"])("hacker")).not.toBeNull();
  });
});

describe("custom", () => {
  it("predicate가 true이면 통과", () => {
    expect(custom((v: string) => v !== "admin", "예약된 이름")("alice")).toBeNull();
  });

  it("predicate가 false이면 실패", () => {
    expect(custom((v: string) => v !== "admin", "예약된 이름")("admin")).toBe("예약된 이름");
  });
});

// ─── 실사용 시나리오 ─────────────────────────────────────────────────────────

describe("실사용: 회원가입 폼 검증", () => {
  const signupSchema = {
    username: [required(), minLength(3), maxLength(20), pattern(/^\w+$/, "영문·숫자·_만 사용 가능")],
    email: [required(), emailRule()],
    password: [required(), minLength(8)],
    age: [minValue(14, "14세 이상만 가입 가능"), maxValue(120)],
    role: [oneOf(["user", "admin"] as const)],
  };

  it("유효한 데이터는 통과한다", () => {
    const result = validate(
      { username: "alice_01", email: "alice@example.com", password: "password1", age: 25, role: "user" } as Record<string, unknown>,
      signupSchema as Schema<Record<string, unknown>>
    );
    expect(result.valid).toBe(true);
  });

  it("여러 필드 오류를 한 번에 반환한다", () => {
    const result = validate(
      { username: "a!", email: "bad", password: "short", age: 10, role: "unknown" } as Record<string, unknown>,
      signupSchema as Schema<Record<string, unknown>>
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    }
  });
});
