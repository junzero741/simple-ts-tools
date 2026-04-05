import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TTLMap } from "./TTLMap";

describe("TTLMap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("생성자", () => {
    it("양수 TTL로 생성된다", () => {
      expect(() => new TTLMap(1000)).not.toThrow();
    });

    it("TTL이 0 이하면 에러를 던진다", () => {
      expect(() => new TTLMap(0)).toThrow();
      expect(() => new TTLMap(-1)).toThrow();
    });
  });

  describe("set / get", () => {
    it("저장한 값을 즉시 읽을 수 있다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      expect(map.get("a")).toBe(1);
    });

    it("TTL이 지나면 undefined를 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(1001);
      expect(map.get("a")).toBeUndefined();
    });

    it("TTL 경계 — 정확히 TTL 시점에는 아직 유효하다 (Date.now() > expiresAt 조건)", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(1000);
      expect(map.get("a")).toBe(1); // expiresAt과 같은 시점 — 아직 유효
    });

    it("TTL+1ms 이후에는 만료된다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(1001);
      expect(map.get("a")).toBeUndefined();
    });

    it("set을 다시 호출하면 TTL이 갱신된다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(800);
      map.set("a", 2); // TTL 리셋
      vi.advanceTimersByTime(800);
      expect(map.get("a")).toBe(2); // 총 1600ms 경과, 갱신 후 800ms
    });

    it("항목별 TTL 지정 — 기본 TTL 무시", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1, { ttl: 5000 });
      vi.advanceTimersByTime(1500);
      expect(map.get("a")).toBe(1); // 기본 TTL(1000ms)은 지났지만 항목 TTL(5000ms)은 유효
    });

    it("존재하지 않는 키는 undefined를 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      expect(map.get("없는키")).toBeUndefined();
    });
  });

  describe("has", () => {
    it("존재하고 유효한 항목은 true", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      expect(map.has("a")).toBe(true);
    });

    it("만료된 항목은 false", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(1001);
      expect(map.has("a")).toBe(false);
    });

    it("없는 키는 false", () => {
      const map = new TTLMap<string, number>(1000);
      expect(map.has("없는키")).toBe(false);
    });
  });

  describe("delete", () => {
    it("존재하는 키를 삭제하면 true", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      expect(map.delete("a")).toBe(true);
      expect(map.get("a")).toBeUndefined();
    });

    it("없는 키를 삭제하면 false", () => {
      const map = new TTLMap<string, number>(1000);
      expect(map.delete("없는키")).toBe(false);
    });
  });

  describe("clear", () => {
    it("모든 항목을 삭제한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      map.set("b", 2);
      map.clear();
      expect(map.get("a")).toBeUndefined();
      expect(map.get("b")).toBeUndefined();
      expect(map.size).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("만료된 항목을 제거하고 개수를 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3, { ttl: 5000 });
      vi.advanceTimersByTime(1001);
      const removed = map.cleanup();
      expect(removed).toBe(2);
      expect(map.size).toBe(1);
      expect(map.get("c")).toBe(3);
    });

    it("만료된 항목이 없으면 0을 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      expect(map.cleanup()).toBe(0);
    });
  });

  describe("size", () => {
    it("저장된 항목 수를 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      map.set("b", 2);
      expect(map.size).toBe(2);
    });
  });

  describe("ttl()", () => {
    it("남은 TTL을 ms로 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(300);
      const remaining = map.ttl("a");
      expect(remaining).toBeGreaterThanOrEqual(699);
      expect(remaining).toBeLessThanOrEqual(700);
    });

    it("만료된 항목은 0을 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      map.set("a", 1);
      vi.advanceTimersByTime(1001);
      expect(map.ttl("a")).toBe(0);
    });

    it("없는 키는 0을 반환한다", () => {
      const map = new TTLMap<string, number>(1000);
      expect(map.ttl("없는키")).toBe(0);
    });
  });

  describe("실사용 시나리오", () => {
    it("요청 중복 방지 — 같은 요청 ID는 TTL 내 무시", () => {
      const processed = new TTLMap<string, boolean>(60_000);

      function processEvent(id: string): boolean {
        if (processed.has(id)) return false; // 이미 처리됨
        processed.set(id, true);
        return true;
      }

      expect(processEvent("evt-1")).toBe(true);
      expect(processEvent("evt-1")).toBe(false); // 중복
      expect(processEvent("evt-2")).toBe(true);
    });

    it("Rate limit — 시간 창 내 요청 횟수 제한", () => {
      const WINDOW = 60_000; // 1분
      const LIMIT = 3;
      const requestCounts = new TTLMap<string, number>(WINDOW);

      function isRateLimited(userId: string): boolean {
        const count = requestCounts.get(userId) ?? 0;
        if (count >= LIMIT) return true;
        requestCounts.set(userId, count + 1);
        return false;
      }

      expect(isRateLimited("user-1")).toBe(false); // 1
      expect(isRateLimited("user-1")).toBe(false); // 2
      expect(isRateLimited("user-1")).toBe(false); // 3
      expect(isRateLimited("user-1")).toBe(true);  // 초과

      // 1분 후 창 초기화
      vi.advanceTimersByTime(WINDOW + 1);
      expect(isRateLimited("user-1")).toBe(false); // 새 창 시작
    });

    it("Negative 캐시 — 404 응답을 잠시 캐싱해 재요청 방지", () => {
      const notFoundCache = new TTLMap<string, true>(30_000); // 30초

      notFoundCache.set("/missing-resource", true);
      expect(notFoundCache.has("/missing-resource")).toBe(true);

      vi.advanceTimersByTime(30_001);
      expect(notFoundCache.has("/missing-resource")).toBe(false);
    });
  });
});
