// AbortController 계층 관리 (AbortScope).
//
// 부모-자식 관계의 AbortController 트리를 구성한다.
// 부모 abort 시 모든 자식이 자동 취소되고, 타임아웃 자동 abort,
// 여러 signal을 하나로 합치는 linked signal을 지원한다.
//
// const scope = createAbortScope();
// const child = scope.child();
// const timed = scope.withTimeout(5000);
//
// scope.abort(); // child, timed 모두 abort
//
// const linked = linkSignals(signal1, signal2);
// // 둘 중 하나라도 abort되면 linked도 abort

export interface AbortScope {
  /** 이 스코프의 AbortSignal. */
  readonly signal: AbortSignal;

  /** abort 여부. */
  readonly aborted: boolean;

  /** abort 이유. */
  readonly reason: unknown;

  /** 이 스코프를 abort한다. 모든 자식도 abort된다. */
  abort(reason?: unknown): void;

  /** 자식 스코프를 생성한다. 부모 abort 시 자동 abort. */
  child(): AbortScope;

  /** 타임아웃 후 자동 abort되는 자식 스코프를 생성한다. */
  withTimeout(ms: number): AbortScope;

  /** abort 시 실행되는 콜백을 등록한다. 해제 함수 반환. */
  onAbort(fn: () => void): () => void;

  /** cleanup 함수를 등록한다. abort 시 실행. */
  defer(fn: () => void | Promise<void>): void;
}

export function createAbortScope(parent?: AbortScope): AbortScope {
  const controller = new AbortController();
  const cleanups: Array<() => void | Promise<void>> = [];
  let parentCleanup: (() => void) | undefined;

  // 부모 signal에 연결
  if (parent) {
    if (parent.aborted) {
      controller.abort(parent.reason);
    } else {
      const onParentAbort = () => controller.abort(parent.reason);
      parent.signal.addEventListener("abort", onParentAbort, { once: true });
      parentCleanup = () => parent.signal.removeEventListener("abort", onParentAbort);
    }
  }

  // abort 시 cleanup 실행
  controller.signal.addEventListener("abort", () => {
    parentCleanup?.();
    for (const fn of cleanups) {
      try { fn(); } catch { /* ignore cleanup errors */ }
    }
    cleanups.length = 0;
  }, { once: true });

  const scope: AbortScope = {
    get signal() { return controller.signal; },
    get aborted() { return controller.signal.aborted; },
    get reason() { return controller.signal.reason; },

    abort(reason?: unknown) {
      if (!controller.signal.aborted) {
        controller.abort(reason);
      }
    },

    child() {
      return createAbortScope(scope);
    },

    withTimeout(ms: number) {
      const child = createAbortScope(scope);
      const timer = setTimeout(() => {
        child.abort(new Error(`Aborted: timeout after ${ms}ms`));
      }, ms);

      child.onAbort(() => clearTimeout(timer));
      return child;
    },

    onAbort(fn: () => void) {
      if (controller.signal.aborted) {
        fn();
        return () => {};
      }

      const handler = () => fn();
      controller.signal.addEventListener("abort", handler, { once: true });
      return () => controller.signal.removeEventListener("abort", handler);
    },

    defer(fn: () => void | Promise<void>) {
      if (controller.signal.aborted) {
        try { fn(); } catch { /* ignore */ }
        return;
      }
      cleanups.push(fn);
    },
  };

  return scope;
}

/**
 * 여러 AbortSignal을 하나로 합친다.
 * 어느 하나라도 abort되면 반환된 signal도 abort된다.
 */
export function linkSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener(
      "abort",
      () => { if (!controller.signal.aborted) controller.abort(signal.reason); },
      { once: true },
    );
  }

  return controller.signal;
}

/**
 * AbortSignal이 abort될 때 reject되는 Promise를 반환한다.
 * Promise.race와 함께 사용하여 취소 가능한 비동기 작업을 구현.
 */
export function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(signal.reason);
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      },
    );
  });
}
