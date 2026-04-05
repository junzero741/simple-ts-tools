import { describe, it, expect } from "vitest";
import { Multimap } from "./multimap";

describe("Multimap", () => {
  describe("put / get", () => {
    it("하나의 키에 여러 값을 저장한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("a", 3);
      expect(mm.get("a")).toEqual([1, 2, 3]);
    });

    it("없는 키는 빈 배열", () => {
      expect(new Multimap<string, number>().get("x")).toEqual([]);
    });
  });

  describe("putAll", () => {
    it("여러 값을 한 번에 추가한다", () => {
      const mm = new Multimap<string, number>();
      mm.putAll("a", [1, 2, 3]);
      expect(mm.get("a")).toEqual([1, 2, 3]);
      expect(mm.size).toBe(3);
    });
  });

  describe("has / hasEntry", () => {
    it("키 존재 여부", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1);
      expect(mm.has("a")).toBe(true);
      expect(mm.has("b")).toBe(false);
    });

    it("키-값 쌍 존재 여부", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2);
      expect(mm.hasEntry("a", 1)).toBe(true);
      expect(mm.hasEntry("a", 3)).toBe(false);
    });
  });

  describe("delete / deleteEntry", () => {
    it("키의 모든 값을 제거한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("b", 3);
      mm.delete("a");
      expect(mm.has("a")).toBe(false);
      expect(mm.size).toBe(1);
    });

    it("특정 값 하나만 제거한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("a", 3);
      mm.deleteEntry("a", 2);
      expect(mm.get("a")).toEqual([1, 3]);
      expect(mm.size).toBe(2);
    });

    it("마지막 값 제거 시 키도 사라진다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1);
      mm.deleteEntry("a", 1);
      expect(mm.has("a")).toBe(false);
      expect(mm.keyCount).toBe(0);
    });

    it("없는 키/값 제거는 false", () => {
      const mm = new Multimap<string, number>();
      expect(mm.delete("x")).toBe(false);
      expect(mm.deleteEntry("x", 1)).toBe(false);
    });
  });

  describe("size / keyCount", () => {
    it("size — 총 값 수", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("b", 3);
      expect(mm.size).toBe(3);
    });

    it("keyCount — 고유 키 수", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("b", 3);
      expect(mm.keyCount).toBe(2);
    });
  });

  describe("clear", () => {
    it("모든 항목을 제거한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("b", 2);
      mm.clear();
      expect(mm.size).toBe(0);
      expect(mm.keyCount).toBe(0);
    });
  });

  describe("keys / values / entries", () => {
    it("keys", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("b", 2);
      expect(mm.keys().sort()).toEqual(["a", "b"]);
    });

    it("values — 모든 값 (중복 포함)", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("b", 3);
      expect(mm.values().sort()).toEqual([1, 2, 3]);
    });

    it("entries — [키, 값 배열] 쌍", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2);
      expect(mm.entries()).toEqual([["a", [1, 2]]]);
    });
  });

  describe("forEach", () => {
    it("각 키-값 쌍에 대해 실행한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2);
      const pairs: [string, number][] = [];
      mm.forEach((k, v) => pairs.push([k, v]));
      expect(pairs).toEqual([["a", 1], ["a", 2]]);
    });
  });

  describe("invert", () => {
    it("키와 값을 뒤집는다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2).put("b", 1);

      const inv = mm.invert();
      expect(inv.get(1)).toEqual(["a", "b"]);
      expect(inv.get(2)).toEqual(["a"]);
    });
  });

  describe("toMap", () => {
    it("Map<K, V[]>로 변환한다 (복사)", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2);

      const map = mm.toMap();
      expect(map.get("a")).toEqual([1, 2]);

      // 복사 확인
      map.get("a")!.push(3);
      expect(mm.get("a")).toEqual([1, 2]);
    });
  });

  describe("이터레이터", () => {
    it("[키, 값] 쌍을 이터레이트한다", () => {
      const mm = new Multimap<string, number>();
      mm.put("a", 1).put("a", 2);
      expect([...mm]).toEqual([["a", 1], ["a", 2]]);
    });
  });

  describe("정적 메서드", () => {
    it("from — 배열에서 생성", () => {
      const users = [
        { dept: "eng", name: "Alice" },
        { dept: "eng", name: "Bob" },
        { dept: "sales", name: "Charlie" },
      ];

      const mm = Multimap.from(users, (u) => u.dept, (u) => u.name);
      expect(mm.get("eng")).toEqual(["Alice", "Bob"]);
      expect(mm.get("sales")).toEqual(["Charlie"]);
    });

    it("groupBy — 키 함수로 그루핑", () => {
      const nums = [1, 2, 3, 4, 5, 6];
      const mm = Multimap.groupBy(nums, (n) => (n % 2 === 0 ? "even" : "odd"));

      expect(mm.get("even")).toEqual([2, 4, 6]);
      expect(mm.get("odd")).toEqual([1, 3, 5]);
    });
  });
});
