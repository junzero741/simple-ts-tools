import { describe, expect, it } from "vitest";
import { orderBy } from "./orderBy";

type Employee = { name: string; dept: string; age: number };
type Player = { name: string; score: number; rank?: number };

describe("orderBy", () => {
  describe("단일 키 (sortBy 호환)", () => {
    it("단일 키 오름차순", () => {
      const arr = [{ n: 3 }, { n: 1 }, { n: 2 }];
      expect(orderBy(arr, [x => x.n]).map(x => x.n)).toEqual([1, 2, 3]);
    });

    it("단일 키 내림차순", () => {
      const arr = [{ n: 1 }, { n: 3 }, { n: 2 }];
      expect(orderBy(arr, [x => x.n], ["desc"]).map(x => x.n)).toEqual([3, 2, 1]);
    });

    it("문자열 키 오름차순", () => {
      const names = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
      expect(orderBy(names, [x => x.name]).map(x => x.name)).toEqual([
        "Alice",
        "Bob",
        "Charlie",
      ]);
    });
  });

  describe("다중 키 정렬", () => {
    it("두 번째 키는 첫 번째 키가 같을 때 적용된다", () => {
      const employees: Employee[] = [
        { name: "Charlie", dept: "Engineering", age: 30 },
        { name: "Alice", dept: "Engineering", age: 25 },
        { name: "Bob", dept: "Design", age: 28 },
        { name: "Dave", dept: "Design", age: 35 },
      ];

      const result = orderBy(employees, [e => e.dept, e => e.name]);
      expect(result.map(e => e.name)).toEqual(["Bob", "Dave", "Alice", "Charlie"]);
    });

    it("방향을 키마다 다르게 지정할 수 있다", () => {
      const players: Player[] = [
        { name: "Alice", score: 100 },
        { name: "Bob", score: 100 },
        { name: "Charlie", score: 90 },
      ];

      // 점수 내림차순, 동점이면 이름 오름차순
      const result = orderBy(players, [p => p.score, p => p.name], ["desc", "asc"]);
      expect(result.map(p => p.name)).toEqual(["Alice", "Bob", "Charlie"]);
    });

    it("세 키 정렬", () => {
      const data = [
        { a: 1, b: 2, c: 3 },
        { a: 1, b: 2, c: 1 },
        { a: 1, b: 1, c: 5 },
        { a: 2, b: 0, c: 0 },
      ];

      const result = orderBy(data, [x => x.a, x => x.b, x => x.c]);
      expect(result).toEqual([
        { a: 1, b: 1, c: 5 },
        { a: 1, b: 2, c: 1 },
        { a: 1, b: 2, c: 3 },
        { a: 2, b: 0, c: 0 },
      ]);
    });
  });

  describe("null / undefined 처리", () => {
    it("null/undefined 값은 항상 맨 뒤로 이동한다", () => {
      const items = [
        { v: 3 },
        { v: null as unknown as number },
        { v: 1 },
        { v: undefined as unknown as number },
        { v: 2 },
      ];

      const result = orderBy(items, [x => x.v]);
      expect(result.map(x => x.v)).toEqual([1, 2, 3, null, undefined]);
    });

    it("내림차순에서도 null/undefined는 맨 뒤", () => {
      const items = [
        { v: 3 },
        { v: null as unknown as number },
        { v: 1 },
      ];

      const result = orderBy(items, [x => x.v], ["desc"]);
      expect(result.map(x => x.v)).toEqual([3, 1, null]);
    });
  });

  describe("안정 정렬 (stable sort)", () => {
    it("키가 같은 요소들은 원래 순서를 유지한다", () => {
      const items = [
        { id: 1, group: "a" },
        { id: 2, group: "b" },
        { id: 3, group: "a" },
        { id: 4, group: "b" },
      ];

      const result = orderBy(items, [x => x.group]);
      // 같은 group 내에서 원래 순서(id 기준) 유지
      expect(result.map(x => x.id)).toEqual([1, 3, 2, 4]);
    });
  });

  describe("엣지 케이스", () => {
    it("빈 배열은 빈 배열을 반환한다", () => {
      expect(orderBy([], [x => x])).toEqual([]);
    });

    it("keys 배열이 비어있으면 원본 순서를 유지한다", () => {
      const arr = [3, 1, 2];
      expect(orderBy(arr, [])).toEqual([3, 1, 2]);
    });

    it("단일 요소는 그대로 반환한다", () => {
      expect(orderBy([{ n: 1 }], [x => x.n])).toEqual([{ n: 1 }]);
    });

    it("원본 배열을 변경하지 않는다 (비파괴)", () => {
      const original = [{ n: 3 }, { n: 1 }, { n: 2 }];
      const copy = [...original];
      orderBy(original, [x => x.n]);
      expect(original).toEqual(copy);
    });
  });

  describe("실사용 시나리오", () => {
    it("리더보드 — 점수 내림차순, 동점자는 이름 오름차순", () => {
      const leaderboard = [
        { name: "Dave", score: 1200 },
        { name: "Alice", score: 1500 },
        { name: "Bob", score: 1500 },
        { name: "Charlie", score: 1200 },
      ];

      const result = orderBy(
        leaderboard,
        [p => p.score, p => p.name],
        ["desc", "asc"]
      );

      expect(result.map(p => p.name)).toEqual(["Alice", "Bob", "Charlie", "Dave"]);
    });

    it("할 일 목록 — 우선순위 오름차순, 마감일 오름차순", () => {
      const tasks = [
        { title: "C", priority: 2, due: "2024-03-15" },
        { title: "A", priority: 1, due: "2024-03-20" },
        { title: "B", priority: 1, due: "2024-03-10" },
        { title: "D", priority: 2, due: "2024-03-05" },
      ];

      const result = orderBy(tasks, [t => t.priority, t => t.due]);
      expect(result.map(t => t.title)).toEqual(["B", "A", "D", "C"]);
    });

    it("직원 목록 — 부서 오름차순, 직급 내림차순, 이름 오름차순", () => {
      const employees = [
        { name: "Eve", dept: "Engineering", level: 3 },
        { name: "Alice", dept: "Design", level: 2 },
        { name: "Bob", dept: "Engineering", level: 3 },
        { name: "Charlie", dept: "Design", level: 3 },
        { name: "Dave", dept: "Engineering", level: 2 },
      ];

      const result = orderBy(
        employees,
        [e => e.dept, e => e.level, e => e.name],
        ["asc", "desc", "asc"]
      );

      expect(result.map(e => e.name)).toEqual([
        "Charlie", "Alice",       // Design: level 3 → level 2
        "Bob", "Eve", "Dave",     // Engineering: level 3(B,E 알파벳순) → level 2
      ]);
    });
  });
});
