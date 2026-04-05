// Design by Contract — 함수에 전후 조건을 선언적으로 부착.
//
// precondition: 호출 전 인자 검증
// postcondition: 반환 후 결과 검증
// invariant: 호출 전후 불변 조건 검증
//
// const safeDivide = contract(
//   (a: number, b: number) => a / b,
//   {
//     pre: [(a, b) => b !== 0, "divisor must not be zero"],
//     post: [(result) => isFinite(result), "result must be finite"],
//   },
// );
//
// safeDivide(10, 2);  // 5
// safeDivide(10, 0);  // ContractError: precondition failed: divisor must not be zero

export class ContractError extends Error {
  constructor(
    public readonly type: "precondition" | "postcondition" | "invariant",
    message: string,
  ) {
    super(`${type} failed: ${message}`);
    this.name = "ContractError";
  }
}

export type Condition<TArgs extends unknown[], TResult = unknown> =
  | [(...args: TArgs) => boolean, string]
  | ((...args: TArgs) => boolean);

export type PostCondition<TResult> =
  | [(result: TResult) => boolean, string]
  | ((result: TResult) => boolean);

export interface ContractOptions<TArgs extends unknown[], TResult> {
  pre?: Condition<TArgs> | Condition<TArgs>[];
  post?: PostCondition<TResult> | PostCondition<TResult>[];
  invariant?: [() => boolean, string] | (() => boolean);
}

function checkCondition<T extends unknown[]>(
  condition: Condition<T>,
  args: T,
  type: "precondition" | "postcondition" | "invariant",
): void {
  if (Array.isArray(condition)) {
    const [fn, message] = condition;
    if (!fn(...args)) throw new ContractError(type, message);
  } else {
    if (!(condition as (...a: T) => boolean)(...args)) {
      throw new ContractError(type, `${type} check failed`);
    }
  }
}

function normalizeConditions<T>(
  input: T | T[] | undefined,
): T[] {
  if (input === undefined) return [];
  if (Array.isArray(input) && input.length > 0 && Array.isArray(input[0])) {
    return input as T[];
  }
  return [input] as T[];
}

function isPairCondition(c: unknown): c is [Function, string] {
  return Array.isArray(c) && c.length === 2 && typeof c[0] === "function" && typeof c[1] === "string";
}

/**
 * 함수에 전후 조건을 부착한다.
 */
export function contract<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  options: ContractOptions<TArgs, TResult>,
): (...args: TArgs) => TResult {
  const { pre, post, invariant } = options;

  // pre/post 정규화
  const preConditions: Condition<TArgs>[] = [];
  if (pre !== undefined) {
    if (isPairCondition(pre)) {
      preConditions.push(pre as Condition<TArgs>);
    } else if (typeof pre === "function") {
      preConditions.push(pre as Condition<TArgs>);
    } else if (Array.isArray(pre)) {
      for (const p of pre) {
        preConditions.push(p as Condition<TArgs>);
      }
    }
  }

  const postConditions: PostCondition<TResult>[] = [];
  if (post !== undefined) {
    if (isPairCondition(post)) {
      postConditions.push(post as PostCondition<TResult>);
    } else if (typeof post === "function") {
      postConditions.push(post as PostCondition<TResult>);
    } else if (Array.isArray(post)) {
      for (const p of post) {
        postConditions.push(p as PostCondition<TResult>);
      }
    }
  }

  return (...args: TArgs): TResult => {
    // invariant (before)
    if (invariant) {
      checkCondition(invariant as Condition<[]>, [] as unknown as [], "invariant");
    }

    // preconditions
    for (const pre of preConditions) {
      checkCondition(pre, args, "precondition");
    }

    const result = fn(...args);

    // postconditions
    for (const post of postConditions) {
      checkCondition(
        post as Condition<[TResult]>,
        [result] as unknown as [TResult],
        "postcondition",
      );
    }

    // invariant (after)
    if (invariant) {
      checkCondition(invariant as Condition<[]>, [] as unknown as [], "invariant");
    }

    return result;
  };
}

/**
 * 클래스 메서드에 invariant를 부착하는 헬퍼.
 * 호출 전후 invariant를 검증한다.
 */
export function withInvariant<T extends object>(
  obj: T,
  check: (obj: T) => boolean,
  message: string = "invariant violated",
): T {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      return (...args: unknown[]) => {
        if (!check(target)) throw new ContractError("invariant", message);
        const result = value.apply(target, args);
        if (!check(target)) throw new ContractError("invariant", message);
        return result;
      };
    },
  });
}
