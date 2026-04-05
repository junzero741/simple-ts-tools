/**
 * 네임스페이스 이벤트 버스 (Event Bus).
 *
 * TypedEventEmitter와 달리 문자열 기반 네임스페이스 이벤트를 지원한다.
 * 와일드카드 구독(`"user.*"`), `waitFor` (Promise 기반 이벤트 대기),
 * 히스토리 조회를 제공한다.
 *
 * @example
 * const bus = createEventBus();
 *
 * // 정확한 이벤트 구독
 * bus.on("user.login", (data) => console.log(data));
 *
 * // 와일드카드 구독 — "user."로 시작하는 모든 이벤트
 * bus.on("user.*", (data, event) => console.log(event, data));
 *
 * // 전체 이벤트 구독
 * bus.on("*", (data, event) => audit(event, data));
 *
 * bus.emit("user.login", { userId: "u1" });
 * bus.emit("user.logout", { userId: "u1" });
 *
 * @example
 * // waitFor — 이벤트를 Promise로 대기
 * const data = await bus.waitFor("order.completed");
 *
 * // 타임아웃 포함
 * const data = await bus.waitFor("order.completed", { timeout: 5000 });
 *
 * @complexity Time: O(n) per emit, n = 매칭 리스너 수. Space: O(n) 리스너 + 히스토리.
 */

export interface EventBusOptions {
  /** 히스토리 최대 크기. 0이면 비활성화. (기본값: 0) */
  historySize?: number;
}

export interface EventRecord {
  event: string;
  data: unknown;
  timestamp: number;
}

export interface WaitForOptions {
  /** 타임아웃 ms. 초과 시 에러. */
  timeout?: number;
  /** 조건 함수. true를 반환하는 이벤트만 매칭. */
  filter?: (data: unknown) => boolean;
}

type Handler = (data: unknown, event: string) => void;

export interface EventBus {
  /** 이벤트 리스너를 등록한다. 와일드카드(`*`) 지원. 해제 함수 반환. */
  on(event: string, handler: Handler): () => void;

  /** 한 번만 실행되는 리스너를 등록한다. */
  once(event: string, handler: Handler): () => void;

  /** 이벤트를 발행한다. */
  emit(event: string, data?: unknown): void;

  /** 이벤트를 Promise로 대기한다. */
  waitFor(event: string, options?: WaitForOptions): Promise<unknown>;

  /** 특정 이벤트의 리스너를 모두 제거한다. 인자 없으면 전체 제거. */
  clear(event?: string): void;

  /** 이벤트 히스토리를 반환한다. */
  readonly history: readonly EventRecord[];

  /** 등록된 리스너 수 (와일드카드 포함). */
  readonly listenerCount: number;
}

function matchEvent(pattern: string, event: string): boolean {
  if (pattern === "*") return true;
  if (pattern === event) return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return event === prefix || event.startsWith(prefix + ".");
  }
  return false;
}

export function createEventBus(options: EventBusOptions = {}): EventBus {
  const { historySize = 0 } = options;

  const listeners = new Map<string, Set<Handler>>();
  const eventHistory: EventRecord[] = [];

  function getOrCreateSet(event: string): Set<Handler> {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  const bus: EventBus = {
    on(event, handler) {
      const set = getOrCreateSet(event);
      set.add(handler);
      return () => { set.delete(handler); };
    },

    once(event, handler) {
      const wrapper: Handler = (data, ev) => {
        off();
        handler(data, ev);
      };
      const off = bus.on(event, wrapper);
      return off;
    },

    emit(event, data) {
      if (historySize > 0) {
        eventHistory.push({ event, data, timestamp: Date.now() });
        if (eventHistory.length > historySize) {
          eventHistory.shift();
        }
      }

      for (const [pattern, handlers] of listeners) {
        if (matchEvent(pattern, event)) {
          for (const handler of handlers) {
            handler(data, event);
          }
        }
      }
    },

    waitFor(event, waitOpts = {}) {
      const { timeout, filter } = waitOpts;

      return new Promise<unknown>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const off = bus.on(event, (data, ev) => {
          if (filter && !filter(data)) return;
          off();
          if (timer !== undefined) clearTimeout(timer);
          resolve(data);
        });

        if (timeout !== undefined) {
          timer = setTimeout(() => {
            off();
            reject(new Error(`waitFor("${event}") timed out after ${timeout}ms`));
          }, timeout);
        }
      });
    },

    clear(event?) {
      if (event === undefined) {
        listeners.clear();
      } else {
        listeners.delete(event);
      }
    },

    get history() {
      return eventHistory;
    },

    get listenerCount() {
      let count = 0;
      for (const set of listeners.values()) {
        count += set.size;
      }
      return count;
    },
  };

  return bus;
}
