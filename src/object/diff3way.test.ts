import { describe, it, expect } from "vitest";
import { merge3, applyChanges } from "./diff3way";

describe("merge3", () => {
  const base = { name: "Alice", age: 30, city: "Seoul", role: "dev" };

  describe("충돌 없는 병합", () => {
    it("둘 다 변경 안 함 → base 유지", () => {
      const result = merge3(base, base, base);
      expect(result.merged).toEqual(base);
      expect(result.hasConflicts).toBe(false);
    });

    it("mine만 변경", () => {
      const mine = { ...base, age: 31 };
      const result = merge3(base, mine, base);
      expect(result.merged.age).toBe(31);
      expect(result.hasConflicts).toBe(false);
    });

    it("theirs만 변경", () => {
      const theirs = { ...base, city: "Busan" };
      const result = merge3(base, base, theirs);
      expect(result.merged.city).toBe("Busan");
      expect(result.hasConflicts).toBe(false);
    });

    it("서로 다른 키를 변경 → 자동 병합", () => {
      const mine = { ...base, age: 31 };
      const theirs = { ...base, city: "Busan" };
      const result = merge3(base, mine, theirs);

      expect(result.merged).toEqual({ name: "Alice", age: 31, city: "Busan", role: "dev" });
      expect(result.hasConflicts).toBe(false);
    });

    it("같은 키를 같은 값으로 변경 → 충돌 아님", () => {
      const mine = { ...base, age: 31 };
      const theirs = { ...base, age: 31 };
      const result = merge3(base, mine, theirs);

      expect(result.merged.age).toBe(31);
      expect(result.hasConflicts).toBe(false);
    });
  });

  describe("충돌 감지", () => {
    it("같은 키를 다른 값으로 변경 → 충돌", () => {
      const mine = { ...base, name: "Bob" };
      const theirs = { ...base, name: "Charlie" };
      const result = merge3(base, mine, theirs);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toEqual([
        { key: "name", base: "Alice", mine: "Bob", theirs: "Charlie" },
      ]);
    });

    it("기본 전략: mine 우선", () => {
      const mine = { ...base, name: "Bob" };
      const theirs = { ...base, name: "Charlie" };
      const result = merge3(base, mine, theirs);

      expect(result.merged.name).toBe("Bob");
    });
  });

  describe("전략 옵션", () => {
    it("theirs 전략", () => {
      const mine = { ...base, name: "Bob" };
      const theirs = { ...base, name: "Charlie" };
      const result = merge3(base, mine, theirs, { defaultStrategy: "theirs" });

      expect(result.merged.name).toBe("Charlie");
    });

    it("base 전략", () => {
      const mine = { ...base, name: "Bob" };
      const theirs = { ...base, name: "Charlie" };
      const result = merge3(base, mine, theirs, { defaultStrategy: "base" });

      expect(result.merged.name).toBe("Alice");
    });

    it("키별 전략", () => {
      const mine = { ...base, name: "Bob", age: 99 };
      const theirs = { ...base, name: "Charlie", age: 25 };
      const result = merge3(base, mine, theirs, {
        strategies: { name: "theirs", age: "mine" },
      });

      expect(result.merged.name).toBe("Charlie");
      expect(result.merged.age).toBe(99);
    });
  });

  describe("커스텀 resolver", () => {
    it("키별 커스텀 병합 함수", () => {
      const mine = { ...base, age: 31 };
      const theirs = { ...base, age: 32 };
      const result = merge3(base, mine, theirs, {
        resolvers: {
          age: (_b, m, t) => Math.max(m as number, t as number),
        },
      });

      expect(result.merged.age).toBe(32);
      expect(result.hasConflicts).toBe(true); // 충돌은 여전히 기록
    });
  });

  describe("새 키 / 삭제된 키", () => {
    it("mine에만 새 키 추가", () => {
      const mine = { ...base, hobby: "coding" } as any;
      const result = merge3(base, mine, base);
      expect(result.merged.hobby).toBe("coding");
    });

    it("theirs에만 새 키 추가", () => {
      const theirs = { ...base, team: "backend" } as any;
      const result = merge3(base, base, theirs);
      expect(result.merged.team).toBe("backend");
    });
  });

  describe("실전: 동시 편집", () => {
    it("두 편집자가 다른 필드를 수정", () => {
      const original = { title: "Draft", body: "Hello", tags: ["draft"] };
      const editor1 = { ...original, title: "Final Title" };
      const editor2 = { ...original, body: "Updated content" };

      const result = merge3(original, editor1, editor2);
      expect(result.merged).toEqual({
        title: "Final Title",
        body: "Updated content",
        tags: ["draft"],
      });
      expect(result.hasConflicts).toBe(false);
    });
  });
});

describe("applyChanges", () => {
  it("여러 패치를 순서대로 적용한다", () => {
    const base = { a: 1, b: 2, c: 3 };
    const result = applyChanges(base, { a: 10 }, { b: 20 }, { c: 30, a: 100 });
    expect(result).toEqual({ a: 100, b: 20, c: 30 });
  });

  it("원본을 변경하지 않는다", () => {
    const base = { x: 1 };
    applyChanges(base, { x: 99 });
    expect(base.x).toBe(1);
  });
});
