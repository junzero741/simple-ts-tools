/**
 * 경량 반응형 상태 스토어.
 *
 * ## BehaviorSubject와의 차이
 * - `BehaviorSubject<T>` — 단일 값을 보유하고, 값이 바뀔 때마다 모든 구독자에게 알림
 * - `createStore<T>` — **구조화된 객체 상태** + `select()`로 특정 슬라이스만 구독
 *   (선택한 슬라이스가 바뀌지 않으면 알림이 전달되지 않음)
 *
 * ## 핵심 설계
 * - `set(partial)` — Partial 병합 업데이트 (React `setState`와 동일)
 * - `replace(state)` — 전체 교체
 * - `select(selector)` — 파생 뷰. selector 반환값이 변경될 때만 구독자 호출
 * - 기본 동등 비교: `Object.is` (원시값). 객체 슬라이스는 `equals` 옵션으로 교체 가능
 *
 * @example
 * // 타입 안전 스토어 생성
 * interface AppState {
 *   user: { name: string; role: "admin" | "user" } | null;
 *   theme: "light" | "dark";
 *   notifications: number;
 * }
 *
 * const store = createStore<AppState>({
 *   user: null,
 *   theme: "light",
 *   notifications: 0,
 * });
 *
 * // 전체 상태 구독
 * store.subscribe(state => console.log(state));
 *
 * // 특정 슬라이스만 구독 — notifications가 바뀔 때만 호출됨
 * const badge = store.select(s => s.notifications);
 * badge.subscribe(count => updateBadge(count));
 *
 * // 상태 업데이트
 * store.set({ notifications: 3 });   // 병합
 * store.set({ theme: "dark" });       // user/notifications 유지
 *
 * // 파생 계산
 * const isAdmin = store.select(s => s.user?.role === "admin");
 */

export interface SelectOptions<S> {
  /**
   * selector 반환값의 동등 비교 함수.
   * @default Object.is (원시값·참조 동등)
   */
  equals?: (prev: S, next: S) => boolean;
}

export interface Selected<S> {
  /** 현재 파생 값을 동기적으로 반환한다. */
  get(): S;
  /**
   * 파생 값이 변경될 때 호출되는 구독을 등록한다.
   * 등록 즉시 현재 값으로 호출된다.
   * @returns 구독 해제 함수
   */
  subscribe(listener: (value: S) => void): () => void;
}

export interface Store<T extends object> {
  /** 현재 상태를 동기적으로 반환한다. */
  get(): T;

  /**
   * 현재 상태에 `partial`을 얕게 병합한다.
   * 변경이 없으면 (각 키가 `Object.is`로 동등) 구독자에게 알리지 않는다.
   */
  set(partial: Partial<T>): void;

  /** 상태 전체를 교체한다. */
  replace(state: T): void;

  /**
   * 현재 상태를 받아 업데이트할 partial을 반환하는 함수로 상태를 수정한다.
   * @example store.update(s => ({ count: s.count + 1 }))
   */
  update(fn: (state: T) => Partial<T>): void;

  /**
   * 상태 전체가 바뀔 때마다 호출되는 구독을 등록한다.
   * 등록 즉시 현재 상태로 호출된다.
   * @returns 구독 해제 함수
   */
  subscribe(listener: (state: T) => void): () => void;

  /**
   * 상태의 특정 슬라이스만 구독하는 파생 뷰를 반환한다.
   * selector 반환값이 변경될 때만 listener가 호출된다.
   *
   * @example
   * const userRole = store.select(s => s.user?.role);
   * userRole.subscribe(role => console.log(role));
   */
  select<S>(selector: (state: T) => S, options?: SelectOptions<S>): Selected<S>;

  /** 초기 상태로 리셋하고 구독자에게 알린다. */
  reset(): void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state: T = { ...initialState };
  const listeners = new Set<(state: T) => void>();

  function notify(): void {
    for (const listener of listeners) {
      listener(state);
    }
  }

  const store: Store<T> = {
    get(): T {
      return state;
    },

    set(partial: Partial<T>): void {
      let changed = false;
      for (const key of Object.keys(partial) as Array<keyof T>) {
        if (!Object.is(state[key], partial[key as keyof Partial<T>])) {
          changed = true;
          break;
        }
      }
      if (!changed) return;

      state = { ...state, ...partial };
      notify();
    },

    replace(newState: T): void {
      state = { ...newState };
      notify();
    },

    update(fn: (state: T) => Partial<T>): void {
      store.set(fn(state));
    },

    subscribe(listener: (state: T) => void): () => void {
      listeners.add(listener);
      listener(state); // 즉시 현재 상태 전달
      return () => { listeners.delete(listener); };
    },

    select<S>(selector: (state: T) => S, options: SelectOptions<S> = {}): Selected<S> {
      const equals = options.equals ?? Object.is;
      const sliceListeners = new Set<(value: S) => void>();
      let prevSlice: S = selector(state);
      let storeUnsub: (() => void) | null = null;

      const storeHandler = () => {
        const next = selector(state);
        if (equals(prevSlice, next)) return;
        prevSlice = next;
        for (const l of sliceListeners) l(next);
      };

      return {
        get(): S {
          return selector(state);
        },
        subscribe(listener: (value: S) => void): () => void {
          // 첫 번째 slice 구독자가 생길 때 store 핸들러를 lazy 등록
          if (sliceListeners.size === 0) {
            prevSlice = selector(state);
            listeners.add(storeHandler);
            storeUnsub = () => { listeners.delete(storeHandler); };
          }
          sliceListeners.add(listener);
          listener(selector(state));
          return () => {
            sliceListeners.delete(listener);
            if (sliceListeners.size === 0 && storeUnsub) {
              storeUnsub();
              storeUnsub = null;
            }
          };
        },
      };
    },

    reset(): void {
      state = { ...initialState };
      notify();
    },
  };

  return store;
}
