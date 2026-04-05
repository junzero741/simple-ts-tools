/**
 * 범용 미들웨어 체인 (Middleware Pipeline).
 *
 * Express/Koa 스타일의 `next()` 기반 미들웨어 패턴을 범용으로 구현.
 * HTTP 요청, 이벤트 처리, 데이터 파이프라인 등 다양한 컨텍스트에 적용 가능하다.
 *
 * @example
 * // 로깅 + 인증 + 핸들러 체인
 * type Ctx = { user?: string; log: string[] };
 *
 * const pipeline = createMiddleware<Ctx>();
 *
 * pipeline.use(async (ctx, next) => {
 *   ctx.log.push("start");
 *   await next();
 *   ctx.log.push("end");
 * });
 *
 * pipeline.use(async (ctx, next) => {
 *   ctx.user = "alice";
 *   await next();
 * });
 *
 * const ctx = { log: [] };
 * await pipeline.run(ctx);
 * // ctx.user === "alice"
 * // ctx.log === ["start", "end"]
 *
 * @example
 * // 에러 핸들링 — 상위 미들웨어에서 try/catch
 * pipeline.use(async (ctx, next) => {
 *   try {
 *     await next();
 *   } catch (err) {
 *     ctx.error = err;
 *   }
 * });
 *
 * @complexity Time: O(n) per run, n = 미들웨어 수. Space: O(n) 콜 스택.
 */

export type MiddlewareFn<T> = (context: T, next: () => Promise<void>) => Promise<void> | void;

export interface Middleware<T> {
  /** 미들웨어를 추가한다. 추가된 순서대로 실행된다. */
  use(fn: MiddlewareFn<T>): Middleware<T>;

  /** 미들웨어 체인을 실행한다. */
  run(context: T): Promise<void>;

  /** 등록된 미들웨어 수 */
  readonly length: number;
}

export function createMiddleware<T>(): Middleware<T> {
  const stack: MiddlewareFn<T>[] = [];

  const middleware: Middleware<T> = {
    use(fn: MiddlewareFn<T>): Middleware<T> {
      stack.push(fn);
      return middleware;
    },

    async run(context: T): Promise<void> {
      let index = -1;

      async function dispatch(i: number): Promise<void> {
        if (i <= index) {
          throw new Error("next() called multiple times");
        }
        index = i;
        if (i >= stack.length) return;

        const fn = stack[i];
        await fn(context, () => dispatch(i + 1));
      }

      await dispatch(0);
    },

    get length(): number {
      return stack.length;
    },
  };

  return middleware;
}
