import { describe, it, expect } from "vitest";
import { checkInvariants, enforceInvariants } from "./invariant";

describe("checkInvariants", () => {
  describe("that", () => {
    it("조건이 참이면 통과", () => {
      const result = checkInvariants((c) => {
        c.that(true, "should pass");
      });
      expect(result.ok).toBe(true);
      expect(result.passed).toBe(1);
    });

    it("조건이 거짓이면 에러", () => {
      const result = checkInvariants((c) => {
        c.that(false, "must be true");
      });
      expect(result.ok).toBe(false);
      expect(result.errors[0].message).toBe("must be true");
    });
  });

  describe("defined", () => {
    it("값이 있으면 통과", () => {
      const result = checkInvariants((c) => {
        c.defined(42, "must exist");
        c.defined("", "empty string is defined");
        c.defined(0, "zero is defined");
        c.defined(false, "false is defined");
      });
      expect(result.ok).toBe(true);
      expect(result.passed).toBe(4);
    });

    it("null/undefined면 에러", () => {
      const result = checkInvariants((c) => {
        c.defined(null, "null fail");
        c.defined(undefined, "undefined fail");
      });
      expect(result.ok).toBe(false);
      expect(result.failed).toBe(2);
    });
  });

  describe("oneOf", () => {
    it("허용 목록에 있으면 통과", () => {
      const result = checkInvariants((c) => {
        c.oneOf("production", ["development", "staging", "production"], "invalid env");
      });
      expect(result.ok).toBe(true);
    });

    it("목록에 없으면 에러", () => {
      const result = checkInvariants((c) => {
        c.oneOf("test", ["dev", "prod"], "invalid");
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("notEmpty", () => {
    it("비어있지 않으면 통과", () => {
      const result = checkInvariants((c) => {
        c.notEmpty("hello", "must not be empty");
      });
      expect(result.ok).toBe(true);
    });

    it("빈 문자열/null/undefined면 에러", () => {
      const result = checkInvariants((c) => {
        c.notEmpty("", "empty");
        c.notEmpty("   ", "whitespace only");
        c.notEmpty(null, "null");
        c.notEmpty(undefined, "undefined");
      });
      expect(result.failed).toBe(4);
    });
  });

  describe("inRange", () => {
    it("범위 내면 통과", () => {
      const result = checkInvariants((c) => {
        c.inRange(8080, 1, 65535, "port range");
      });
      expect(result.ok).toBe(true);
    });

    it("범위 밖이면 에러", () => {
      const result = checkInvariants((c) => {
        c.inRange(0, 1, 65535, "port range");
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("matches", () => {
    it("패턴에 매칭되면 통과", () => {
      const result = checkInvariants((c) => {
        c.matches("v1.2.3", /^v\d+\.\d+\.\d+$/, "semver format");
      });
      expect(result.ok).toBe(true);
    });

    it("매칭 안 되면 에러", () => {
      const result = checkInvariants((c) => {
        c.matches("invalid", /^v\d+/, "must start with v");
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("check", () => {
    it("함수가 true면 통과", () => {
      const result = checkInvariants((c) => {
        c.check(() => 1 + 1 === 2, "math works");
      });
      expect(result.ok).toBe(true);
    });

    it("함수가 false면 에러", () => {
      const result = checkInvariants((c) => {
        c.check(() => false, "always fails");
      });
      expect(result.ok).toBe(false);
    });

    it("함수가 throw하면 에러", () => {
      const result = checkInvariants((c) => {
        c.check(() => { throw new Error("boom"); }, "crashed");
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("복합 검증", () => {
    it("모든 검증을 실행하고 전체 결과를 반환한다", () => {
      const result = checkInvariants((c) => {
        c.that(true, "pass 1");
        c.that(false, "fail 1");
        c.that(true, "pass 2");
        c.that(false, "fail 2");
        c.defined(null, "fail 3");
      });

      expect(result.passed).toBe(2);
      expect(result.failed).toBe(3);
      expect(result.errors.length).toBe(3);
    });

    it("category를 포함한다", () => {
      const result = checkInvariants((c) => {
        c.that(false, "db required", "database");
        c.that(false, "key required", "auth");
      });

      expect(result.errors[0].category).toBe("database");
      expect(result.errors[1].category).toBe("auth");
    });
  });

  describe("실전: 서버 시작 검증", () => {
    it("여러 조건을 한 번에 검증한다", () => {
      const config = { port: 8080, env: "production", dbUrl: "postgres://..." };

      const result = checkInvariants((c) => {
        c.inRange(config.port, 1, 65535, "PORT must be 1-65535", "config");
        c.oneOf(config.env, ["development", "staging", "production"], "Invalid NODE_ENV", "config");
        c.notEmpty(config.dbUrl, "DATABASE_URL required", "database");
        c.matches(config.dbUrl, /^postgres/, "DB URL must start with postgres", "database");
      });

      expect(result.ok).toBe(true);
      expect(result.passed).toBe(4);
    });
  });
});

describe("enforceInvariants", () => {
  it("모두 통과하면 에러 없음", () => {
    expect(() => enforceInvariants((c) => {
      c.that(true, "ok");
    })).not.toThrow();
  });

  it("실패하면 전체 에러 메시지를 포함한 에러", () => {
    expect(() => enforceInvariants((c) => {
      c.that(false, "A failed", "cat1");
      c.that(false, "B failed");
    })).toThrow("Invariant check failed (2/2)");
  });
});
