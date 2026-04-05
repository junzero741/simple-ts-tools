import { describe, it, expect } from "vitest";
import { createTypeRegistry, createDefaultRegistry } from "./typeRegistry";

describe("createTypeRegistry", () => {
  describe("커스텀 타입 등록", () => {
    it("커스텀 클래스를 직렬화/역직렬화한다", () => {
      class Point {
        constructor(public x: number, public y: number) {}
      }

      const reg = createTypeRegistry().register(
        "Point", Point,
        (p) => [p.x, p.y],
        (a) => { const [x, y] = a as number[]; return new Point(x, y); },
      );

      const json = reg.stringify({ pos: new Point(1, 2) });
      const parsed = reg.parse(json) as { pos: Point };

      expect(parsed.pos).toBeInstanceOf(Point);
      expect(parsed.pos.x).toBe(1);
      expect(parsed.pos.y).toBe(2);
    });

    it("중복 태그는 에러", () => {
      const reg = createTypeRegistry().register("X", Date, () => "", () => new Date());
      expect(() => reg.register("X", Map, () => "", () => new Map())).toThrow("already registered");
    });
  });

  describe("라운드트립", () => {
    it("원시값은 그대로 유지", () => {
      const reg = createTypeRegistry();
      const data = { n: 42, s: "hello", b: true, nil: null };

      expect(reg.parse(reg.stringify(data))).toEqual(data);
    });

    it("배열 내 커스텀 타입", () => {
      const reg = createDefaultRegistry();
      const data = { dates: [new Date("2024-01-01"), new Date("2024-06-15")] };

      const parsed = reg.parse(reg.stringify(data)) as typeof data;
      expect(parsed.dates[0]).toBeInstanceOf(Date);
      expect(parsed.dates[1]).toBeInstanceOf(Date);
    });

    it("중첩 객체의 커스텀 타입", () => {
      const reg = createDefaultRegistry();
      const data = {
        user: { name: "Alice", joined: new Date("2024-01-01") },
        tags: new Set(["admin", "user"]),
      };

      const parsed = reg.parse(reg.stringify(data)) as typeof data;
      expect(parsed.user.joined).toBeInstanceOf(Date);
      expect(parsed.tags).toBeInstanceOf(Set);
      expect(parsed.tags.has("admin")).toBe(true);
    });
  });

  describe("tags", () => {
    it("등록된 태그 목록을 반환한다", () => {
      const reg = createDefaultRegistry();
      expect(reg.tags).toContain("Date");
      expect(reg.tags).toContain("Map");
      expect(reg.tags).toContain("Set");
      expect(reg.tags).toContain("RegExp");
    });
  });

  describe("체이닝", () => {
    it("register를 체이닝한다", () => {
      const reg = createTypeRegistry()
        .register("Date", Date, (d) => d.toISOString(), (s) => new Date(s as string))
        .register("Set", Set, (s) => [...s], (a) => new Set(a as unknown[]));

      expect(reg.tags).toEqual(["Date", "Set"]);
    });
  });
});

describe("createDefaultRegistry", () => {
  const reg = createDefaultRegistry();

  it("Date 라운드트립", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const parsed = reg.parse(reg.stringify({ d: date })) as { d: Date };

    expect(parsed.d).toBeInstanceOf(Date);
    expect(parsed.d.getTime()).toBe(date.getTime());
  });

  it("Map 라운드트립", () => {
    const map = new Map([["a", 1], ["b", 2]]);
    const parsed = reg.parse(reg.stringify({ m: map })) as { m: Map<string, number> };

    expect(parsed.m).toBeInstanceOf(Map);
    expect(parsed.m.get("a")).toBe(1);
    expect(parsed.m.size).toBe(2);
  });

  it("Set 라운드트립", () => {
    const set = new Set([1, 2, 3]);
    const parsed = reg.parse(reg.stringify({ s: set })) as { s: Set<number> };

    expect(parsed.s).toBeInstanceOf(Set);
    expect(parsed.s.has(2)).toBe(true);
    expect(parsed.s.size).toBe(3);
  });

  it("RegExp 라운드트립", () => {
    const re = /hello\s+world/gi;
    const parsed = reg.parse(reg.stringify({ r: re })) as { r: RegExp };

    expect(parsed.r).toBeInstanceOf(RegExp);
    expect(parsed.r.source).toBe(re.source);
    expect(parsed.r.flags).toBe(re.flags);
  });

  it("미등록 타입은 일반 JSON으로 처리", () => {
    const data = { plain: { a: 1, b: [2, 3] } };
    expect(reg.parse(reg.stringify(data))).toEqual(data);
  });

  it("space 옵션", () => {
    const json = reg.stringify({ x: 1 }, 2);
    expect(json).toContain("\n");
  });
});
