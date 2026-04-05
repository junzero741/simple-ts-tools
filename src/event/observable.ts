/**
 * 경량 반응형 Observable.
 *
 * RxJS의 핵심 패턴만 추출한 미니 구현.
 * map, filter, take, merge, switchMap, debounce 등을 지원한다.
 *
 * @example
 * const clicks$ = createObservable<MouseEvent>((observer) => {
 *   const handler = (e: MouseEvent) => observer.next(e);
 *   document.addEventListener("click", handler);
 *   return () => document.removeEventListener("click", handler);
 * });
 *
 * const sub = clicks$
 *   .map(e => ({ x: e.clientX, y: e.clientY }))
 *   .filter(pos => pos.x > 100)
 *   .subscribe(pos => console.log(pos));
 *
 * sub.unsubscribe();
 *
 * @example
 * // fromEvent 헬퍼
 * const input$ = fromEvent(inputEl, "input")
 *   .map(e => (e.target as HTMLInputElement).value)
 *   .debounce(300)
 *   .subscribe(value => search(value));
 *
 * @complexity Time: O(1) per emission per operator. Space: O(n) subscriptions.
 */

export interface Observer<T> {
  next: (value: T) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe(): void;
  readonly closed: boolean;
}

type TeardownFn = () => void;
type SubscribeFn<T> = (observer: Observer<T>) => TeardownFn | void;

export class Observable<T> {
  constructor(private _subscribe: SubscribeFn<T>) {}

  subscribe(
    nextOrObserver: ((value: T) => void) | Partial<Observer<T>>,
  ): Subscription {
    const observer: Observer<T> =
      typeof nextOrObserver === "function"
        ? { next: nextOrObserver }
        : { next: nextOrObserver.next ?? (() => {}), error: nextOrObserver.error, complete: nextOrObserver.complete };

    let closed = false;
    let teardown: TeardownFn | void;
    teardown = this._subscribe({
      next: (v) => { if (!closed) observer.next(v); },
      error: (e) => { if (!closed) { closed = true; observer.error?.(e); teardown?.(); } },
      complete: () => { if (!closed) { closed = true; observer.complete?.(); teardown?.(); } },
    });

    return {
      unsubscribe() {
        if (closed) return;
        closed = true;
        teardown?.();
      },
      get closed() { return closed; },
    };
  }

  map<U>(fn: (value: T) => U): Observable<U> {
    return new Observable<U>((observer) => {
      const sub = this.subscribe({
        next: (v) => observer.next(fn(v)),
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      const sub = this.subscribe({
        next: (v) => { if (predicate(v)) observer.next(v); },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  take(count: number): Observable<T> {
    return new Observable<T>((observer) => {
      let taken = 0;
      const sub = this.subscribe({
        next: (v) => {
          if (taken < count) {
            taken++;
            observer.next(v);
            if (taken >= count) observer.complete?.();
          }
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  skip(count: number): Observable<T> {
    return new Observable<T>((observer) => {
      let skipped = 0;
      const sub = this.subscribe({
        next: (v) => {
          if (skipped < count) { skipped++; return; }
          observer.next(v);
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  tap(fn: (value: T) => void): Observable<T> {
    return new Observable<T>((observer) => {
      const sub = this.subscribe({
        next: (v) => { fn(v); observer.next(v); },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  debounce(ms: number): Observable<T> {
    return new Observable<T>((observer) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const sub = this.subscribe({
        next: (v) => {
          if (timer !== undefined) clearTimeout(timer);
          timer = setTimeout(() => observer.next(v), ms);
        },
        error: (e) => observer.error?.(e),
        complete: () => {
          if (timer !== undefined) clearTimeout(timer);
          observer.complete?.();
        },
      });
      return () => {
        if (timer !== undefined) clearTimeout(timer);
        sub.unsubscribe();
      };
    });
  }

  throttle(ms: number): Observable<T> {
    return new Observable<T>((observer) => {
      let lastTime = 0;
      const sub = this.subscribe({
        next: (v) => {
          const now = Date.now();
          if (now - lastTime >= ms) {
            lastTime = now;
            observer.next(v);
          }
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  distinctUntilChanged(equals?: (a: T, b: T) => boolean): Observable<T> {
    return new Observable<T>((observer) => {
      let hasLast = false;
      let last: T;
      const eq = equals ?? ((a, b) => a === b);
      const sub = this.subscribe({
        next: (v) => {
          if (hasLast && eq(last, v)) return;
          hasLast = true;
          last = v;
          observer.next(v);
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  switchMap<U>(fn: (value: T) => Observable<U>): Observable<U> {
    return new Observable<U>((observer) => {
      let innerSub: Subscription | undefined;
      const outerSub = this.subscribe({
        next: (v) => {
          innerSub?.unsubscribe();
          innerSub = fn(v).subscribe({
            next: (u) => observer.next(u),
            error: (e) => observer.error?.(e),
          });
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => {
        innerSub?.unsubscribe();
        outerSub.unsubscribe();
      };
    });
  }

  scan<U>(fn: (acc: U, value: T) => U, seed: U): Observable<U> {
    return new Observable<U>((observer) => {
      let acc = seed;
      const sub = this.subscribe({
        next: (v) => {
          acc = fn(acc, v);
          observer.next(acc);
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      });
      return () => sub.unsubscribe();
    });
  }

  toPromise(): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve, reject) => {
      let last: T | undefined;
      this.subscribe({
        next: (v) => { last = v; },
        error: (e) => reject(e),
        complete: () => resolve(last),
      });
    });
  }
}

/** Observable을 생성한다. */
export function createObservable<T>(subscribe: SubscribeFn<T>): Observable<T> {
  return new Observable<T>(subscribe);
}

/** 값 목록에서 Observable을 생성한다 (동기 emit 후 complete). */
export function of<T>(...values: T[]): Observable<T> {
  return new Observable<T>((observer) => {
    for (const v of values) observer.next(v);
    observer.complete?.();
  });
}

/** 여러 Observable을 하나로 합친다. */
export function merge<T>(...sources: Observable<T>[]): Observable<T> {
  return new Observable<T>((observer) => {
    let completed = 0;
    const subs = sources.map((src) =>
      src.subscribe({
        next: (v) => observer.next(v),
        error: (e) => observer.error?.(e),
        complete: () => {
          completed++;
          if (completed === sources.length) observer.complete?.();
        },
      }),
    );
    return () => subs.forEach((s) => s.unsubscribe());
  });
}

/** Subject — Observable이자 Observer. 외부에서 next/complete 호출 가능. */
export function createSubject<T>(): Observable<T> & Observer<T> & { asObservable(): Observable<T> } {
  const observers = new Set<Observer<T>>();

  const observable = new Observable<T>((observer) => {
    observers.add(observer);
    return () => observers.delete(observer);
  });

  return Object.assign(observable, {
    next(value: T) { observers.forEach((o) => o.next(value)); },
    error(err: unknown) { observers.forEach((o) => o.error?.(err)); },
    complete() { observers.forEach((o) => o.complete?.()); },
    asObservable() {
      return new Observable<T>((observer) => {
        observers.add(observer);
        return () => observers.delete(observer);
      });
    },
  });
}
