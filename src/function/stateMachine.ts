export interface StateMachineConfig<
  S extends string,
  E extends string
> {
  /** 초기 상태 */
  initial: S;
  /**
   * 상태별 전이 맵.
   * `transitions[현재상태][이벤트] = 다음상태`
   */
  transitions: Partial<Record<S, Partial<Record<E, S>>>>;
}

export interface StateMachine<S extends string, E extends string> {
  /** 현재 상태. */
  readonly state: S;
  /**
   * 이벤트를 보내 상태를 전이한다.
   * 현재 상태에서 해당 이벤트가 정의된 경우에만 전이하고 `true`를 반환.
   * 허용되지 않은 이벤트는 무시하고 `false` 반환 (throw 없음).
   */
  send(event: E): boolean;
  /**
   * 현재 상태에서 이벤트가 유효한지(전이가 정의됐는지) 확인한다.
   */
  can(event: E): boolean;
  /**
   * 상태 변경 시 호출되는 구독 핸들러를 등록한다.
   * 등록 즉시 현재 상태를 전달한다 (BehaviorSubject 패턴).
   * @returns 구독 해제 함수
   */
  subscribe(handler: (state: S, event: E | null) => void): () => void;
  /**
   * 초기 상태로 되돌린다. 구독자에게 알린다.
   */
  reset(): void;
}

/**
 * 타입 안전 유한 상태 기계(Finite State Machine)를 생성한다.
 *
 * 각 상태에서 허용된 이벤트만 처리하며, 허용되지 않은 이벤트는 조용히 무시된다.
 * `BehaviorSubject`와 달리 어떤 값으로도 갱신할 수 없고 오직 **정의된 전이**만 가능하다.
 *
 * @example
 * // 비동기 데이터 로딩 상태 관리
 * const loader = createStateMachine({
 *   initial: "idle",
 *   transitions: {
 *     idle:    { FETCH: "loading" },
 *     loading: { RESOLVE: "success", REJECT: "error" },
 *     success: { RESET: "idle" },
 *     error:   { RETRY: "loading", RESET: "idle" },
 *   },
 * });
 *
 * loader.state;          // "idle"
 * loader.send("FETCH");  // true  → "loading"
 * loader.send("RESET");  // false → 현재 상태(loading)에서 RESET은 미정의, 무시됨
 * loader.can("RESOLVE"); // true
 *
 * @example
 * // 다단계 폼 스텝
 * const form = createStateMachine({
 *   initial: "step1",
 *   transitions: {
 *     step1: { NEXT: "step2" },
 *     step2: { NEXT: "step3", BACK: "step1" },
 *     step3: { BACK: "step2", SUBMIT: "done" },
 *     done:  {},
 *   },
 * });
 */
export function createStateMachine<S extends string, E extends string>(
  config: StateMachineConfig<S, E>
): StateMachine<S, E> {
  let current: S = config.initial;
  const handlers = new Set<(state: S, event: E | null) => void>();

  function notify(state: S, event: E | null) {
    for (const h of handlers) h(state, event);
  }

  return {
    get state() {
      return current;
    },

    send(event: E): boolean {
      const next = config.transitions[current]?.[event];
      if (next === undefined) return false;
      current = next;
      notify(current, event);
      return true;
    },

    can(event: E): boolean {
      return config.transitions[current]?.[event] !== undefined;
    },

    subscribe(handler: (state: S, event: E | null) => void): () => void {
      handlers.add(handler);
      handler(current, null); // 즉시 현재 상태 전달
      return () => handlers.delete(handler);
    },

    reset(): void {
      current = config.initial;
      notify(current, null);
    },
  };
}
