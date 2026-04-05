/**
 * 확장 유한 상태 머신 (Extended FSM).
 *
 * 기본 createStateMachine에 context(확장 상태), guard 조건,
 * onEntry/onExit 훅, effect(부수 효과), assign(context 업데이트)를 추가.
 *
 * XState의 핵심 패턴을 경량으로 구현. 복잡한 비즈니스 로직,
 * 폼 워크플로우, 프로토콜 구현에 적합하다.
 *
 * @example
 * const machine = createFSM({
 *   initial: "idle",
 *   context: { retries: 0, data: null as string | null },
 *   states: {
 *     idle: {
 *       on: {
 *         FETCH: { target: "loading", assign: (ctx) => ({ ...ctx, retries: 0 }) },
 *       },
 *     },
 *     loading: {
 *       onEntry: (ctx) => console.log("loading started"),
 *       on: {
 *         SUCCESS: { target: "done", assign: (ctx, data) => ({ ...ctx, data }) },
 *         FAILURE: [
 *           { target: "loading", guard: (ctx) => ctx.retries < 3,
 *             assign: (ctx) => ({ ...ctx, retries: ctx.retries + 1 }) },
 *           { target: "error" },
 *         ],
 *       },
 *     },
 *     done: {},
 *     error: {
 *       on: { RETRY: { target: "loading" } },
 *     },
 *   },
 * });
 *
 * machine.send("FETCH");
 * machine.state;    // "loading"
 * machine.context;  // { retries: 0, data: null }
 *
 * @complexity Time: O(t) per send, t = 해당 이벤트의 전이 후보 수.
 */

export interface Transition<TContext, TEvent extends string> {
  target: string;
  guard?: (context: TContext, payload?: unknown) => boolean;
  assign?: (context: TContext, payload?: unknown) => TContext;
  effect?: (context: TContext, payload?: unknown) => void;
}

export interface StateConfig<TContext, TEvent extends string> {
  on?: Record<string, Transition<TContext, TEvent> | Array<Transition<TContext, TEvent>>>;
  onEntry?: (context: TContext) => void;
  onExit?: (context: TContext) => void;
}

export interface FSMConfig<
  TState extends string,
  TEvent extends string,
  TContext,
> {
  initial: TState;
  context: TContext;
  states: Record<TState, StateConfig<TContext, TEvent>>;
}

export interface FSM<TState extends string, TEvent extends string, TContext> {
  readonly state: TState;
  readonly context: TContext;
  send(event: TEvent, payload?: unknown): boolean;
  can(event: TEvent, payload?: unknown): boolean;
  matches(state: TState): boolean;
  subscribe(handler: (state: TState, context: TContext, event: TEvent | null) => void): () => void;
  reset(): void;
}

export function createFSM<
  TState extends string,
  TEvent extends string,
  TContext,
>(config: FSMConfig<TState, TEvent, TContext>): FSM<TState, TEvent, TContext> {
  let currentState = config.initial;
  let currentContext = { ...config.context };
  const handlers = new Set<(state: TState, context: TContext, event: TEvent | null) => void>();

  function notify(event: TEvent | null): void {
    for (const h of handlers) h(currentState, currentContext, event);
  }

  function findTransition(
    event: TEvent,
    payload?: unknown,
  ): Transition<TContext, TEvent> | undefined {
    const stateConfig = config.states[currentState];
    if (!stateConfig?.on) return undefined;

    const transitions = stateConfig.on[event];
    if (!transitions) return undefined;

    if (Array.isArray(transitions)) {
      return transitions.find(
        (t) => !t.guard || t.guard(currentContext, payload),
      );
    }

    const t = transitions as Transition<TContext, TEvent>;
    if (t.guard && !t.guard(currentContext, payload)) return undefined;
    return t;
  }

  // onEntry for initial state
  const initialStateConfig = config.states[config.initial];
  if (initialStateConfig?.onEntry) {
    initialStateConfig.onEntry(currentContext);
  }

  const fsm: FSM<TState, TEvent, TContext> = {
    get state() { return currentState; },
    get context() { return currentContext; },

    send(event: TEvent, payload?: unknown): boolean {
      const transition = findTransition(event, payload);
      if (!transition) return false;

      const prevState = currentState;
      const nextState = transition.target as TState;

      // onExit
      if (prevState !== nextState) {
        const exitConfig = config.states[prevState];
        if (exitConfig?.onExit) exitConfig.onExit(currentContext);
      }

      // assign
      if (transition.assign) {
        currentContext = transition.assign(currentContext, payload);
      }

      currentState = nextState;

      // onEntry
      if (prevState !== nextState) {
        const entryConfig = config.states[nextState];
        if (entryConfig?.onEntry) entryConfig.onEntry(currentContext);
      }

      // effect
      if (transition.effect) {
        transition.effect(currentContext, payload);
      }

      notify(event);
      return true;
    },

    can(event: TEvent, payload?: unknown): boolean {
      return findTransition(event, payload) !== undefined;
    },

    matches(state: TState): boolean {
      return currentState === state;
    },

    subscribe(handler) {
      handlers.add(handler);
      handler(currentState, currentContext, null);
      return () => handlers.delete(handler);
    },

    reset(): void {
      currentState = config.initial;
      currentContext = { ...config.context };
      notify(null);
    },
  };

  return fsm;
}
