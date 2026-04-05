import { describe, expect, it, vi } from "vitest";
import { memoizeAsync } from "./memoizeAsync";

describe("memoizeAsync", () => {
  describe("기본 캐싱", () => {
    it("같은 인자로 재호출 시 캐시를 반환한다", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const cached = memoizeAsync(fn);

      await cached("key");
      await cached("key");
      await cached("key");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("다른 인자는 각각 호출한다", async () => {
      const fn = vi.fn((x: number) => Promise.resolve(x * 2));
      const cached = memoizeAsync(fn);

      expect(await cached(1)).toBe(2);
      expect(await cached(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("올바른 값을 반환한다", async () => {
      const fn = (id: number) => Promise.resolve({ id, name: `User${id}` });
      const cached = memoizeAsync(fn);

      const result = await cached(42);
      expect(result).toEqual({ id: 42, name: "User42" });
    });
  });

  describe("TTL", () => {
    it("TTL 이전에는 캐시를 반환한다", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockResolvedValue("data");
      const cached = memoizeAsync(fn, { ttl: 1000 });

      await cached("k");
      vi.advanceTimersByTime(999);
      await cached("k");

      expect(fn).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("TTL 만료 후 다시 호출한다", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockResolvedValue("data");
      const cached = memoizeAsync(fn, { ttl: 1000 });

      await cached("k");
      vi.advanceTimersByTime(1001);
      await cached("k");

      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });

  describe("thundering herd 방지", () => {
    it("in-flight 중인 동일 키 요청은 한 번만 실행된다", async () => {
      let resolvePromise!: (v: string) => void;
      const fn = vi.fn(() => new Promise<string>((res) => { resolvePromise = res; }));
      const cached = memoizeAsync(fn);

      // 동시에 3번 호출 — 모두 같은 Promise를 기다림
      const [r1, r2, r3] = [cached("k"), cached("k"), cached("k")];
      resolvePromise("done");

      expect(await r1).toBe("done");
      expect(await r2).toBe("done");
      expect(await r3).toBe("done");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("fn이 실패하면 in-flight에서 제거하여 재시도가 가능하다", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce("ok");
      const cached = memoizeAsync(fn);

      await expect(cached("k")).rejects.toThrow("fail");
      expect(await cached("k")).toBe("ok");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("maxSize", () => {
    it("maxSize 초과 시 가장 오래된 항목을 제거한다", async () => {
      const fn = vi.fn((x: number) => Promise.resolve(x));
      const cached = memoizeAsync(fn, { maxSize: 2 });

      await cached(1); // cache: { 1 }            fn: 1회
      await cached(2); // cache: { 1, 2 }          fn: 2회
      await cached(3); // cache: { 2, 3 } — 1 제거  fn: 3회

      // 1은 제거됐으므로 fn이 다시 호출됨
      // 추가 시 2(가장 오래된)가 제거 → cache: { 3, 1 }
      await cached(1);
      expect(fn).toHaveBeenCalledTimes(4);

      // 3은 여전히 캐시에 있음
      await cached(3);
      expect(fn).toHaveBeenCalledTimes(4); // no new call
    });
  });

  describe("invalidate / clear", () => {
    it("invalidate로 특정 키를 무효화한다", async () => {
      const fn = vi.fn().mockResolvedValue("data");
      const cached = memoizeAsync(fn);

      await cached("k");
      cached.invalidate("k");
      await cached("k");

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("clear로 전체 캐시를 초기화한다", async () => {
      const fn = vi.fn((x: string) => Promise.resolve(x));
      const cached = memoizeAsync(fn);

      await cached("a");
      await cached("b");
      cached.clear();
      await cached("a");
      await cached("b");

      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe("keyFn 커스터마이즈", () => {
    it("keyFn으로 캐시 키를 직접 지정할 수 있다", async () => {
      const fn = vi.fn((user: { id: number; role: string }) => Promise.resolve(user.id));
      // id만 키로 사용 — role은 캐시 구분에 무관
      const cached = memoizeAsync(fn, { keyFn: (u) => String(u.id) });

      await cached({ id: 1, role: "admin" });
      await cached({ id: 1, role: "viewer" }); // 같은 id → 캐시 히트

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
