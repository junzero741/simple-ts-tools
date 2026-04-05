/**
 * 외부에서 resolve/reject를 호출할 수 있는 Promise 래퍼.
 *
 * 사용 사례:
 * - 이벤트 기반 코드를 Promise로 변환할 때
 * - 두 비동기 흐름 사이의 핸드셰이크 / 완료 신호
 * - 테스트에서 Promise를 수동 제어할 때
 */
export interface Deferred<T> {
  /** 외부에서 기다릴 수 있는 Promise */
  promise: Promise<T>;
  /** Promise를 resolve시킨다 */
  resolve: (value: T | PromiseLike<T>) => void;
  /** Promise를 reject시킨다 */
  reject: (reason?: unknown) => void;
  /** 현재 상태 */
  readonly status: "pending" | "fulfilled" | "rejected";
}

/**
 * resolve/reject를 외부에서 제어할 수 있는 Deferred 객체를 생성한다.
 *
 * @example
 * const deferred = createDeferred<string>();
 * setTimeout(() => deferred.resolve("done"), 1000);
 * const result = await deferred.promise; // "done"
 */
export function createDeferred<T = void>(): Deferred<T> {
  let status: "pending" | "fulfilled" | "rejected" = "pending";
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = (value) => {
      if (status === "pending") {
        status = "fulfilled";
        res(value);
      }
    };
    reject = (reason) => {
      if (status === "pending") {
        status = "rejected";
        rej(reason);
      }
    };
  });

  return {
    promise,
    resolve,
    reject,
    get status() {
      return status;
    },
  };
}
