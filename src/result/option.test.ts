import { describe, it, expect, vi } from "vitest";
import { some, none, fromNullable, tryOption, firstSome, allSome } from "./option";

describe("Option", () => {
  describe("some / none", () => {
    it("some은 isSome=true", () => {
      expect(some(42).isSome).toBe(true);
      expect(some(42).isNone).toBe(false);
    });

    it("none은 isNone=true", () => {
      expect(none().isSome).toBe(false);
      expect(none().isNone).toBe(true);
    });
  });

  describe("map", () => {
    it("Some을 변환한다", () => {
      expect(some(5).map((n) => n * 2).unwrap()).toBe(10);
    });

    it("None은 그대로 None", () => {
      expect(none<number>().map((n) => n * 2).isNone).toBe(true);
    });
  });

  describe("flatMap", () => {
    it("Some → Some", () => {
      const result = some(10).flatMap((n) => (n > 0 ? some(n) : none()));
      expect(result.unwrap()).toBe(10);
    });

    it("Some → None", () => {
      const result = some(-1).flatMap((n) => (n > 0 ? some(n) : none()));
      expect(result.isNone).toBe(true);
    });

    it("None → None", () => {
      expect(none<number>().flatMap((n) => some(n)).isNone).toBe(true);
    });
  });

  describe("filter", () => {
    it("조건 통과 → Some 유지", () => {
      expect(some(10).filter((n) => n > 5).unwrap()).toBe(10);
    });

    it("조건 실패 → None", () => {
      expect(some(3).filter((n) => n > 5).isNone).toBe(true);
    });

    it("None은 그대로 None", () => {
      expect(none<number>().filter(() => true).isNone).toBe(true);
    });
  });

  describe("unwrap / unwrapOr / unwrapOrElse", () => {
    it("unwrap — Some이면 값 반환", () => {
      expect(some("hello").unwrap()).toBe("hello");
    });

    it("unwrap — None이면 에러", () => {
      expect(() => none().unwrap()).toThrow("Called unwrap on None");
    });

    it("unwrapOr — None이면 기본값", () => {
      expect(none<number>().unwrapOr(0)).toBe(0);
      expect(some(42).unwrapOr(0)).toBe(42);
    });

    it("unwrapOrElse — None이면 함수 실행", () => {
      expect(none<string>().unwrapOrElse(() => "fallback")).toBe("fallback");
    });
  });

  describe("or / orElse / and", () => {
    it("or — None이면 대체 Option", () => {
      expect(none<number>().or(some(99)).unwrap()).toBe(99);
      expect(some(1).or(some(99)).unwrap()).toBe(1);
    });

    it("orElse — None이면 함수로 대체 Option", () => {
      expect(none<number>().orElse(() => some(42)).unwrap()).toBe(42);
    });

    it("and — Some이면 다른 Option", () => {
      expect(some(1).and(some("a")).unwrap()).toBe("a");
      expect(none().and(some("a")).isNone).toBe(true);
    });
  });

  describe("match", () => {
    it("Some 패턴 매칭", () => {
      const result = some(42).match({
        some: (n) => `value: ${n}`,
        none: () => "empty",
      });
      expect(result).toBe("value: 42");
    });

    it("None 패턴 매칭", () => {
      const result = none<number>().match({
        some: (n) => `value: ${n}`,
        none: () => "empty",
      });
      expect(result).toBe("empty");
    });
  });

  describe("tap", () => {
    it("Some이면 부수 효과 실행", () => {
      const fn = vi.fn();
      const result = some(42).tap(fn);
      expect(fn).toHaveBeenCalledWith(42);
      expect(result.unwrap()).toBe(42);
    });

    it("None이면 실행 안 함", () => {
      const fn = vi.fn();
      none().tap(fn);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("toNullable", () => {
    it("Some이면 값", () => {
      expect(some(42).toNullable()).toBe(42);
    });

    it("None이면 undefined", () => {
      expect(none().toNullable()).toBeUndefined();
    });
  });

  describe("zip", () => {
    it("둘 다 Some이면 튜플", () => {
      expect(some(1).zip(some("a")).unwrap()).toEqual([1, "a"]);
    });

    it("하나라도 None이면 None", () => {
      expect(some(1).zip(none()).isNone).toBe(true);
      expect(none().zip(some(1)).isNone).toBe(true);
    });
  });

  describe("fromNullable", () => {
    it("값이면 Some", () => {
      expect(fromNullable(42).unwrap()).toBe(42);
      expect(fromNullable("").unwrap()).toBe("");
      expect(fromNullable(0).unwrap()).toBe(0);
      expect(fromNullable(false).unwrap()).toBe(false);
    });

    it("null/undefined면 None", () => {
      expect(fromNullable(null).isNone).toBe(true);
      expect(fromNullable(undefined).isNone).toBe(true);
    });
  });

  describe("tryOption", () => {
    it("성공하면 Some", () => {
      expect(tryOption(() => 42).unwrap()).toBe(42);
    });

    it("예외 발생하면 None", () => {
      expect(tryOption(() => { throw new Error(); }).isNone).toBe(true);
    });
  });

  describe("firstSome", () => {
    it("첫 Some을 반환한다", () => {
      expect(firstSome(none(), none(), some(3), some(4)).unwrap()).toBe(3);
    });

    it("모두 None이면 None", () => {
      expect(firstSome(none(), none()).isNone).toBe(true);
    });
  });

  describe("allSome", () => {
    it("모두 Some이면 값 배열", () => {
      expect(allSome([some(1), some(2), some(3)]).unwrap()).toEqual([1, 2, 3]);
    });

    it("하나라도 None이면 None", () => {
      expect(allSome([some(1), none(), some(3)]).isNone).toBe(true);
    });

    it("빈 배열이면 빈 Some", () => {
      expect(allSome([]).unwrap()).toEqual([]);
    });
  });

  describe("체이닝 실전", () => {
    it("null 체크 체이닝", () => {
      type User = { address?: { city?: string } };

      const getCity = (user: User | null) =>
        fromNullable(user)
          .flatMap((u) => fromNullable(u.address))
          .flatMap((a) => fromNullable(a.city))
          .map((c) => c.toUpperCase())
          .unwrapOr("UNKNOWN");

      expect(getCity({ address: { city: "seoul" } })).toBe("SEOUL");
      expect(getCity({ address: {} })).toBe("UNKNOWN");
      expect(getCity(null)).toBe("UNKNOWN");
    });
  });
});
