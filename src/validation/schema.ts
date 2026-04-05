/**
 * 런타임 스키마 파서 (Schema Parser).
 *
 * Zod의 핵심 패턴만 추출한 경량 구현.
 * 타입 검증뿐 아니라 파싱(coercion), 변환(transform), 기본값을 지원한다.
 *
 * @example
 * const UserSchema = s.object({
 *   name: s.string().min(1),
 *   age: s.number().min(0).max(150),
 *   email: s.string().optional(),
 *   role: s.enum(["admin", "user"]).default("user"),
 * });
 *
 * const result = UserSchema.parse({ name: "alice", age: 30 });
 * // { ok: true, value: { name: "alice", age: 30, role: "user" } }
 *
 * const bad = UserSchema.parse({ name: "", age: -1 });
 * // { ok: false, errors: [...] }
 *
 * @example
 * // transform으로 파싱과 변환을 한 번에
 * const DateStr = s.string().transform((v) => new Date(v));
 *
 * @complexity Time: O(n) 객체 키 수. Space: O(n).
 */

export interface ParseResult<T> {
  ok: boolean;
  value?: T;
  errors?: SchemaError[];
}

export interface SchemaError {
  path: string[];
  message: string;
}

export interface Schema<T> {
  parse(input: unknown): ParseResult<T>;
  optional(): Schema<T | undefined>;
  default(value: T): Schema<T>;
  transform<U>(fn: (value: T) => U): Schema<U>;
}

function createSchema<T>(
  validator: (input: unknown, path: string[]) => ParseResult<T>,
): Schema<T> {
  const schema: Schema<T> = {
    parse(input) {
      return validator(input, []);
    },

    optional(): Schema<T | undefined> {
      return createSchema((input, path) => {
        if (input === undefined || input === null) {
          return { ok: true, value: undefined };
        }
        return validator(input, path) as ParseResult<T | undefined>;
      });
    },

    default(defaultValue: T): Schema<T> {
      return createSchema((input, path) => {
        if (input === undefined || input === null) {
          return { ok: true, value: defaultValue };
        }
        return validator(input, path);
      });
    },

    transform<U>(fn: (value: T) => U): Schema<U> {
      return createSchema<U>((input, path) => {
        const result = validator(input, path);
        if (!result.ok) return result as unknown as ParseResult<U>;
        try {
          return { ok: true, value: fn(result.value!) };
        } catch (err) {
          return { ok: false, errors: [{ path, message: (err as Error).message }] };
        }
      });
    },
  };

  return schema;
}

function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

function fail(path: string[], message: string): ParseResult<never> {
  return { ok: false, errors: [{ path, message }] };
}

// --- 스키마 팩토리 ---

interface StringSchema extends Schema<string> {
  min(n: number): StringSchema;
  max(n: number): StringSchema;
  pattern(re: RegExp): StringSchema;
}

interface NumberSchema extends Schema<number> {
  min(n: number): NumberSchema;
  max(n: number): NumberSchema;
  int(): NumberSchema;
}

interface ArraySchema<T> extends Schema<T[]> {
  min(n: number): ArraySchema<T>;
  max(n: number): ArraySchema<T>;
}

function addStringConstraints(
  base: (input: unknown, path: string[]) => ParseResult<string>,
  constraints: Array<(value: string, path: string[]) => ParseResult<string> | null>,
): StringSchema {
  const validator = (input: unknown, path: string[]): ParseResult<string> => {
    const result = base(input, path);
    if (!result.ok) return result;
    for (const check of constraints) {
      const err = check(result.value!, path);
      if (err) return err;
    }
    return result;
  };

  const schema = createSchema<string>(validator) as StringSchema;

  schema.min = (n) =>
    addStringConstraints(validator, [
      ...constraints,
      (v, p) => (v.length < n ? fail(p, `String must be at least ${n} characters`) : null),
    ]);

  schema.max = (n) =>
    addStringConstraints(validator, [
      ...constraints,
      (v, p) => (v.length > n ? fail(p, `String must be at most ${n} characters`) : null),
    ]);

  schema.pattern = (re) =>
    addStringConstraints(validator, [
      ...constraints,
      (v, p) => (!re.test(v) ? fail(p, `String must match pattern ${re}`) : null),
    ]);

  return schema;
}

