// 값 객체 팩토리 (Value Object).
//
// DDD의 Value Object 패턴을 TypeScript로 구현.
// 구조적 동등성(equals), 불변성(freeze), with(부분 복사),
// toString/toJSON을 자동 제공한다.
//
// const Money = defineValueObject<{ amount: number; currency: string }>();
//
// const a = Money({ amount: 100, currency: "USD" });
// const b = Money({ amount: 100, currency: "USD" });
//
// a.equals(b)        // true (구조적 동등성)
// a === b            // false (다른 참조)
// a.amount = 999     // TypeError (불변)
// a.with({ amount: 200 }) // Money({ amount: 200, currency: "USD" })

export interface ValueObject<T extends Record<string, unknown>> {
  /** 다른 값 객체와 구조적으로 같은지 비교한다. */
  equals(other: unknown): boolean;

  /** 일부 속성을 변경한 새 값 객체를 생성한다 (불변 복사). */
  with(partial: Partial<T>): ValueObject<T> & Readonly<T>;

  /** JSON 직렬화용. */
  toJSON(): T;

  /** 문자열 표현. */
  toString(): string;
}

export type ValueObjectInstance<T extends Record<string, unknown>> =
  ValueObject<T> & Readonly<T>;

export interface ValueObjectFactory<T extends Record<string, unknown>> {
  (props: T): ValueObjectInstance<T>;

  /** 일반 객체가 이 팩토리로 생성된 값 객체인지 확인한다. */
  is(value: unknown): value is ValueObjectInstance<T>;
}

export function defineValueObject<T extends Record<string, unknown>>(
  options: {
    /** 값 객체 이름 (toString에 사용). */
    name?: string;
    /** 커스텀 동등성 비교. 기본: 모든 속성 Object.is. */
    equals?: (a: T, b: T) => boolean;
    /** 생성 시 검증 함수. 실패하면 에러. */
    validate?: (props: T) => void;
  } = {},
): ValueObjectFactory<T> {
  const { name = "ValueObject", equals: customEquals, validate } = options;
  const tag = Symbol(name);

  function defaultEquals(a: T, b: T): boolean {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => Object.is(a[key], b[key]));
  }

  const eq = customEquals ?? defaultEquals;

  const factory = ((props: T): ValueObjectInstance<T> => {
    if (validate) validate(props);

    const data = { ...props };

    const instance: any = {
      ...data,
      [tag]: true,

      equals(other: unknown): boolean {
        if (other === instance) return true;
        if (!other || typeof other !== "object" || !(tag in (other as any))) return false;
        return eq(data, extractData(other as ValueObjectInstance<T>));
      },

      with(partial: Partial<T>): ValueObjectInstance<T> {
        return factory({ ...data, ...partial } as T);
      },

      toJSON(): T {
        return { ...data };
      },

      toString(): string {
        const entries = Object.entries(data)
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(", ");
        return `${name}(${entries})`;
      },
    };

    return Object.freeze(instance) as ValueObjectInstance<T>;
  }) as ValueObjectFactory<T>;

  factory.is = (value: unknown): value is ValueObjectInstance<T> => {
    return typeof value === "object" && value !== null && tag in (value as any);
  };

  function extractData(vo: ValueObjectInstance<T>): T {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(vo)) {
      if (typeof key === "string" && key !== "equals" && key !== "with" && key !== "toJSON" && key !== "toString") {
        result[key] = (vo as any)[key];
      }
    }
    return result as T;
  }

  return factory;
}
