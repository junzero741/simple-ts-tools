import { describe, it, expect, vi } from "vitest";
import { createCacheStrategy } from "./writeThrough";

describe("createCacheStrategy", () => {
  describe("read-through", () => {
    it("cache miss 시 load에서 자동 로드한다", async () => {
      const load = vi.fn(async (key: string) => `value-${key}`);
      const cache = createCacheStrategy({ load });

      const result = await cache.get("a");
      expect(result).toBe("value-a");
      expect(load).toHaveBeenCalledWith("a");
    });

    it("cache hit 시 load를 호출하지 않는다", async () => {
      const load = vi.fn(async (key: string) => `value-${key}`);
      const cache = createCacheStrategy({ load });

      await cache.get("a");
      await cache.get("a");

      expect(load).toHaveBeenCalledTimes(1);
    });

    it("stats — hits/misses를 추적한다", async () => {
      const cache = createCacheStrategy({ load: async (k: string) => k });

      await cache.get("a"); // miss
      await cache.get("a"); // hit
      await cache.get("b"); // miss
      await cache.get("a"); // hit

      expect(cache.stats).toEqual({ hits: 2, misses: 2, writes: 0 });
    });
  });

  describe("write-through", () => {
    it("set 시 캐시와 원본 모두 반영한다", async () => {
      const save = vi.fn();
      const cache = createCacheStrategy({
        load: async () => "old",
        save,
      });

      await cache.set("a", "new-value");

      expect(save).toHaveBeenCalledWith("a", "new-value");
      expect(await cache.get("a")).toBe("new-value");
      expect(cache.stats.writes).toBe(1);
    });

    it("save 미지정 시 캐시만 업데이트", async () => {
      const cache = createCacheStrategy({ load: async () => "x" });
      await cache.set("a", "updated");
      expect(await cache.get("a")).toBe("updated");
    });
  });

  describe("TTL", () => {
    it("만료 후 다시 load한다", async () => {
      const load = vi.fn(async () => "data");
      const cache = createCacheStrategy({ load, ttl: 30 });

      await cache.get("a");
      expect(load).toHaveBeenCalledTimes(1);

      await new Promise((r) => setTimeout(r, 50));
      await cache.get("a");
      expect(load).toHaveBeenCalledTimes(2);
    });

    it("만료 전에는 캐시 히트", async () => {
      const load = vi.fn(async () => "data");
      const cache = createCacheStrategy({ load, ttl: 5000 });

      await cache.get("a");
      await cache.get("a");
      expect(load).toHaveBeenCalledTimes(1);
    });

    it("has — 만료된 항목은 false", async () => {
      const cache = createCacheStrategy({ load: async () => "x", ttl: 30 });
      await cache.get("a");
      expect(cache.has("a")).toBe(true);

      await new Promise((r) => setTimeout(r, 50));
      expect(cache.has("a")).toBe(false);
    });
  });

  describe("maxSize", () => {
    it("초과 시 가장 오래된 항목을 제거한다", async () => {
      const cache = createCacheStrategy({
        load: async (k: string) => k,
        maxSize: 2,
      });

      await cache.get("a");
      await cache.get("b");
      await cache.get("c"); // a가 제거됨

      expect(cache.size).toBe(2);
      expect(cache.has("a")).toBe(false);
      expect(cache.has("b")).toBe(true);
      expect(cache.has("c")).toBe(true);
    });
  });

  describe("staleWhileRevalidate", () => {
    it("만료된 데이터를 즉시 반환하고 백그라운드 갱신", async () => {
      let callCount = 0;
      const cache = createCacheStrategy({
        load: async () => `v${++callCount}`,
        ttl: 30,
        staleWhileRevalidate: true,
      });

      await cache.get("a"); // v1
      await new Promise((r) => setTimeout(r, 50));

      const stale = await cache.get("a"); // stale v1, 백그라운드 갱신
      expect(stale).toBe("v1");

      await new Promise((r) => setTimeout(r, 20)); // 갱신 완료 대기
      const fresh = await cache.get("a");
      expect(fresh).toBe("v2");
    });
  });

  describe("invalidate", () => {
    it("특정 키를 제거한다", async () => {
      const cache = createCacheStrategy({ load: async () => "x" });
      await cache.get("a");
      cache.invalidate("a");
      expect(cache.has("a")).toBe(false);
    });

    it("invalidateAll — 전체 비우기", async () => {
      const cache = createCacheStrategy({ load: async () => "x" });
      await cache.get("a");
      await cache.get("b");
      cache.invalidateAll();
      expect(cache.size).toBe(0);
    });
  });

  describe("실전: DB 캐시 계층", () => {
    it("read → write → read 시나리오", async () => {
      const db: Record<string, string> = { "1": "Alice" };
      const cache = createCacheStrategy<string, string>({
        load: async (id) => db[id] ?? "unknown",
        save: async (id, value) => { db[id] = value; },
        ttl: 60_000,
      });

      // read-through
      expect(await cache.get("1")).toBe("Alice");

      // write-through
      await cache.set("1", "Bob");
      expect(db["1"]).toBe("Bob");
      expect(await cache.get("1")).toBe("Bob");

      expect(cache.stats).toEqual({ hits: 1, misses: 1, writes: 1 });
    });
  });
});
