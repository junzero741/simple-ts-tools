import { describe, it, expect, vi } from "vitest";
import { createMiddleware } from "./middleware";

type Ctx = { log: string[]; [key: string]: unknown };

describe("createMiddleware", () => {
  it("미들웨어를 순서대로 실행한다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async (ctx, next) => {
      ctx.log.push("A-before");
      await next();
      ctx.log.push("A-after");
    });

    pipeline.use(async (ctx, next) => {
      ctx.log.push("B-before");
      await next();
      ctx.log.push("B-after");
    });

    const ctx: Ctx = { log: [] };
    await pipeline.run(ctx);
    expect(ctx.log).toEqual(["A-before", "B-before", "B-after", "A-after"]);
  });

  it("next()를 호출하지 않으면 이후 미들웨어를 건너뛴다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async (ctx) => {
      ctx.log.push("A");
      // next() 호출 안 함
    });

    pipeline.use(async (ctx, next) => {
      ctx.log.push("B");
      await next();
    });

    const ctx: Ctx = { log: [] };
    await pipeline.run(ctx);
    expect(ctx.log).toEqual(["A"]);
  });

  it("context를 수정하여 다음 미들웨어에 전달한다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async (ctx, next) => {
      ctx.user = "alice";
      await next();
    });

    pipeline.use(async (ctx, next) => {
      ctx.greeting = `hello ${ctx.user}`;
      await next();
    });

    const ctx: Ctx = { log: [] };
    await pipeline.run(ctx);
    expect(ctx.greeting).toBe("hello alice");
  });

  it("에러가 상위 미들웨어로 전파된다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        ctx.error = (err as Error).message;
      }
    });

    pipeline.use(async () => {
      throw new Error("boom");
    });

    const ctx: Ctx = { log: [] };
    await pipeline.run(ctx);
    expect(ctx.error).toBe("boom");
  });

  it("처리되지 않은 에러는 run()에서 throw된다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async () => {
      throw new Error("unhandled");
    });

    await expect(pipeline.run({ log: [] })).rejects.toThrow("unhandled");
  });

  it("next()를 두 번 호출하면 에러를 던진다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use(async (ctx, next) => {
      await next();
      await next();
    });

    await expect(pipeline.run({ log: [] })).rejects.toThrow("next() called multiple times");
  });

  it("use()는 체이닝을 지원한다", async () => {
    const fn = vi.fn(async (_ctx: Ctx, next: () => Promise<void>) => { await next(); });

    const pipeline = createMiddleware<Ctx>().use(fn).use(fn);

    await pipeline.run({ log: [] });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("length — 등록된 미들웨어 수를 반환한다", () => {
    const pipeline = createMiddleware<Ctx>();
    expect(pipeline.length).toBe(0);

    pipeline.use(async (_ctx, next) => { await next(); });
    expect(pipeline.length).toBe(1);
  });

  it("미들웨어가 없으면 run()은 즉시 완료된다", async () => {
    const pipeline = createMiddleware<Ctx>();
    await expect(pipeline.run({ log: [] })).resolves.toBeUndefined();
  });

  it("동기 미들웨어도 지원한다", async () => {
    const pipeline = createMiddleware<Ctx>();

    pipeline.use((ctx, next) => {
      ctx.log.push("sync");
      return next();
    });

    const ctx: Ctx = { log: [] };
    await pipeline.run(ctx);
    expect(ctx.log).toEqual(["sync"]);
  });
});
