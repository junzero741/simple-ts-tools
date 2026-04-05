/**
 * 네이티브 `Set`을 위한 집합 연산 유틸리티.
 * 배열 변환 없이 Set을 직접 다룰 수 있어 O(n) 순회와 O(1) 조회를 유지한다.
 *
 * 모든 함수는 **불변(non-destructive)** — 입력 Set을 수정하지 않고 새 Set을 반환한다.
 */

// ─── 이항 집합 연산 ────────────────────────────────────────────────────────────

/**
 * 두 Set의 합집합(union)을 반환한다.
 * 어느 한 쪽 이상에 속하는 모든 원소.
 *
 * @example
 * setUnion(new Set([1, 2, 3]), new Set([2, 3, 4]))
 * // Set { 1, 2, 3, 4 }
 *
 * @complexity Time: O(n + m) | Space: O(n + m)
 */
export function setUnion<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>(a);
  for (const item of b) result.add(item);
  return result;
}

/**
 * 두 Set의 교집합(intersection)을 반환한다.
 * 양쪽 모두에 속하는 원소.
 *
 * @example
 * setIntersection(new Set([1, 2, 3]), new Set([2, 3, 4]))
 * // Set { 2, 3 }
 *
 * @complexity Time: O(min(n, m)) | Space: O(min(n, m))
 */
export function setIntersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  // 작은 Set을 순회해 성능 최적화
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  const result = new Set<T>();
  for (const item of smaller) {
    if (larger.has(item)) result.add(item);
  }
  return result;
}

/**
 * 두 Set의 차집합(difference)을 반환한다.
 * `a`에는 있지만 `b`에는 없는 원소.
 *
 * @example
 * setDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))
 * // Set { 1 }
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function setDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (!b.has(item)) result.add(item);
  }
  return result;
}

/**
 * 두 Set의 대칭 차집합(symmetric difference)을 반환한다.
 * 한쪽에만 있는 원소 — `a ∪ b` 에서 `a ∩ b`를 제외한 것.
 *
 * @example
 * setSymmetricDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))
 * // Set { 1, 4 }
 *
 * @complexity Time: O(n + m) | Space: O(n + m)
 */
export function setSymmetricDifference<T>(
  a: ReadonlySet<T>,
  b: ReadonlySet<T>
): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (!b.has(item)) result.add(item);
  }
  for (const item of b) {
    if (!a.has(item)) result.add(item);
  }
  return result;
}

// ─── 집합 관계 검사 ────────────────────────────────────────────────────────────

/**
 * `a`가 `b`의 부분집합(subset)인지 확인한다.
 * `a`의 모든 원소가 `b`에 존재하면 true.
 *
 * @example
 * isSubset(new Set([1, 2]), new Set([1, 2, 3]))    // true
 * isSubset(new Set([1, 2, 3]), new Set([1, 2]))    // false
 * isSubset(new Set<number>(), new Set([1, 2]))     // true (공집합은 모든 집합의 부분집합)
 *
 * @complexity Time: O(n) | Space: O(1)
 */
export function isSubset<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size > b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/**
 * `a`가 `b`의 상위집합(superset)인지 확인한다.
 * `b`의 모든 원소가 `a`에 존재하면 true.
 *
 * @example
 * isSuperset(new Set([1, 2, 3]), new Set([1, 2]))  // true
 * isSuperset(new Set([1, 2]), new Set([1, 2, 3]))  // false
 *
 * @complexity Time: O(m) | Space: O(1)
 */
export function isSuperset<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  return isSubset(b, a);
}

/**
 * 두 Set이 서로소(disjoint)인지 확인한다.
 * 공통 원소가 없으면 true.
 *
 * @example
 * isDisjoint(new Set([1, 2]), new Set([3, 4]))  // true
 * isDisjoint(new Set([1, 2]), new Set([2, 3]))  // false
 *
 * @complexity Time: O(min(n, m)) | Space: O(1)
 */
export function isDisjoint<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) return false;
  }
  return true;
}

/**
 * 두 Set이 동일한지 확인한다.
 * 크기가 같고 `a`의 모든 원소가 `b`에 존재하면 true.
 *
 * @example
 * setEquals(new Set([1, 2, 3]), new Set([3, 1, 2]))  // true (순서 무관)
 * setEquals(new Set([1, 2]), new Set([1, 2, 3]))     // false
 *
 * @complexity Time: O(n) | Space: O(1)
 */
export function setEquals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

// ─── 다중 집합 연산 ────────────────────────────────────────────────────────────

/**
 * 여러 Set의 합집합을 반환한다.
 *
 * @example
 * setUnionAll([new Set([1, 2]), new Set([2, 3]), new Set([3, 4])])
 * // Set { 1, 2, 3, 4 }
 *
 * @complexity Time: O(n₁ + n₂ + ... + nₖ) | Space: O(합집합 크기)
 */
export function setUnionAll<T>(sets: ReadonlySet<T>[]): Set<T> {
  const result = new Set<T>();
  for (const s of sets) {
    for (const item of s) result.add(item);
  }
  return result;
}

/**
 * 여러 Set의 교집합을 반환한다.
 * 모든 Set에 공통으로 속하는 원소.
 *
 * @example
 * setIntersectionAll([new Set([1, 2, 3]), new Set([2, 3, 4]), new Set([3, 4, 5])])
 * // Set { 3 }
 *
 * @complexity Time: O(k · min(n)) | Space: O(min(n))
 */
export function setIntersectionAll<T>(sets: ReadonlySet<T>[]): Set<T> {
  if (sets.length === 0) return new Set<T>();
  if (sets.length === 1) return new Set<T>(sets[0]);

  // 가장 작은 Set을 기준으로 시작
  const sorted = [...sets].sort((a, b) => a.size - b.size);
  let result = new Set<T>(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    result = setIntersection(result, sorted[i]);
    if (result.size === 0) break; // 교집합이 공집합이면 조기 종료
  }

  return result;
}
