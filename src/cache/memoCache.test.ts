import { describe, it, expect, vi } from "vitest";
import { createMemoCache } from "./memoCache";

describe("createMemoCache", () => {
  describe("기본 캐싱", () => {
    it("첫 호출은 fn 실행, 두 번째는 캐시", async () => {
      const fn = vi.fn(async (n: number) => n * 10);
      const cache = createMemoCache({ fn });

      expect(await cache.get(5)).toBe(50);
      expect(await cache.get(5)).toBe(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("다른 인자는 다른 캐시", async () => {
      const fn = vi.fn(async (n: number) => n * 2);
      const cache = createMemoCache({ fn });

      await cache.get(1);
      await cache.get(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("TTL", () => {
    it("만료 후 다시 실행한다", async () => {
      const fn = vi.fn(async () => "data");
      const cache = createMemoCache({ fn, ttl: 50 });

      await cache.get();
      expect(fn).toHaveBeenCalledTimes(1);

      await new Promise((r) => setTimeout(r, 70));
      await cache.get();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("만료 전에는 캐시 히트", async () => {
      const fn = vi.fn(async () => "data");
      const cache = createMemoCache({ fn, ttl: 1000 });

      await cache.get();
      await cache.get();
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("maxSize", () => {
    it("최대 크기 초과 시 오래된 항목을 퇴거한다", async () => {
      const fn = vi.fn(async (n: number) => n);
      const cache = createMemoCache({ fn, maxSize: 2 });

      await cache.get(1);
      await cache.get(2);
      await cache.get(3); // 1이 퇴거됨

      expect(cache.stats.size).toBe(2);
      expect(cache.has(1)).toBe(false);
      expect(cache.has(2)).toBe(true);
      expect(cache.has(3)).toBe(true);
    });
  });

  describe("staleWhileRevalidate", () => {
    it("만료된 데이터를 반환하면서 백그라운드 갱신", async () => {
      let callCount = 0;
      const fn = vi.fn(async () => `data-${++callCount}`);
      const cache = createMemoCache({ fn, ttl: 30, staleWhileRevalidate: true });

      const first = await cache.get();
      expect(first).toBe("data-1");

      await new Promise((r) => setTimeout(r, 50));

      // stale 데이터 반환 (data-1), 백그라운드에서 갱신
      const stale = await cache.get();
      expect(stale).toBe("data-1");
      expect(cache.stats.staleHits).toBe(1);

      // 갱신 완료 대기
      await new Promise((r) => setTimeout(r, 10));
      const fresh = await cache.get();
      expect(fresh).toBe("data-2");
    });
  });

  describe("invalidate", () => {
    it("특정 키를 무효화한다", async () => {
      const fn = vi.fn(async (n: number) => n);
      const cache = createMemoCache({ fn });

      await cache.get(1);
      cache.invalidate(1);
      await cache.get(1);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateAll", () => {
    it("모든 캐시를 제거한다", async () => {
      const fn = vi.fn(async (n: number) => n);
      const cache = createMemoCache({ fn });

      await cache.get(1);
      await cache.get(2);
      cache.invalidateAll();

      expect(cache.stats.size).toBe(0);
    });
  });

  describe("has", () => {
    it("캐시 존재 여부를 확인한다", async () => {
      const cache = createMemoCache({ fn: async (n: number) => n });

      expect(cache.has(1)).toBe(false);
      await cache.get(1);
      expect(cache.has(1)).toBe(true);
    });
  });

  describe("stats", () => {
    it("hits/misses/size를 추적한다", async () => {
      const cache = createMemoCache({ fn: async (n: number) => n });

      await cache.get(1); // miss
      await cache.get(1); // hit
      await cache.get(2); // miss
      await cache.get(1); // hit

      expect(cache.stats).toEqual({
        hits: 2,
        misses: 2,
        staleHits: 0,
        size: 2,
      });
    });
  });

  describe("커스텀 key", () => {
    it("커스텀 key 함수를 사용한다", async () => {
      const fn = vi.fn(async (user: { id: number; name: string }) => user.name);
      const cache = createMemoCache({
        fn,
        key: (user) => String(user.id),
      });

      await cache.get({ id: 1, name: "Alice" });
      await cache.get({ id: 1, name: "Alice Updated" }); // 같은 키

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
