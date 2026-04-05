import { describe, it, expect } from "vitest";
import { createVersionedMap } from "./versionedMap";

describe("createVersionedMap", () => {
  describe("기본 Map 연산", () => {
    it("set / get / has", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1).set("b", 2);

      expect(m.get("a")).toBe(1);
      expect(m.has("b")).toBe(true);
      expect(m.has("c")).toBe(false);
      expect(m.size).toBe(2);
    });

    it("delete", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);
      expect(m.delete("a")).toBe(true);
      expect(m.has("a")).toBe(false);
      expect(m.delete("a")).toBe(false);
    });

    it("덮어쓰기", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);
      m.set("a", 2);
      expect(m.get("a")).toBe(2);
    });

    it("keys / values / entries", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1).set("b", 2);
      expect(m.keys().sort()).toEqual(["a", "b"]);
      expect(m.values().sort()).toEqual([1, 2]);
      expect(m.entries().sort()).toEqual([["a", 1], ["b", 2]]);
    });
  });

  describe("version", () => {
    it("연산마다 버전이 증가한다", () => {
      const m = createVersionedMap<string, number>();
      expect(m.version).toBe(0);

      m.set("a", 1);
      expect(m.version).toBe(1);

      m.set("b", 2);
      expect(m.version).toBe(2);

      m.delete("a");
      expect(m.version).toBe(3);
    });
  });

  describe("snapshot", () => {
    it("특정 버전의 스냅샷을 반환한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);   // v1
      m.set("b", 2);   // v2
      m.set("a", 10);  // v3
      m.delete("b");   // v4

      const s1 = m.snapshot(1);
      expect(s1).toEqual(new Map([["a", 1]]));

      const s2 = m.snapshot(2);
      expect(s2).toEqual(new Map([["a", 1], ["b", 2]]));

      const s3 = m.snapshot(3);
      expect(s3).toEqual(new Map([["a", 10], ["b", 2]]));

      const s4 = m.snapshot(4);
      expect(s4).toEqual(new Map([["a", 10]]));
    });

    it("인자 없으면 현재 버전", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);
      expect(m.snapshot()).toEqual(new Map([["a", 1]]));
    });
  });

  describe("historyOf", () => {
    it("키의 변경 이력을 반환한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);   // v1
      m.set("b", 2);   // v2
      m.set("a", 10);  // v3
      m.delete("a");   // v4

      const history = m.historyOf("a");
      expect(history).toEqual([
        { version: 1, type: "set", value: 1 },
        { version: 3, type: "set", value: 10 },
        { version: 4, type: "delete", value: undefined },
      ]);
    });

    it("변경 없는 키는 빈 배열", () => {
      const m = createVersionedMap<string, number>();
      expect(m.historyOf("x")).toEqual([]);
    });
  });

  describe("diff", () => {
    it("두 버전 사이의 변경 사항을 반환한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);   // v1
      m.set("b", 2);   // v2
      m.set("a", 10);  // v3

      const changes = m.diff(1, 3);
      expect(changes).toEqual([
        { key: "a", type: "set", from: 1, to: 10 },
        { key: "b", type: "set", to: 2 },
      ]);
    });

    it("삭제된 키를 감지한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);   // v1
      m.delete("a");   // v2

      const changes = m.diff(1, 2);
      expect(changes).toEqual([
        { key: "a", type: "delete", from: 1 },
      ]);
    });

    it("동일하면 빈 배열", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);
      expect(m.diff(1, 1)).toEqual([]);
    });
  });

  describe("rollback", () => {
    it("특정 버전으로 롤백한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);   // v1
      m.set("b", 2);   // v2
      m.set("a", 99);  // v3

      m.rollback(1);

      expect(m.get("a")).toBe(1);
      expect(m.has("b")).toBe(false);
    });

    it("롤백도 새 버전으로 기록된다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);  // v1
      m.set("a", 2);  // v2

      const vBefore = m.version;
      m.rollback(1);
      expect(m.version).toBeGreaterThan(vBefore);
    });
  });

  describe("changelog", () => {
    it("전체 변경 로그를 반환한다", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1);
      m.set("a", 2);

      expect(m.changelog.length).toBe(2);
      expect(m.changelog[0]).toEqual({
        version: 1, key: "a", type: "set", value: 1, prev: undefined,
      });
      expect(m.changelog[1]).toEqual({
        version: 2, key: "a", type: "set", value: 2, prev: 1,
      });
    });
  });

  describe("clear", () => {
    it("모든 키를 삭제한다 (기록됨)", () => {
      const m = createVersionedMap<string, number>();
      m.set("a", 1).set("b", 2);
      const vBefore = m.version;

      m.clear();
      expect(m.size).toBe(0);
      expect(m.version).toBeGreaterThan(vBefore);
    });
  });

  describe("체이닝", () => {
    it("set을 체이닝한다", () => {
      const m = createVersionedMap<string, number>()
        .set("x", 1)
        .set("y", 2)
        .set("z", 3);

      expect(m.size).toBe(3);
    });
  });
});
