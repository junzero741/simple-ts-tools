import { describe, it, expect } from "vitest";
import { createRing } from "./ring";

describe("createRing", () => {
  describe("push / toArray", () => {
    it("값을 추가하고 배열로 변환한다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3);
      expect(ring.toArray()).toEqual([1, 2, 3]);
    });

    it("가득 차면 오래된 값을 덮어쓴다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3).push(4);
      expect(ring.toArray()).toEqual([2, 3, 4]);
    });

    it("여러 바퀴 돌아도 정확하다", () => {
      const ring = createRing<number>(3);
      for (let i = 1; i <= 10; i++) ring.push(i);
      expect(ring.toArray()).toEqual([8, 9, 10]);
    });
  });

  describe("at / first / last", () => {
    it("인덱스로 접근한다", () => {
      const ring = createRing<string>(3);
      ring.push("a").push("b").push("c");

      expect(ring.at(0)).toBe("a");
      expect(ring.at(1)).toBe("b");
      expect(ring.at(2)).toBe("c");
    });

    it("덮어쓴 후에도 인덱스가 정확하다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3).push(4).push(5);

      expect(ring.at(0)).toBe(3);
      expect(ring.at(2)).toBe(5);
    });

    it("범위 밖이면 undefined", () => {
      const ring = createRing<number>(3);
      ring.push(1);
      expect(ring.at(1)).toBeUndefined();
      expect(ring.at(-1)).toBeUndefined();
    });

    it("first / last", () => {
      const ring = createRing<number>(3);
      ring.push(10).push(20).push(30).push(40);

      expect(ring.first()).toBe(20);
      expect(ring.last()).toBe(40);
    });

    it("빈 버퍼에서 undefined", () => {
      const ring = createRing<number>(3);
      expect(ring.first()).toBeUndefined();
      expect(ring.last()).toBeUndefined();
    });
  });

  describe("size / capacity / full", () => {
    it("size — 현재 요소 수", () => {
      const ring = createRing<number>(5);
      expect(ring.size).toBe(0);
      ring.push(1).push(2);
      expect(ring.size).toBe(2);
    });

    it("size는 capacity를 초과하지 않는다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3).push(4);
      expect(ring.size).toBe(3);
    });

    it("capacity — 버퍼 용량", () => {
      expect(createRing(10).capacity).toBe(10);
    });

    it("full — 가득 찼는지 여부", () => {
      const ring = createRing<number>(2);
      expect(ring.full).toBe(false);
      ring.push(1);
      expect(ring.full).toBe(false);
      ring.push(2);
      expect(ring.full).toBe(true);
    });
  });

  describe("clear", () => {
    it("모든 요소를 제거한다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3);
      ring.clear();

      expect(ring.size).toBe(0);
      expect(ring.toArray()).toEqual([]);
      expect(ring.full).toBe(false);
    });
  });

  describe("forEach / reduce / filter / map", () => {
    const ring = createRing<number>(3);
    ring.push(10).push(20).push(30);

    it("forEach", () => {
      const values: number[] = [];
      ring.forEach((v) => values.push(v));
      expect(values).toEqual([10, 20, 30]);
    });

    it("reduce — 합계", () => {
      expect(ring.reduce((acc, v) => acc + v, 0)).toBe(60);
    });

    it("filter", () => {
      expect(ring.filter((v) => v > 15)).toEqual([20, 30]);
    });

    it("map", () => {
      expect(ring.map((v) => v * 2)).toEqual([20, 40, 60]);
    });
  });

  describe("이터레이터", () => {
    it("for...of로 순회한다", () => {
      const ring = createRing<number>(3);
      ring.push(1).push(2).push(3).push(4);

      const result: number[] = [];
      for (const v of ring) result.push(v);
      expect(result).toEqual([2, 3, 4]);
    });

    it("스프레드 연산자", () => {
      const ring = createRing<number>(2);
      ring.push(5).push(6);
      expect([...ring]).toEqual([5, 6]);
    });
  });

  describe("capacity 1", () => {
    it("항상 마지막 값만 유지한다", () => {
      const ring = createRing<string>(1);
      ring.push("a").push("b").push("c");
      expect(ring.toArray()).toEqual(["c"]);
      expect(ring.size).toBe(1);
    });
  });

  it("capacity < 1이면 에러를 던진다", () => {
    expect(() => createRing(0)).toThrow("capacity must be at least 1");
  });
});
