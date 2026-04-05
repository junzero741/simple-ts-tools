import { describe, it, expect, vi } from "vitest";
import { lazy, Lazy } from "./lazy";

describe("lazy", () => {
  describe("생성", () => {
    it("배열에서 생성한다", () => {
      expect(lazy([1, 2, 3]).toArray()).toEqual([1, 2, 3]);
    });

    it("제너레이터 함수에서 생성한다", () => {
      const result = lazy(function* () {
        yield 1;
        yield 2;
        yield 3;
      }).toArray();
      expect(result).toEqual([1, 2, 3]);
    });

    it("Set에서 생성한다", () => {
      expect(lazy(new Set([1, 2, 3])).toArray()).toEqual([1, 2, 3]);
    });

    it("for...of로 직접 순회할 수 있다", () => {
      const result: number[] = [];
      for (const n of lazy([1, 2, 3])) {
        result.push(n);
      }
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe("map", () => {
    it("각 요소를 변환한다", () => {
      expect(lazy([1, 2, 3]).map((n) => n * 2).toArray()).toEqual([2, 4, 6]);
    });

    it("인덱스를 전달한다", () => {
      expect(lazy(["a", "b"]).map((_, i) => i).toArray()).toEqual([0, 1]);
    });
  });

  describe("filter", () => {
    it("조건에 맞는 요소만 남긴다", () => {
      expect(lazy([1, 2, 3, 4]).filter((n) => n % 2 === 0).toArray()).toEqual([2, 4]);
    });
  });

  describe("take / skip", () => {
    it("take — 처음 n개를 취한다", () => {
      expect(lazy([1, 2, 3, 4, 5]).take(3).toArray()).toEqual([1, 2, 3]);
    });

    it("take — 원본이 짧으면 있는 만큼 반환한다", () => {
      expect(lazy([1, 2]).take(5).toArray()).toEqual([1, 2]);
    });

    it("skip — 처음 n개를 건너뛴다", () => {
      expect(lazy([1, 2, 3, 4, 5]).skip(2).toArray()).toEqual([3, 4, 5]);
    });
  });

  describe("takeWhile / skipWhile", () => {
    it("takeWhile — 조건이 참인 동안 취한다", () => {
      expect(lazy([1, 2, 3, 4, 1]).takeWhile((n) => n < 4).toArray()).toEqual([1, 2, 3]);
    });

    it("skipWhile — 조건이 참인 동안 건너뛴다", () => {
      expect(lazy([1, 2, 3, 4, 1]).skipWhile((n) => n < 3).toArray()).toEqual([3, 4, 1]);
    });
  });

  describe("flatMap", () => {
    it("중첩 이터러블을 평탄화한다", () => {
      const result = lazy([1, 2, 3])
        .flatMap((n) => [n, n * 10])
        .toArray();
      expect(result).toEqual([1, 10, 2, 20, 3, 30]);
    });
  });

  describe("distinct", () => {
    it("중복 요소를 제거한다", () => {
      expect(lazy([1, 2, 2, 3, 1, 3]).distinct().toArray()).toEqual([1, 2, 3]);
    });

    it("keyFn으로 비교 기준을 지정한다", () => {
      const data = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 1, name: "c" },
      ];
      const result = lazy(data).distinct((d) => d.id).toArray();
      expect(result).toEqual([
        { id: 1, name: "a" },
        { id: 2, name: "b" },
      ]);
    });
  });

  describe("tap", () => {
    it("부수 효과를 실행하되 값은 변경하지 않는다", () => {
      const side: number[] = [];
      const result = lazy([1, 2, 3])
        .tap((n) => side.push(n * 10))
        .toArray();
      expect(result).toEqual([1, 2, 3]);
      expect(side).toEqual([10, 20, 30]);
    });
  });

  describe("concat", () => {
    it("다른 이터러블을 연결한다", () => {
      expect(lazy([1, 2]).concat([3, 4], [5]).toArray()).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("chunk", () => {
    it("n개씩 묶는다", () => {
      expect(lazy([1, 2, 3, 4, 5]).chunk(2).toArray()).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("size < 1이면 에러를 던진다", () => {
      expect(() => lazy([1]).chunk(0)).toThrow("Chunk size must be at least 1");
    });
  });

  describe("zip", () => {
    it("두 이터러블을 쌍으로 묶는다", () => {
      expect(lazy([1, 2, 3]).zip(["a", "b", "c"]).toArray()).toEqual([
        [1, "a"],
        [2, "b"],
        [3, "c"],
      ]);
    });

    it("짧은 쪽 기준으로 끊는다", () => {
      expect(lazy([1, 2, 3]).zip(["a"]).toArray()).toEqual([[1, "a"]]);
    });
  });

  describe("enumerate", () => {
    it("[index, value] 쌍을 생성한다", () => {
      expect(lazy(["a", "b", "c"]).enumerate().toArray()).toEqual([
        [0, "a"],
        [1, "b"],
        [2, "c"],
      ]);
    });
  });

  describe("터미널 연산", () => {
    it("toMap — Map으로 변환한다", () => {
      const map = lazy([
        { k: "a", v: 1 },
        { k: "b", v: 2 },
      ]).toMap(
        (x) => x.k,
        (x) => x.v,
      );
      expect(map).toEqual(new Map([["a", 1], ["b", 2]]));
    });

    it("toSet — Set으로 변환한다", () => {
      expect(lazy([1, 2, 2, 3]).toSet()).toEqual(new Set([1, 2, 3]));
    });

    it("reduce — 누적한다", () => {
      expect(lazy([1, 2, 3, 4]).reduce((acc, n) => acc + n, 0)).toBe(10);
    });

    it("forEach — 각 요소에 대해 실행한다", () => {
      const fn = vi.fn();
      lazy([1, 2, 3]).forEach(fn);
      expect(fn).toHaveBeenCalledTimes(3);
      expect(fn).toHaveBeenCalledWith(1, 0);
    });

    it("first — 첫 번째 요소 반환", () => {
      expect(lazy([10, 20, 30]).first()).toBe(10);
      expect(lazy([]).first()).toBeUndefined();
    });

    it("find — 조건에 맞는 첫 요소 반환", () => {
      expect(lazy([1, 2, 3, 4]).find((n) => n > 2)).toBe(3);
      expect(lazy([1, 2]).find((n) => n > 10)).toBeUndefined();
    });

    it("every — 모든 요소가 조건 충족", () => {
      expect(lazy([2, 4, 6]).every((n) => n % 2 === 0)).toBe(true);
      expect(lazy([2, 3, 6]).every((n) => n % 2 === 0)).toBe(false);
    });

    it("some — 하나라도 조건 충족", () => {
      expect(lazy([1, 3, 5]).some((n) => n % 2 === 0)).toBe(false);
      expect(lazy([1, 2, 5]).some((n) => n % 2 === 0)).toBe(true);
    });

    it("count — 요소 수", () => {
      expect(lazy([1, 2, 3]).count()).toBe(3);
    });

    it("includes — 포함 여부", () => {
      expect(lazy([1, 2, 3]).includes(2)).toBe(true);
      expect(lazy([1, 2, 3]).includes(5)).toBe(false);
    });
  });

  describe("지연 평가 검증", () => {
    it("take로 제한하면 이후 요소를 순회하지 않는다", () => {
      const visited: number[] = [];
      lazy([1, 2, 3, 4, 5])
        .tap((n) => visited.push(n))
        .take(2)
        .toArray();
      expect(visited).toEqual([1, 2]);
    });

    it("find는 찾은 시점에 순회를 멈춘다", () => {
      const visited: number[] = [];
      lazy([1, 2, 3, 4, 5])
        .tap((n) => visited.push(n))
        .find((n) => n === 3);
      expect(visited).toEqual([1, 2, 3]);
    });

    it("무한 시퀀스를 take로 안전하게 소비한다", () => {
      const result = lazy(function* () {
        let n = 0;
        while (true) yield n++;
      })
        .take(5)
        .toArray();
      expect(result).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("복합 체이닝", () => {
    it("filter → map → take 체이닝", () => {
      const result = lazy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        .filter((n) => n % 2 === 0)
        .map((n) => n * 10)
        .take(3)
        .toArray();
      expect(result).toEqual([20, 40, 60]);
    });

    it("flatMap → distinct → skip → toArray", () => {
      const result = lazy([[1, 2], [2, 3], [3, 4]])
        .flatMap((arr) => arr)
        .distinct()
        .skip(1)
        .toArray();
      expect(result).toEqual([2, 3, 4]);
    });
  });
});
