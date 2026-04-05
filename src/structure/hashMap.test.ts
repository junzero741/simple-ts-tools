import { describe, it, expect } from "vitest";
import { HashMap } from "./hashMap";

function createPointMap() {
  return new HashMap<[number, number], string>(
    ([x, y]) => `${x},${y}`,
    ([ax, ay], [bx, by]) => ax === bx && ay === by,
  );
}

describe("HashMap", () => {
  describe("set / get / has", () => {
    it("구조적 동등성으로 키를 비교한다", () => {
      const map = createPointMap();
      map.set([1, 2], "A");

      expect(map.get([1, 2])).toBe("A"); // 새 배열이지만 동등
      expect(map.has([1, 2])).toBe(true);
      expect(map.has([3, 4])).toBe(false);
    });

    it("같은 키로 덮어쓴다", () => {
      const map = createPointMap();
      map.set([1, 1], "first");
      map.set([1, 1], "second");

      expect(map.get([1, 1])).toBe("second");
      expect(map.size).toBe(1);
    });

    it("다른 키를 구분한다", () => {
      const map = createPointMap();
      map.set([1, 2], "A");
      map.set([2, 1], "B");

      expect(map.get([1, 2])).toBe("A");
      expect(map.get([2, 1])).toBe("B");
      expect(map.size).toBe(2);
    });

    it("없는 키는 undefined", () => {
      const map = createPointMap();
      expect(map.get([99, 99])).toBeUndefined();
    });
  });

  describe("delete", () => {
    it("키를 삭제한다", () => {
      const map = createPointMap();
      map.set([1, 2], "A");

      expect(map.delete([1, 2])).toBe(true);
      expect(map.has([1, 2])).toBe(false);
      expect(map.size).toBe(0);
    });

    it("없는 키 삭제는 false", () => {
      const map = createPointMap();
      expect(map.delete([1, 1])).toBe(false);
    });
  });

  describe("size", () => {
    it("요소 수를 반환한다", () => {
      const map = createPointMap();
      expect(map.size).toBe(0);
      map.set([1, 1], "A");
      map.set([2, 2], "B");
      expect(map.size).toBe(2);
      map.delete([1, 1]);
      expect(map.size).toBe(1);
    });
  });

  describe("clear", () => {
    it("모든 요소를 제거한다", () => {
      const map = createPointMap();
      map.set([1, 1], "A").set([2, 2], "B");
      map.clear();
      expect(map.size).toBe(0);
      expect(map.has([1, 1])).toBe(false);
    });
  });

  describe("keys / values / entries", () => {
    it("키 목록을 반환한다", () => {
      const map = createPointMap();
      map.set([1, 1], "A").set([2, 2], "B");
      expect(map.keys().length).toBe(2);
    });

    it("값 목록을 반환한다", () => {
      const map = createPointMap();
      map.set([1, 1], "A").set([2, 2], "B");
      expect(map.values().sort()).toEqual(["A", "B"]);
    });

    it("entries를 반환한다", () => {
      const map = createPointMap();
      map.set([0, 0], "origin");
      const entries = map.entries();
      expect(entries.length).toBe(1);
      expect(entries[0][1]).toBe("origin");
    });
  });

  describe("forEach", () => {
    it("모든 항목에 대해 실행한다", () => {
      const map = createPointMap();
      map.set([1, 1], "A").set([2, 2], "B");

      const collected: string[] = [];
      map.forEach((v) => collected.push(v));
      expect(collected.sort()).toEqual(["A", "B"]);
    });
  });

  describe("getOrSet", () => {
    it("있으면 기존 값을 반환한다", () => {
      const map = createPointMap();
      map.set([1, 1], "existing");
      expect(map.getOrSet([1, 1], () => "new")).toBe("existing");
    });

    it("없으면 생성하고 반환한다", () => {
      const map = createPointMap();
      const result = map.getOrSet([1, 1], () => "created");
      expect(result).toBe("created");
      expect(map.get([1, 1])).toBe("created");
    });
  });

  describe("이터레이터", () => {
    it("for...of로 순회한다", () => {
      const map = createPointMap();
      map.set([0, 0], "O").set([1, 0], "X");

      const entries: [unknown, string][] = [];
      for (const [k, v] of map) entries.push([k, v]);
      expect(entries.length).toBe(2);
    });

    it("스프레드 연산자", () => {
      const map = createPointMap();
      map.set([0, 0], "A");
      expect([...map].length).toBe(1);
    });
  });

  describe("체이닝", () => {
    it("set을 체이닝한다", () => {
      const map = createPointMap()
        .set([1, 1], "A")
        .set([2, 2], "B")
        .set([3, 3], "C");

      expect(map.size).toBe(3);
    });
  });

  describe("객체 키", () => {
    it("객체를 키로 사용한다", () => {
      type UserKey = { id: number; org: string };
      const map = new HashMap<UserKey, string>(
        (k) => `${k.org}:${k.id}`,
        (a, b) => a.id === b.id && a.org === b.org,
      );

      map.set({ id: 1, org: "acme" }, "Alice");
      map.set({ id: 2, org: "acme" }, "Bob");

      expect(map.get({ id: 1, org: "acme" })).toBe("Alice");
      expect(map.get({ id: 1, org: "other" })).toBeUndefined();
    });
  });

  describe("해시 충돌", () => {
    it("같은 해시 다른 키를 구분한다", () => {
      // 의도적으로 모든 키가 같은 해시를 반환
      const map = new HashMap<string, number>(
        () => "same-hash",
        (a, b) => a === b,
      );

      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);

      expect(map.size).toBe(3);
      expect(map.get("a")).toBe(1);
      expect(map.get("b")).toBe(2);
      expect(map.get("c")).toBe(3);
    });
  });
});