function addNumberConstraints(
  base: (input: unknown, path: string[]) => ParseResult<number>,
  constraints: Array<(value: number, path: string[]) => ParseResult<number> | null>,
): NumberSchema {
  const validator = (input: unknown, path: string[]): ParseResult<number> => {
    const result = base(input, path);
    if (!result.ok) return result;
    for (const check of constraints) {
      const err = check(result.value!, path);
      if (err) return err;
    }
    return result;
  };

  const schema = createSchema<number>(validator) as NumberSchema;

  schema.min = (n) =>
    addNumberConstraints(validator, [
      ...constraints,
      (v, p) => (v < n ? fail(p, `Number must be at least ${n}`) : null),
    ]);

  schema.max = (n) =>
    addNumberConstraints(validator, [
      ...constraints,
      (v, p) => (v > n ? fail(p, `Number must be at most ${n}`) : null),
    ]);

  schema.int = () =>
    addNumberConstraints(validator, [
      ...constraints,
      (v, p) => (!Number.isInteger(v) ? fail(p, "Number must be an integer") : null),
    ]);

  return schema;
}

export const s = {
  string(): StringSchema {
    return addStringConstraints(
      (input, path) =>
        typeof input === "string" ? ok(input) : fail(path, `Expected string, got ${typeof input}`),
      [],
    );
  },

  number(): NumberSchema {
    return addNumberConstraints(
      (input, path) => {
        if (typeof input !== "number" || Number.isNaN(input)) {
          return fail(path, `Expected number, got ${typeof input}`);
        }
        return ok(input);
      },
      [],
    );
  },

  boolean(): Schema<boolean> {
    return createSchema((input, path) =>
      typeof input === "boolean" ? ok(input) : fail(path, `Expected boolean, got ${typeof input}`),
    );
  },

  literal<T extends string | number | boolean>(expected: T): Schema<T> {
    return createSchema((input, path) =>
      input === expected ? ok(expected) : fail(path, `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(input)}`),
    );
  },

  enum<T extends string>(values: readonly T[]): Schema<T> & { default(value: T): Schema<T> } {
    return createSchema<T>((input, path) => {
      if (typeof input !== "string" || !(values as readonly string[]).includes(input)) {
        return fail(path, `Expected one of [${values.join(", ")}], got ${JSON.stringify(input)}`);
      }
      return ok(input as T);
    }) as Schema<T> & { default(value: T): Schema<T> };
  },

  array<T>(itemSchema: Schema<T>): ArraySchema<T> {
    const baseValidator = (input: unknown, path: string[]): ParseResult<T[]> => {
      if (!Array.isArray(input)) return fail(path, `Expected array, got ${typeof input}`);

      const values: T[] = [];
      const errors: SchemaError[] = [];

      for (let i = 0; i < input.length; i++) {
        const result = itemSchema.parse(input[i]);
        if (result.ok) {
          values.push(result.value!);
        } else {
          for (const err of result.errors!) {
            errors.push({ path: [...path, String(i), ...err.path], message: err.message });
          }
        }
      }

      return errors.length > 0 ? { ok: false, errors } : ok(values);
    };

    function addArrayConstraints(
      validator: (input: unknown, path: string[]) => ParseResult<T[]>,
    ): ArraySchema<T> {
      const schema = createSchema<T[]>(validator) as ArraySchema<T>;

      schema.min = (n) =>
        addArrayConstraints((input, path) => {
          const result = validator(input, path);
          if (!result.ok) return result;
          if (result.value!.length < n) return fail(path, `Array must have at least ${n} items`);
          return result;
        });

      schema.max = (n) =>
        addArrayConstraints((input, path) => {
          const result = validator(input, path);
          if (!result.ok) return result;
          if (result.value!.length > n) return fail(path, `Array must have at most ${n} items`);
          return result;
        });

      return schema;
    }

    return addArrayConstraints(baseValidator);
  },

  object<T extends Record<string, Schema<unknown>>>(
    shape: T,
  ): Schema<{ [K in keyof T]: T[K] extends Schema<infer U> ? U : never }> {
    type Result = { [K in keyof T]: T[K] extends Schema<infer U> ? U : never };

    return createSchema<Result>((input, path) => {
      if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return fail(path, `Expected object, got ${Array.isArray(input) ? "array" : typeof input}`);
      }

      const obj = input as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      const errors: SchemaError[] = [];

      for (const [key, schema] of Object.entries(shape)) {
        const fieldResult = (schema as Schema<unknown>).parse(obj[key]);
        if (fieldResult.ok) {
          if (fieldResult.value !== undefined) {
            result[key] = fieldResult.value;
          }
        } else {
          for (const err of fieldResult.errors!) {
            errors.push({ path: [...path, key, ...err.path], message: err.message });
          }
        }
      }

      return errors.length > 0 ? { ok: false, errors } : ok(result as Result);
    });
  },
};
