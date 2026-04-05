import { describe, it, expect } from "vitest";
import { BloomFilter } from "./bloomFilter";

describe("BloomFilter", () => {
  describe("add / has", () => {
    it("추가한 요소는 항상 has=true", () => {
      const bf = new BloomFilter(100);
      bf.add("hello");
      bf.add("world");

      expect(bf.has("hello")).toBe(true);
      expect(bf.has("world")).toBe(true);
    });

    it("추가하지 않은 요소는 대부분 has=false", () => {
      const bf = new BloomFilter(100, 0.001);
      bf.add("exists");

      // 단일 문자열이 false positive일 확률은 극히 낮음
      expect(bf.has("definitely_not_here_xyz_123")).toBe(false);
    });

    it("false negative은 없다 — 대량 테스트", () => {
      const bf = new BloomFilter(1000, 0.01);
      const items = Array.from({ length: 500 }, (_, i) => `item-${i}`);

      for (const item of items) bf.add(item);
      for (const item of items) {
        expect(bf.has(item)).toBe(true);
      }
    });

    it("false positive rate가 설정값 이하", () => {
      const n = 1000;
      const rate = 0.05;
      const bf = new BloomFilter(n, rate);

      for (let i = 0; i < n; i++) bf.add(`add-${i}`);

      let falsePositives = 0;
      const testCount = 10000;
      for (let i = 0; i < testCount; i++) {
        if (bf.has(`test-${i}`)) falsePositives++;
      }

      const actualRate = falsePositives / testCount;
      // 실제 오탐률이 설정값의 2배 이내
      expect(actualRate).toBeLessThan(rate * 2);
    });
  });

  describe("size", () => {
    it("추가된 요소 수를 반환한다", () => {
      const bf = new BloomFilter(100);
      expect(bf.size).toBe(0);

      bf.add("a");
      bf.add("b");
      expect(bf.size).toBe(2);
    });
  });

  describe("capacity / hashFunctions", () => {
    it("비트 수와 해시 함수 수를 반환한다", () => {
      const bf = new BloomFilter(1000, 0.01);
      expect(bf.capacity).toBeGreaterThan(0);
      expect(bf.hashFunctions).toBeGreaterThan(0);
    });

    it("오탐률이 낮을수록 비트 수가 많다", () => {
      const bf1 = new BloomFilter(1000, 0.1);
      const bf2 = new BloomFilter(1000, 0.001);
      expect(bf2.capacity).toBeGreaterThan(bf1.capacity);
    });
  });

  describe("estimatedFalsePositiveRate", () => {
    it("비어있을 때 0에 가깝다", () => {
      const bf = new BloomFilter(1000, 0.01);
      expect(bf.estimatedFalsePositiveRate).toBeCloseTo(0, 5);
    });

    it("요소가 추가되면 증가한다", () => {
      const bf = new BloomFilter(100, 0.01);
      for (let i = 0; i < 100; i++) bf.add(`item-${i}`);
      expect(bf.estimatedFalsePositiveRate).toBeGreaterThan(0);
    });
  });

  describe("clear", () => {
    it("모든 비트를 초기화한다", () => {
      const bf = new BloomFilter(100);
      bf.add("hello");
      bf.clear();

      expect(bf.has("hello")).toBe(false);
      expect(bf.size).toBe(0);
    });
  });

  describe("merge", () => {
    it("두 필터를 합친다", () => {
      const bf1 = new BloomFilter(100, 0.01);
      const bf2 = new BloomFilter(100, 0.01);

      bf1.add("a");
      bf2.add("b");

      bf1.merge(bf2);
      expect(bf1.has("a")).toBe(true);
      expect(bf1.has("b")).toBe(true);
    });

    it("크기가 다르면 에러를 던진다", () => {
      const bf1 = new BloomFilter(100, 0.01);
      const bf2 = new BloomFilter(200, 0.01);

      expect(() => bf1.merge(bf2)).toThrow("different configurations");
    });
  });

  describe("체이닝", () => {
    it("add를 체이닝한다", () => {
      const bf = new BloomFilter(100);
      bf.add("a").add("b").add("c");
      expect(bf.size).toBe(3);
    });
  });

  describe("에러 처리", () => {
    it("expectedItems < 1이면 에러", () => {
      expect(() => new BloomFilter(0)).toThrow("expectedItems must be at least 1");
    });

    it("falsePositiveRate 범위 밖이면 에러", () => {
      expect(() => new BloomFilter(100, 0)).toThrow();
      expect(() => new BloomFilter(100, 1)).toThrow();
    });
  });
});
