// 깊은 변경 감지 프록시 (Watchable).
//
// 객체의 모든 레벨에서 set/delete 변경을 감지하고 콜백을 실행한다.
// Vue reactivity, MobX observable의 핵심 패턴을 Proxy로 경량 구현.
//
// const state = watchable({ user: { name: "Alice", age: 30 } });
//
// state.watch((path, value, prev) => {
//   console.log(`${path.join(".")} changed: ${prev} → ${value}`);
// });
//
// state.proxy.user.name = "Bob";
// // "user.name changed: Alice → Bob"
//
// state.proxy.user.age++;
// // "user.age changed: 30 → 31"

export interface WatchEvent {
  path: string[];
  value: unknown;
  prev: unknown;
  type: "set" | "delete";
}

export type WatchHandler = (event: WatchEvent) => void;

export interface Watchable<T extends object> {
  /** 변경이 감지되는 프록시 객체. */
  readonly proxy: T;

  /** 변경 콜백을 등록한다. 해제 함수 반환. */
  watch(handler: WatchHandler): () => void;

  /** 특정 경로의 변경만 구독한다. */
  watchPath(path: string, handler: WatchHandler): () => void;

  /** 변경 감지를 일시 중지하고 fn을 실행한다. 일괄 변경에 유용. */
  batch(fn: (target: T) => void): void;

  /** 현재 상태의 스냅샷을 반환한다 (deep copy). */
  snapshot(): T;
}

export function watchable<T extends object>(target: T): Watchable<T> {
  const handlers = new Set<WatchHandler>();
  let paused = false;

  function notify(event: WatchEvent): void {
    if (paused) return;
    for (const h of handlers) h(event);
  }

  function createProxy<O extends object>(obj: O, parentPath: string[]): O {
    const proxyCache = new WeakMap<object, object>();

    return new Proxy(obj, {
      get(target, prop, receiver) {
        if (typeof prop === "symbol") return Reflect.get(target, prop, receiver);

        const value = Reflect.get(target, prop, receiver);

        if (typeof value === "object" && value !== null && typeof prop === "string") {
          if (proxyCache.has(value as object)) {
            return proxyCache.get(value as object);
          }
          const childProxy = createProxy(value as object, [...parentPath, prop]);
          proxyCache.set(value as object, childProxy);
          return childProxy;
        }

        return value;
      },

      set(target, prop, value, receiver) {
        if (typeof prop === "symbol") return Reflect.set(target, prop, value, receiver);

        const prev = Reflect.get(target, prop, receiver);
        const result = Reflect.set(target, prop, value, receiver);

        if (prev !== value) {
          notify({
            path: [...parentPath, prop as string],
            value,
            prev,
            type: "set",
          });
        }

        return result;
      },

      deleteProperty(target, prop) {
        if (typeof prop === "symbol") return Reflect.deleteProperty(target, prop);

        const prev = (target as Record<string, unknown>)[prop as string];
        const result = Reflect.deleteProperty(target, prop);

        if (result) {
          notify({
            path: [...parentPath, prop as string],
            value: undefined,
            prev,
            type: "delete",
          });
        }

        return result;
      },
    });
  }

  const proxy = createProxy(target, []);

  const w: Watchable<T> = {
    get proxy() { return proxy; },

    watch(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    watchPath(path, handler) {
      const segments = path.split(".");
      const wrapper: WatchHandler = (event) => {
        if (event.path.length >= segments.length &&
            segments.every((s, i) => s === "*" || s === event.path[i])) {
          handler(event);
        }
      };
      handlers.add(wrapper);
      return () => handlers.delete(wrapper);
    },

    batch(fn) {
      paused = true;
      try {
        fn(proxy);
      } finally {
        paused = false;
      }
    },

    snapshot() {
      return JSON.parse(JSON.stringify(target));
    },
  };

  return w;
}
