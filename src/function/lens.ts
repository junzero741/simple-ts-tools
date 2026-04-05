/**
 * 함수형 렌즈 (Functional Lens).
 *
 * 불변 데이터 구조의 깊은 경로를 타입 안전하게 읽기/수정한다.
 * getter와 setter를 하나로 합쳐, 중첩 객체를 불변으로 업데이트할 때
 * 스프레드 지옥을 방지한다.
 *
 * @example
 * // 기본 사용
 * const nameLens = lens<User, string>(
 *   (user) => user.name,
 *   (user, name) => ({ ...user, name }),
 * );
 *
 * const user = { name: "alice", age: 30 };
 * view(nameLens, user);               // "alice"
 * set(nameLens, user, "bob");          // { name: "bob", age: 30 }
 * over(nameLens, user, s => s.toUpperCase()); // { name: "ALICE", age: 30 }
 *
 * @example
 * // prop — 객체 프로퍼티 렌즈 (자동 생성)
 * const ageLens = prop<User>()("age");
 * set(ageLens, user, 31); // { name: "alice", age: 31 }
 *
 * @example
 * // compose — 렌즈 합성으로 깊은 경로 접근
 * type State = { user: { address: { city: string } } };
 * const userLens = prop<State>()("user");
 * const addressLens = prop<State["user"]>()("address");
 * const cityLens = prop<State["user"]["address"]>()("city");
 *
 * const deepCityLens = composeLens(userLens, addressLens, cityLens);
 * view(deepCityLens, state);              // "Seoul"
 * set(deepCityLens, state, "Busan");      // 깊은 불변 업데이트
 *
 * @complexity Time: O(depth) per operation. Space: O(depth) 새 객체 생성.
 */

export interface Lens<S, A> {
  get: (source: S) => A;
  set: (source: S, value: A) => S;
}

/** 렌즈를 생성한다. */
export function lens<S, A>(
  get: (source: S) => A,
  set: (source: S, value: A) => S,
): Lens<S, A> {
  return { get, set };
}

/** 렌즈를 통해 값을 읽는다. */
export function view<S, A>(l: Lens<S, A>, source: S): A {
  return l.get(source);
}

/** 렌즈를 통해 값을 설정한다 (불변). */
export function set<S, A>(l: Lens<S, A>, source: S, value: A): S {
  return l.set(source, value);
}

/** 렌즈를 통해 값을 변환한다 (불변). */
export function over<S, A>(l: Lens<S, A>, source: S, fn: (value: A) => A): S {
  return l.set(source, fn(l.get(source)));
}

/** 객체 프로퍼티에 대한 렌즈를 자동 생성한다. */
export function prop<S>() {
  return <K extends keyof S>(key: K): Lens<S, S[K]> =>
    lens(
      (source) => source[key],
      (source, value) => ({ ...source, [key]: value }),
    );
}

/** 두 렌즈를 합성한다. 바깥 → 안쪽 순서. */
export function composeLens<A, B, C>(outer: Lens<A, B>, inner: Lens<B, C>): Lens<A, C>;
export function composeLens<A, B, C, D>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>): Lens<A, D>;
export function composeLens<A, B, C, D, E>(l1: Lens<A, B>, l2: Lens<B, C>, l3: Lens<C, D>, l4: Lens<D, E>): Lens<A, E>;
export function composeLens(...lenses: Lens<any, any>[]): Lens<any, any> {
  return lenses.reduce((outer, inner) =>
    lens(
      (source) => inner.get(outer.get(source)),
      (source, value) => outer.set(source, inner.set(outer.get(source), value)),
    ),
  );
}
