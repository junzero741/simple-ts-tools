// ─── 스키마 타입 ───────────────────────────────────────────────────────────────

interface StringField {
  type: "string";
  default?: string;
  /** true이면 undefined를 허용한다 (기본: false → 없으면 throw) */
  optional?: boolean;
}

interface NumberField {
  type: "number";
  default?: number;
  optional?: boolean;
  min?: number;
  max?: number;
}

interface BooleanField {
  type: "boolean";
  default?: boolean;
  optional?: boolean;
}

interface EnumField<T extends readonly string[]> {
  type: "enum";
  values: T;
  default?: T[number];
  optional?: boolean;
}

type FieldConfig =
  | StringField
  | NumberField
  | BooleanField
  | EnumField<readonly string[]>;

export type EnvSchema = Record<string, FieldConfig>;

// ─── 타입 추론 ─────────────────────────────────────────────────────────────────

type InferField<F extends FieldConfig> =
  // default 지정 → 반드시 존재 (해당 타입)
  F extends { default: infer D } ? D :
  // optional: true → undefined 가능
  F extends { optional: true } ? InferBaseType<F> | undefined :
  // default 없고 optional 아님 → required (값 없으면 throw)
  InferBaseType<F>;

type InferBaseType<F extends FieldConfig> =
  F extends StringField ? string :
  F extends NumberField ? number :
  F extends BooleanField ? boolean :
  F extends EnumField<infer T> ? T[number] :
  never;

export type InferEnv<S extends EnvSchema> = {
  [K in keyof S]: InferField<S[K]>;
};

// ─── 파싱 로직 ─────────────────────────────────────────────────────────────────

/**
 * 환경 변수를 스키마에 따라 파싱·검증한 뒤 타입 안전 객체로 반환한다.
 *
 * - `default` 지정 시 변수가 없어도 기본값 사용
 * - `default` 없고 `optional: true`이면 `undefined` 반환
 * - `default` 없고 `optional` 아니면 변수가 없을 때 즉시 throw (fail fast)
 * - `number` 타입: `min` / `max` 범위 검사 지원
 * - `boolean` 타입: `"true"` / `"1"` / `"yes"` → true, 나머지 → false
 * - `enum` 타입: 허용 목록 외 값이면 throw
 * - `source` 미지정 시 `process.env` 사용 (Node.js / Bun / Deno 모두 호환)
 *
 * @example
 * const env = parseEnv({
 *   PORT:         { type: "number",  default: 3000 },
 *   DATABASE_URL: { type: "string" },                       // required
 *   DEBUG:        { type: "boolean", default: false },
 *   LOG_LEVEL:    { type: "enum",    values: ["debug", "info", "warn", "error"] as const,
 *                                    default: "info" },
 *   REDIS_URL:    { type: "string",  optional: true },      // optional — string | undefined
 * });
 *
 * // 타입 추론:
 * // env.PORT         → number
 * // env.DATABASE_URL → string
 * // env.DEBUG        → boolean
 * // env.LOG_LEVEL    → "debug" | "info" | "warn" | "error"
 * // env.REDIS_URL    → string | undefined
 *
 * @example
 * // 테스트에서 source를 직접 주입
 * const env = parseEnv(schema, { PORT: "8080", DATABASE_URL: "postgres://..." });
 */
export function parseEnv<S extends EnvSchema>(
  schema: S,
  source: Record<string, string | undefined> = getProcessEnv()
): InferEnv<S> {
  const errors: string[] = [];
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(schema) as (keyof S & string)[]) {
    const field = schema[key];
    const raw = source[key];

    try {
      result[key] = parseField(key, raw, field);
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment variable validation failed:\n${errors.map(e => `  • ${e}`).join("\n")}`);
  }

  return result as InferEnv<S>;
}

function parseField(key: string, raw: string | undefined, field: FieldConfig): unknown {
  // 값이 없을 때 처리
  if (raw === undefined || raw === "") {
    if ("default" in field && field.default !== undefined) return field.default;
    if (field.optional) return undefined;
    throw new Error(`${key}: required but not set`);
  }

  switch (field.type) {
    case "string":
      return raw;

    case "number": {
      const n = Number(raw);
      if (isNaN(n)) throw new Error(`${key}: expected a number, got "${raw}"`);
      if (field.min !== undefined && n < field.min)
        throw new Error(`${key}: ${n} is below minimum ${field.min}`);
      if (field.max !== undefined && n > field.max)
        throw new Error(`${key}: ${n} exceeds maximum ${field.max}`);
      return n;
    }

    case "boolean": {
      const lower = raw.toLowerCase();
      if (["true", "1", "yes", "on"].includes(lower)) return true;
      if (["false", "0", "no", "off", ""].includes(lower)) return false;
      throw new Error(`${key}: expected a boolean ("true"/"false"/"1"/"0"/"yes"/"no"), got "${raw}"`);
    }

    case "enum": {
      if (!(field.values as readonly string[]).includes(raw)) {
        throw new Error(
          `${key}: "${raw}" is not one of [${(field.values as readonly string[]).map(v => `"${v}"`).join(", ")}]`
        );
      }
      return raw;
    }
  }
}

function getProcessEnv(): Record<string, string | undefined> {
  // Node.js, Bun, Deno, edge runtimes 호환
  if (typeof process !== "undefined" && process.env) return process.env;
  return {};
}
