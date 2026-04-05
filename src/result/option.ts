// Option 모나드 — 값의 유무를 타입 안전하게 표현.
//
// null/undefined 체크 체이닝 지옥을 해소한다.
// Rust의 Option<T>에서 영감. map/flatMap/filter/unwrap 등을 지원.
//
// some(42).map(n => n * 2).unwrapOr(0)  // 84
// none<number>().map(n => n * 2).unwrapOr(0)  // 0
//
// fromNullable(user?.address?.city)
//   .map(city => city.toUpperCase())
//   .unwrapOr("UNKNOWN")

export interface Option<T> {
  readonly isSome: boolean;
  readonly isNone: boolean;

  /** 값이 있으면 변환한다. */
  map<U>(fn: (value: T) => U): Option<U>;

  /** 값이 있으면 Option을 반환하는 함수를 적용한다 (flat map). */
  flatMap<U>(fn: (value: T) => Option<U>): Option<U>;

  /** 조건을 만족하지 않으면 None으로 변환한다. */
  filter(predicate: (value: T) => boolean): Option<T>;

  /** 값을 반환한다. None이면 에러. */
  unwrap(): T;

  /** 값을 반환한다. None이면 기본값. */
  unwrapOr(defaultValue: T): T;

  /** 값을 반환한다. None이면 함수를 실행하여 기본값. */
  unwrapOrElse(fn: () => T): T;

  /** None이면 대체 Option을 반환한다. */
  or(other: Option<T>): Option<T>;

  /** None이면 함수를 실행하여 대체 Option. */
  orElse(fn: () => Option<T>): Option<T>;

  /** Some이면 다른 Option을 반환한다. */
  and<U>(other: Option<U>): Option<U>;

  /** 패턴 매칭. */
  match<U>(cases: { some: (value: T) => U; none: () => U }): U;

  /** Some이면 부수 효과를 실행한다. */
  tap(fn: (value: T) => void): Option<T>;

  /** T | undefined로 변환한다. */
  toNullable(): T | undefined;

  /** 두 Option을 합친다. */
  zip<U>(other: Option<U>): Option<[T, U]>;
}

class SomeImpl<T> implements Option<T> {
  readonly isSome = true;
  readonly isNone = false;

  constructor(private readonly value: T) {}

  map<U>(fn: (value: T) => U): Option<U> { return some(fn(this.value)); }
  flatMap<U>(fn: (value: T) => Option<U>): Option<U> { return fn(this.value); }
  filter(predicate: (value: T) => boolean): Option<T> { return predicate(this.value) ? this : none(); }
  unwrap(): T { return this.value; }
  unwrapOr(_defaultValue: T): T { return this.value; }
  unwrapOrElse(_fn: () => T): T { return this.value; }
  or(_other: Option<T>): Option<T> { return this; }
  orElse(_fn: () => Option<T>): Option<T> { return this; }
  and<U>(other: Option<U>): Option<U> { return other; }
  match<U>(cases: { some: (value: T) => U; none: () => U }): U { return cases.some(this.value); }
  tap(fn: (value: T) => void): Option<T> { fn(this.value); return this; }
  toNullable(): T | undefined { return this.value; }
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.isSome ? some([this.value, other.unwrap()] as [T, U]) : none();
  }
}

class NoneImpl<T> implements Option<T> {
  readonly isSome = false;
  readonly isNone = true;

  map<U>(_fn: (value: T) => U): Option<U> { return none(); }
  flatMap<U>(_fn: (value: T) => Option<U>): Option<U> { return none(); }
  filter(_predicate: (value: T) => boolean): Option<T> { return this; }
  unwrap(): T { throw new Error("Called unwrap on None"); }
  unwrapOr(defaultValue: T): T { return defaultValue; }
  unwrapOrElse(fn: () => T): T { return fn(); }
  or(other: Option<T>): Option<T> { return other; }
  orElse(fn: () => Option<T>): Option<T> { return fn(); }
  and<U>(_other: Option<U>): Option<U> { return none(); }
  match<U>(cases: { some: (value: T) => U; none: () => U }): U { return cases.none(); }
  tap(_fn: (value: T) => void): Option<T> { return this; }
  toNullable(): T | undefined { return undefined; }
  zip<U>(_other: Option<U>): Option<[T, U]> { return none(); }
}

const NONE = new NoneImpl<never>();

/** 값이 있는 Option을 생성한다. */
export function some<T>(value: T): Option<T> {
  return new SomeImpl(value);
}

/** 값이 없는 Option을 생성한다. */
export function none<T = never>(): Option<T> {
  return NONE as Option<T>;
}

/** null/undefined면 None, 아니면 Some. */
export function fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>> {
  return value === null || value === undefined ? none() : some(value as NonNullable<T>);
}

/** 함수 실행 결과를 Option으로 감싼다. 예외 발생 시 None. */
export function tryOption<T>(fn: () => T): Option<T> {
  try {
    return some(fn());
  } catch {
    return none();
  }
}

/** 여러 Option 중 첫 Some을 반환한다. */
export function firstSome<T>(...options: Option<T>[]): Option<T> {
  for (const opt of options) {
    if (opt.isSome) return opt;
  }
  return none();
}

/** 모든 Option이 Some이면 값 배열을 반환한다. 하나라도 None이면 None. */
export function allSome<T>(options: Option<T>[]): Option<T[]> {
  const values: T[] = [];
  for (const opt of options) {
    if (opt.isNone) return none();
    values.push(opt.unwrap());
  }
  return some(values);
}
