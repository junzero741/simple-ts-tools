import { describe, expect, it } from "vitest";
import { parseEnv } from "./parseEnv";

// 테스트는 source를 직접 주입해 process.env에 의존하지 않는다.

describe("parseEnv — string 타입", () => {
  it("값이 있으면 문자열을 반환한다", () => {
    const env = parseEnv(
      { DATABASE_URL: { type: "string" } },
      { DATABASE_URL: "postgres://localhost/db" }
    );
    expect(env.DATABASE_URL).toBe("postgres://localhost/db");
  });

  it("값이 없고 default가 있으면 default를 반환한다", () => {
    const env = parseEnv(
      { HOST: { type: "string", default: "localhost" } },
      {}
    );
    expect(env.HOST).toBe("localhost");
  });

  it("값이 없고 optional이면 undefined를 반환한다", () => {
    const env = parseEnv(
      { REDIS_URL: { type: "string", optional: true } },
      {}
    );
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("값이 없고 required이면 throw한다", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: { type: "string" } }, {})
    ).toThrow("DATABASE_URL");
  });
});

describe("parseEnv — number 타입", () => {
  it("숫자 문자열을 number로 변환한다", () => {
    const env = parseEnv(
      { PORT: { type: "number" } },
      { PORT: "8080" }
    );
    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe("number");
  });

  it("소수도 파싱한다", () => {
    const env = parseEnv(
      { RATIO: { type: "number" } },
      { RATIO: "0.75" }
    );
    expect(env.RATIO).toBe(0.75);
  });

  it("default 숫자를 반환한다", () => {
    const env = parseEnv(
      { PORT: { type: "number", default: 3000 } },
      {}
    );
    expect(env.PORT).toBe(3000);
  });

  it("숫자가 아닌 값이면 throw한다", () => {
    expect(() =>
      parseEnv({ PORT: { type: "number" } }, { PORT: "abc" })
    ).toThrow("number");
  });

  it("min 미만이면 throw한다", () => {
    expect(() =>
      parseEnv({ PORT: { type: "number", min: 1024 } }, { PORT: "80" })
    ).toThrow("minimum");
  });

  it("max 초과이면 throw한다", () => {
    expect(() =>
      parseEnv({ WORKERS: { type: "number", max: 16 } }, { WORKERS: "32" })
    ).toThrow("maximum");
  });

  it("min/max 범위 내에 있으면 통과한다", () => {
    const env = parseEnv(
      { PORT: { type: "number", min: 1024, max: 65535 } },
      { PORT: "3000" }
    );
    expect(env.PORT).toBe(3000);
  });
});

describe("parseEnv — boolean 타입", () => {
  it.each([["true"], ["1"], ["yes"], ["on"], ["TRUE"], ["YES"]])(
    '"%s"는 true로 변환된다',
    (val) => {
      const env = parseEnv({ DEBUG: { type: "boolean" } }, { DEBUG: val });
      expect(env.DEBUG).toBe(true);
    }
  );

  it.each([["false"], ["0"], ["no"], ["off"], ["FALSE"]])(
    '"%s"는 false로 변환된다',
    (val) => {
      const env = parseEnv({ DEBUG: { type: "boolean" } }, { DEBUG: val });
      expect(env.DEBUG).toBe(false);
    }
  );

  it("default boolean을 반환한다", () => {
    const env = parseEnv(
      { DEBUG: { type: "boolean", default: false } },
      {}
    );
    expect(env.DEBUG).toBe(false);
  });

  it("인식할 수 없는 값이면 throw한다", () => {
    expect(() =>
      parseEnv({ DEBUG: { type: "boolean" } }, { DEBUG: "maybe" })
    ).toThrow("boolean");
  });
});

describe("parseEnv — enum 타입", () => {
  const schema = {
    LOG_LEVEL: {
      type: "enum" as const,
      values: ["debug", "info", "warn", "error"] as const,
      default: "info" as const,
    },
  };

  it("허용된 값이면 통과한다", () => {
    const env = parseEnv(schema, { LOG_LEVEL: "debug" });
    expect(env.LOG_LEVEL).toBe("debug");
  });

  it("default를 반환한다", () => {
    const env = parseEnv(schema, {});
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("허용되지 않은 값이면 throw한다", () => {
    expect(() =>
      parseEnv(schema, { LOG_LEVEL: "verbose" })
    ).toThrow("verbose");
  });

  it("허용 목록을 에러 메시지에 포함한다", () => {
    expect(() =>
      parseEnv(schema, { LOG_LEVEL: "verbose" })
    ).toThrow('"debug"');
  });
});

describe("parseEnv — 복합 스키마", () => {
  const schema = {
    PORT:         { type: "number",  default: 3000 },
    DATABASE_URL: { type: "string" },
    DEBUG:        { type: "boolean", default: false },
    LOG_LEVEL: {
      type: "enum" as const,
      values: ["debug", "info", "warn", "error"] as const,
      default: "info" as const,
    },
    REDIS_URL: { type: "string", optional: true },
  } as const;

  it("모든 필드를 올바르게 파싱한다", () => {
    const env = parseEnv(schema, {
      DATABASE_URL: "postgres://localhost/db",
      PORT: "8080",
      DEBUG: "true",
      LOG_LEVEL: "warn",
    });

    expect(env.PORT).toBe(8080);
    expect(env.DATABASE_URL).toBe("postgres://localhost/db");
    expect(env.DEBUG).toBe(true);
    expect(env.LOG_LEVEL).toBe("warn");
    expect(env.REDIS_URL).toBeUndefined();
  });

  it("default만으로 실행 가능한 최소 설정", () => {
    const env = parseEnv(schema, { DATABASE_URL: "postgres://localhost/db" });
    expect(env.PORT).toBe(3000);
    expect(env.DEBUG).toBe(false);
    expect(env.LOG_LEVEL).toBe("info");
  });
});

describe("parseEnv — 에러 처리", () => {
  it("여러 필드에 오류가 있으면 모두 한 번에 보고한다", () => {
    let errorMessage = "";
    try {
      parseEnv(
        {
          PORT: { type: "number" },
          DATABASE_URL: { type: "string" },
          DEBUG: { type: "boolean" },
        },
        {}
      );
    } catch (e) {
      errorMessage = (e as Error).message;
    }

    expect(errorMessage).toContain("PORT");
    expect(errorMessage).toContain("DATABASE_URL");
    expect(errorMessage).toContain("DEBUG");
  });

  it("에러 메시지에 'Environment variable validation failed'가 포함된다", () => {
    expect(() =>
      parseEnv({ X: { type: "string" } }, {})
    ).toThrow("Environment variable validation failed");
  });
});

describe("parseEnv — 빈 문자열 처리", () => {
  it("빈 문자열은 '값 없음'으로 처리한다 (default 사용)", () => {
    const env = parseEnv(
      { HOST: { type: "string", default: "localhost" } },
      { HOST: "" }
    );
    expect(env.HOST).toBe("localhost");
  });

  it("빈 문자열에 required string이면 throw한다", () => {
    expect(() =>
      parseEnv({ DATABASE_URL: { type: "string" } }, { DATABASE_URL: "" })
    ).toThrow("DATABASE_URL");
  });
});
