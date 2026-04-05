// 반응형 시그널 시스템 (Reactive Signals).
//
// SolidJS/Preact Signals의 핵심 패턴을 경량으로 구현.
// signal(값), computed(파생), effect(부수 효과)로 구성.
// 의존성을 자동 추적하여 변경 시 최소한으로 재계산한다.
//
// const [count, setCount] = signal(0);
// const doubled = signalComputed(() => count() * 2);
//
// effect(() => {
//   console.log(`count=${count()}, doubled=${doubled()}`);
// });
// // 즉시 실행: "count=0, doubled=0"
//
// setCount(5);
// // 자동 재실행: "count=5, doubled=10"

let activeEffect: (() => void) | null = null;

export interface ReadonlySignal<T> {
  (): T;
  peek(): T;
}

export interface Signal<T> extends ReadonlySignal<T> {
  set(value: T): void;
  update(fn: (prev: T) => T): void;
}

export function signal<T>(initial: T): [get: ReadonlySignal<T>, set: (value: T | ((prev: T) => T)) => void] {
  let value = initial;
  const subscribers = new Set<() => void>();

  const get = (() => {
    if (activeEffect) {
      subscribers.add(activeEffect);
    }
    return value;
  }) as ReadonlySignal<T>;

  get.peek = () => value;

  const set = (next: T | ((prev: T) => T)) => {
    const newValue = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
    if (Object.is(value, newValue)) return;
    value = newValue;
    for (const sub of [...subscribers]) {
      sub();
    }
  };

  return [get, set];
}

export function signalComputed<T>(fn: () => T): ReadonlySignal<T> {
  let cached: T;
  let dirty = true;
  const subscribers = new Set<() => void>();

  const recompute = () => {
    dirty = true;
    for (const sub of [...subscribers]) sub();
  };

  const get = (() => {
    if (activeEffect) {
      subscribers.add(activeEffect);
    }
    if (dirty) {
      const prevEffect = activeEffect;
      activeEffect = recompute;
      try {
        cached = fn();
      } finally {
        activeEffect = prevEffect;
      }
      dirty = false;
    }
    return cached;
  }) as ReadonlySignal<T>;

  get.peek = () => {
    if (dirty) {
      const prevEffect = activeEffect;
      activeEffect = recompute;
      try {
        cached = fn();
      } finally {
        activeEffect = prevEffect;
      }
      dirty = false;
    }
    return cached;
  };

  return get;
}

export interface EffectDisposer {
  (): void;
}

export function effect(fn: () => void | (() => void)): EffectDisposer {
  let cleanup: (() => void) | void;
  let disposed = false;

  const execute = () => {
    if (disposed) return;
    if (cleanup) cleanup();

    const prevEffect = activeEffect;
    activeEffect = execute;
    try {
      cleanup = fn();
    } finally {
      activeEffect = prevEffect;
    }
  };

  execute();

  return () => {
    disposed = true;
    if (cleanup) cleanup();
  };
}

export function batch(fn: () => void): void {
  const prev = activeEffect;
  activeEffect = null;
  try {
    fn();
  } finally {
    activeEffect = prev;
  }
}

export function untracked<T>(fn: () => T): T {
  const prev = activeEffect;
  activeEffect = null;
  try {
    return fn();
  } finally {
    activeEffect = prev;
  }
}
