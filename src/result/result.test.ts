import { describe, expect, it } from "vitest";
import { err, mapResult, ok, tryCatch, tryCatchAsync, unwrapOr } from "./index";

describe("ok / err", () => {
  it("ok은 { ok: true, value } 를 반환한다", () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(42);
  });

  it("err은 { ok: false, error } 를 반환한다", () => {
    const result = err("something went wrong");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("something went wrong");
  });

  it("ok/err 분기로 타입을 좁힐 수 있다", () => {
    const result = Math.random() > 0.5 ? ok(1) : err("fail");
    if (result.ok) {
      expect(typeof result.value).toBe("number");
    } else {
      expect(typeof result.error).toBe("string");
    }
  });
});

describe("tryCatch", () => {
  it("정상 실행이면 Ok를 반환한다", () => {
    const result = tryCatch(() => JSON.parse('{"a":1}'));
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toEqual({ a: 1 });
  });

  it("throw가 발생하면 Err를 반환한다", () => {
    const result = tryCatch(() => JSON.parse("invalid json"));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBeInstanceOf(SyntaxError);
  });
});

describe("tryCatchAsync", () => {
  it("resolve되면 Ok를 반환한다", async () => {
    const result = await tryCatchAsync(() => Promise.resolve(99));
    expect(result.ok).toBe(true);
    expect(result.ok && result.value).toBe(99);
  });

  it("reject되면 Err를 반환한다", async () => {
    const error = new Error("network error");
    const result = await tryCatchAsync(() => Promise.reject(error));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe(error);
  });
});

describe("mapResult", () => {
  it("Ok이면 값을 변환한다", () => {
    const result = mapResult(ok(5), x => x * 2);
    expect(result.ok && result.value).toBe(10);
  });

  it("Err이면 그대로 전파한다", () => {
    const original = err("oops");
    const result = mapResult(original, (x: number) => x * 2);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBe("oops");
  });
});

describe("unwrapOr", () => {
  it("Ok이면 value를 반환한다", () => {
    expect(unwrapOr(ok(42), 0)).toBe(42);
  });

  it("Err이면 fallback을 반환한다", () => {
    expect(unwrapOr(err("fail"), 0)).toBe(0);
  });
});
