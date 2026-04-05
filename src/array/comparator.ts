/**
 * 선언적 정렬 비교기 빌더 (Comparator Builder).
 *
 * 다중 키, 오름차순/내림차순, null 우선순위 등 복잡한 정렬 로직을
 * 체이닝으로 표현한다. `Array.prototype.sort()`에 바로 전달 가능.
 *
 * @example
 * // 단일 키 정렬
 * const byAge = comparing<User>(u => u.age);
 * users.sort(byAge);
 *
 * @example
 * // 다중 키: 부서 오름차순 → 나이 내림차순
 * const cmp = comparing<User>(u => u.dept)
 *   .thenBy(u => u.age, "desc");
 * users.sort(cmp);
 *
 * @example
 * // null 처리: null을 맨 뒤로
 * const cmp = comparing<Item>(i => i.price, { nulls: "last" });
 * items.sort(cmp);
 *
 * @example
 * // 커스텀 비교: 문자열 대소문자 무시
 * const cmp = comparing<User>(u => u.name.toLowerCase());
 *
 * @complexity Time: O(k) per comparison, k = 비교기 체인 길이.
 */

export type Direction = "asc" | "desc";
export type NullsPosition = "first" | "last";

export interface CompareOptions {
  direction?: Direction;
  nulls?: NullsPosition;
}

export interface Comparator<T> {
  (a: T, b: T): number;

  /** 추가 정렬 기준을 체이닝한다. 이전 기준이 동일할 때 이 기준으로 비교. */
  thenBy<K>(
    keyFn: (item: T) => K,
    directionOrOptions?: Direction | CompareOptions,
  ): Comparator<T>;

  /** 정렬 방향을 반전시킨다 (전체 체인). */
  reversed(): Comparator<T>;
}

function defaultCompare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function resolveOptions(directionOrOptions?: Direction | CompareOptions): CompareOptions {
  if (typeof directionOrOptions === "string") return { direction: directionOrOptions };
  return directionOrOptions ?? {};
}

function buildSingleComparator<T, K>(
  keyFn: (item: T) => K,
  options: CompareOptions,
): (a: T, b: T) => number {
  const { direction = "asc", nulls } = options;
  const mult = direction === "desc" ? -1 : 1;

  return (a: T, b: T): number => {
    const ka = keyFn(a);
    const kb = keyFn(b);

    const aIsNull = ka === null || ka === undefined;
    const bIsNull = kb === null || kb === undefined;

    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return nulls === "first" ? -1 : nulls === "last" ? 1 : -1 * mult;
    if (bIsNull) return nulls === "first" ? 1 : nulls === "last" ? -1 : 1 * mult;

    return defaultCompare(ka, kb) * mult;
  };
}

function createComparator<T>(
  comparators: Array<(a: T, b: T) => number>,
): Comparator<T> {
  const cmp = ((a: T, b: T): number => {
    for (const c of comparators) {
      const result = c(a, b);
      if (result !== 0) return result;
    }
    return 0;
  }) as Comparator<T>;

  cmp.thenBy = <K>(
    keyFn: (item: T) => K,
    directionOrOptions?: Direction | CompareOptions,
  ): Comparator<T> => {
    const opts = resolveOptions(directionOrOptions);
    return createComparator([...comparators, buildSingleComparator(keyFn, opts)]);
  };

  cmp.reversed = (): Comparator<T> => {
    const reversedComparators = comparators.map(
      (c) => (a: T, b: T) => -c(a, b),
    );
    return createComparator(reversedComparators);
  };

  return cmp;
}

/**
 * 비교기를 생성한다. `Array.prototype.sort()`에 바로 전달 가능.
 */
export function comparing<T, K = unknown>(
  keyFn: (item: T) => K,
  directionOrOptions?: Direction | CompareOptions,
): Comparator<T> {
  const opts = resolveOptions(directionOrOptions);
  return createComparator([buildSingleComparator(keyFn, opts)]);
}

/**
 * 자연 순서(natural order) 비교기. 원시 값 배열의 정렬에 사용.
 */
export function naturalOrder<T>(): Comparator<T> {
  return createComparator([(a: T, b: T) => defaultCompare(a, b)]);
}

/**
 * 역순(reverse order) 비교기.
 */
export function reverseOrder<T>(): Comparator<T> {
  return createComparator([(a: T, b: T) => -defaultCompare(a, b)]);
}
