import { describe, it, expect } from "vitest";
import { createProjection, composeProjections } from "./projection";

type DbUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
};

type UserDTO = {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
};

const dbRow: DbUser = {
  id: 1,
  first_name: "Alice",
  last_name: "Kim",
  email: "alice@example.com",
  status: "active",
  created_at: "2024-01-01",
};

describe("createProjection", () => {
  const toUserDTO = createProjection<DbUser, UserDTO>({
    id: "id",
    fullName: (src) => `${src.first_name} ${src.last_name}`,
    email: "email",
    isActive: (src) => src.status === "active",
  });

  describe("단일 변환", () => {
    it("소스를 대상으로 매핑한다", () => {
      const dto = toUserDTO(dbRow);

      expect(dto).toEqual({
        id: 1,
        fullName: "Alice Kim",
        email: "alice@example.com",
        isActive: true,
      });
    });

    it("문자열 매핑 — 키 복사", () => {
      expect(toUserDTO(dbRow).id).toBe(1);
      expect(toUserDTO(dbRow).email).toBe("alice@example.com");
    });

    it("함수 매핑 — 변환", () => {
      expect(toUserDTO(dbRow).fullName).toBe("Alice Kim");
      expect(toUserDTO(dbRow).isActive).toBe(true);
    });

    it("status가 inactive면 isActive=false", () => {
      const inactive = { ...dbRow, status: "inactive" };
      expect(toUserDTO(inactive).isActive).toBe(false);
    });
  });

  describe("many", () => {
    it("배열을 한 번에 변환한다", () => {
      const rows: DbUser[] = [
        dbRow,
        { ...dbRow, id: 2, first_name: "Bob", last_name: "Lee" },
      ];

      const dtos = toUserDTO.many(rows);
      expect(dtos.length).toBe(2);
      expect(dtos[0].fullName).toBe("Alice Kim");
      expect(dtos[1].fullName).toBe("Bob Lee");
    });

    it("빈 배열이면 빈 배열", () => {
      expect(toUserDTO.many([])).toEqual([]);
    });
  });

  describe("partial", () => {
    it("부분 소스를 부분 대상으로 매핑한다", () => {
      const partial = toUserDTO.partial({ id: 5, email: "x@y.com" });
      expect(partial.id).toBe(5);
      expect(partial.email).toBe("x@y.com");
    });
  });

  describe("다양한 변환 패턴", () => {
    it("날짜 파싱", () => {
      type Src = { date: string };
      type Dst = { date: Date };

      const mapper = createProjection<Src, Dst>({
        date: (src) => new Date(src.date),
      });

      const result = mapper({ date: "2024-06-15" });
      expect(result.date).toBeInstanceOf(Date);
    });

    it("중첩 객체 평탄화", () => {
      type Src = { user: { name: string }; meta: { count: number } };
      type Dst = { name: string; count: number };

      const mapper = createProjection<Src, Dst>({
        name: (src) => src.user.name,
        count: (src) => src.meta.count,
      });

      expect(mapper({ user: { name: "A" }, meta: { count: 5 } })).toEqual({
        name: "A",
        count: 5,
      });
    });

    it("값 변환 + 기본값", () => {
      type Src = { price?: number };
      type Dst = { displayPrice: string };

      const mapper = createProjection<Src, Dst>({
        displayPrice: (src) => `$${(src.price ?? 0).toFixed(2)}`,
      });

      expect(mapper({ price: 9.9 })).toEqual({ displayPrice: "$9.90" });
      expect(mapper({})).toEqual({ displayPrice: "$0.00" });
    });
  });
});

describe("composeProjections", () => {
  it("두 매퍼를 합성한다 (A → B → C)", () => {
    type A = { x: number };
    type B = { doubled: number };
    type C = { label: string };

    const aToB = createProjection<A, B>({
      doubled: (src) => src.x * 2,
    });

    const bToC = createProjection<B, C>({
      label: (src) => `value: ${src.doubled}`,
    });

    const aToC = composeProjections(aToB, bToC);

    expect(aToC({ x: 5 })).toEqual({ label: "value: 10" });
  });

  it("many도 합성된다", () => {
    type A = { n: number };
    type B = { s: string };

    const aToB = createProjection<A, B>({ s: (src) => String(src.n) });
    const identity = createProjection<B, B>({ s: "s" });
    const composed = composeProjections(aToB, identity);

    expect(composed.many([{ n: 1 }, { n: 2 }])).toEqual([{ s: "1" }, { s: "2" }]);
  });
});
