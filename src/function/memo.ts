/**
 * 의존성 기반 메모이제이션 (Dependency Memo).
 *
 * React `useMemo`의 범용 버전. 의존성 배열이 변경될 때만 재계산한다.
 * 기존 `memoize`가 인자 기반 캐시라면, 이건 외부 상태 변화에 반응하는 계산 캐시.
 *
 * @example
 * const expensive = createMemo(
 *   () => heavyComputation(data),
 *   () => [data.version], // 의존성
 * );
 *
 * expensive.value; // 계산 실행
 * expensive.value; // 캐시된 값 (data.version 미변경)
 *
 * data.version++;
 * expensive.value; // 재계산
 *
 * @example
 * // 다중 의존성
 * const filtered = createMemo(
 *   () => users.filter(u => u.role === role && u.age > minAge),
 *   () => [users, role, minAge],
 * );
 *
 * @example
 * // computed — 간단한 파생 값
 * const fullName = computed(() => `${first} ${last}`);
 * fullName.value; // "John Doe"
 *
 * @complexity Time: O(k) 의존성 비교, k = 의존성 수. Space: O(1) 캐시.
 */

export interface Memo<T> {
  /** 캐시된 값. 의존성 변경 시 재계산. */
  readonly value: T;

  /** 캐시를 강제 무효화한다. 다음 접근 시 재계산. */
  invalidate(): void;

  /** 마지막 계산 시점의 의존성 값. */
  readonly deps: readonly unknown[];
}

/**
 * 의존성 기반 메모를 생성한다.
 * @param factory 값을 계산하는 함수
 * @param getDeps 의존성 배열을 반환하는 함수
 * @param equals 의존성 비교 함수 (기본: Object.is)
 */
export function createMemo<T>(
  factory: () => T,
  getDeps: () => unknown[],
  equals: (a: unknown, b: unknown) => boolean = Object.is,
): Memo<T> {
  let cachedValue: T;
  let cachedDeps: unknown[] | undefined;
  let valid = false;

  function depsChanged(newDeps: unknown[]): boolean {
    if (!cachedDeps) return true;
    if (cachedDeps.length !== newDeps.length) return true;
    for (let i = 0; i < newDeps.length; i++) {
      if (!equals(cachedDeps[i], newDeps[i])) return true;
    }
    return false;
  }

  const memo: Memo<T> = {
    get value(): T {
      const newDeps = getDeps();
      if (!valid || depsChanged(newDeps)) {
        cachedValue = factory();
        cachedDeps = [...newDeps];
        valid = true;
      }
      return cachedValue;
    },

    invalidate(): void {
      valid = false;
    },

    get deps(): readonly unknown[] {
      return cachedDeps ?? [];
    },
  };

  return memo;
}

/**
 * 간단한 파생 값. 매 접근마다 재계산하되, 결과가 같으면 이전 참조를 유지한다.
 * 의존성을 명시하지 않아도 되는 경우에 사용.
 */
export function computed<T>(
  fn: () => T,
  equals: (a: T, b: T) => boolean = Object.is,
): { readonly value: T } {
  let cached: T | undefined;
  let initialized = false;

  return {
    get value(): T {
      const next = fn();
      if (!initialized || !equals(cached as T, next)) {
        cached = next;
        initialized = true;
      }
      return cached as T;
    },
  };
}
