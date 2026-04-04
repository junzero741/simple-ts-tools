import { describe, expect, it } from "vitest";
import { LRUCache } from "./LRUCache";

describe("LRUCache", () => {
  it("기본 set/get 동작을 수행한다", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1).set("b", 2).set("c", 3);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("존재하지 않는 키는 undefined를 반환한다", () => {
    const cache = new LRUCache<string, number>(2);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("용량 초과 시 가장 오래된 항목을 제거한다", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4); // "a"가 제거되어야 함
    expect(cache.has("a")).toBe(false);
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("get 호출 시 항목이 최근 사용으로 갱신된다", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // "a"를 최근 사용으로 갱신
    cache.set("c", 3); // 용량 초과 → "b"가 제거되어야 함 (a가 더 최근)
    expect(cache.has("b")).toBe(false);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });

  it("기존 키에 set하면 값이 갱신되고 최근 사용으로 이동한다", () => {
    const cache = new LRUCache<string, number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 99); // "a" 갱신 → 최근 사용
    cache.set("c", 3);  // 용량 초과 → "b" 제거
    expect(cache.has("b")).toBe(false);
    expect(cache.get("a")).toBe(99);
    expect(cache.get("c")).toBe(3);
  });

  it("delete로 항목을 제거한다", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1).set("b", 2);
    expect(cache.delete("a")).toBe(true);
    expect(cache.has("a")).toBe(false);
    expect(cache.delete("missing")).toBe(false);
  });

  it("clear로 전체를 비운다", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1).set("b", 2).set("c", 3);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
  });

  it("size가 현재 항목 수를 반환한다", () => {
    const cache = new LRUCache<string, number>(5);
    expect(cache.size).toBe(0);
    cache.set("a", 1);
    expect(cache.size).toBe(1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
  });

  it("capacity=1이면 항상 최신 항목만 유지한다", () => {
    const cache = new LRUCache<string, number>(1);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.has("a")).toBe(false);
    expect(cache.get("b")).toBe(2);
  });

  it("capacity가 0 이하이면 에러를 던진다", () => {
    expect(() => new LRUCache(0)).toThrow("capacity must be a positive integer");
    expect(() => new LRUCache(-1)).toThrow("capacity must be a positive integer");
  });

  it("capacity가 정수가 아니면 에러를 던진다", () => {
    expect(() => new LRUCache(1.5)).toThrow("capacity must be a positive integer");
  });
});
