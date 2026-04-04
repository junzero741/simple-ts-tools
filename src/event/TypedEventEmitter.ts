/**
 * 이벤트 이름과 페이로드 타입이 컴파일 타임에 검증되는 pub/sub 이벤트 이미터.
 *
 * @example
 * type Events = {
 *   login:  { userId: string; timestamp: number };
 *   logout: { userId: string };
 *   error:  Error;
 * };
 *
 * const emitter = new TypedEventEmitter<Events>();
 * emitter.on("login", ({ userId }) => console.log(userId)); // 타입 추론됨
 * emitter.emit("login", { userId: "u1", timestamp: Date.now() });
 * emitter.off("login", handler);
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventMap = Record<string, any>;

type Handler<T> = (payload: T) => void;

export class TypedEventEmitter<TEvents extends EventMap> {
  private readonly listeners = new Map<
    keyof TEvents,
    Set<Handler<TEvents[keyof TEvents]>>
  >();

  /** 이벤트 핸들러를 등록한다. */
  on<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as Handler<TEvents[keyof TEvents]>);
    return this;
  }

  /** 한 번만 실행되는 핸들러를 등록한다. */
  once<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): this {
    const wrapper: Handler<TEvents[K]> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /** 이벤트 핸들러를 제거한다. */
  off<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): this {
    this.listeners.get(event)?.delete(
      handler as Handler<TEvents[keyof TEvents]>
    );
    return this;
  }

  /** 이벤트를 발행하고 등록된 모든 핸들러를 동기적으로 실행한다. */
  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): this {
    this.listeners.get(event)?.forEach((handler) => handler(payload));
    return this;
  }

  /** 특정 이벤트의 모든 핸들러를 제거한다. 인자 없이 호출하면 전체 제거. */
  clear<K extends keyof TEvents>(event?: K): this {
    if (event === undefined) {
      this.listeners.clear();
    } else {
      this.listeners.delete(event);
    }
    return this;
  }

  /** 특정 이벤트에 등록된 핸들러 수를 반환한다. */
  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
