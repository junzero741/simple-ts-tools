import { describe, it, expect } from "vitest";
import { defineBitmask } from "./bitmask";

const Perms = defineBitmask(["READ", "WRITE", "DELETE", "ADMIN"] as const);

describe("defineBitmask", () => {
  describe("of", () => {
    it("플래그로 비트마스크를 생성한다", () => {
      const m = Perms.of("READ", "WRITE");
      expect(m.has("READ")).toBe(true);
      expect(m.has("WRITE")).toBe(true);
      expect(m.has("DELETE")).toBe(false);
    });

    it("빈 마스크", () => {
      const m = Perms.of();
      expect(m.isEmpty).toBe(true);
    });

    it("알 수 없는 플래그는 에러", () => {
      expect(() => Perms.of("UNKNOWN" as any)).toThrow('Unknown flag: "UNKNOWN"');
    });
  });

  describe("has / hasAll / hasAny", () => {
    const m = Perms.of("READ", "WRITE");

    it("has", () => {
      expect(m.has("READ")).toBe(true);
      expect(m.has("ADMIN")).toBe(false);
    });

    it("hasAll", () => {
      expect(m.hasAll("READ", "WRITE")).toBe(true);
      expect(m.hasAll("READ", "ADMIN")).toBe(false);
    });

    it("hasAny", () => {
      expect(m.hasAny("ADMIN", "WRITE")).toBe(true);
      expect(m.hasAny("ADMIN", "DELETE")).toBe(false);
    });
  });

  describe("add / remove / toggle", () => {
    it("add — 플래그 추가 (불변)", () => {
      const m = Perms.of("READ");
      const m2 = m.add("WRITE", "ADMIN");

      expect(m2.has("WRITE")).toBe(true);
      expect(m2.has("ADMIN")).toBe(true);
      expect(m.has("WRITE")).toBe(false); // 원본 불변
    });

    it("remove — 플래그 제거", () => {
      const m = Perms.of("READ", "WRITE", "ADMIN");
      const m2 = m.remove("ADMIN", "WRITE");

      expect(m2.toArray()).toEqual(["READ"]);
    });

    it("toggle — 플래그 토글", () => {
      const m = Perms.of("READ", "WRITE");
      const m2 = m.toggle("WRITE", "ADMIN");

      expect(m2.has("READ")).toBe(true);
      expect(m2.has("WRITE")).toBe(false); // 꺼짐
      expect(m2.has("ADMIN")).toBe(true);  // 켜짐
    });
  });

  describe("toArray", () => {
    it("설정된 플래그를 순서대로 반환한다", () => {
      const m = Perms.of("ADMIN", "READ");
      expect(m.toArray()).toEqual(["READ", "ADMIN"]); // 정의 순서
    });
  });

  describe("equals", () => {
    it("같은 플래그면 true", () => {
      expect(Perms.of("READ", "WRITE").equals(Perms.of("READ", "WRITE"))).toBe(true);
    });

    it("다르면 false", () => {
      expect(Perms.of("READ").equals(Perms.of("WRITE"))).toBe(false);
    });
  });

  describe("serialize / deserialize", () => {
    it("비트값으로 직렬화한다", () => {
      const m = Perms.of("READ", "WRITE"); // bit 0 + bit 1 = 3
      expect(Perms.serialize(m)).toBe(3);
    });

    it("비트값에서 복원한다", () => {
      const m = Perms.deserialize(3);
      expect(m.toArray()).toEqual(["READ", "WRITE"]);
    });

    it("라운드트립", () => {
      const original = Perms.of("READ", "ADMIN");
      const restored = Perms.deserialize(Perms.serialize(original));
      expect(restored.equals(original)).toBe(true);
    });
  });

  describe("all / none", () => {
    it("all — 모든 플래그 설정", () => {
      const m = Perms.all();
      expect(m.toArray()).toEqual(["READ", "WRITE", "DELETE", "ADMIN"]);
    });

    it("none — 빈 마스크", () => {
      expect(Perms.none().isEmpty).toBe(true);
    });
  });

  describe("flags", () => {
    it("등록된 플래그 이름 목록", () => {
      expect(Perms.flags).toEqual(["READ", "WRITE", "DELETE", "ADMIN"]);
    });
  });

  describe("에러", () => {
    it("32개 초과 플래그는 에러", () => {
      const flags = Array.from({ length: 32 }, (_, i) => `F${i}`);
      expect(() => defineBitmask(flags as any)).toThrow("Maximum 31 flags");
    });

    it("중복 플래그 이름은 에러", () => {
      expect(() => defineBitmask(["A", "A"] as any)).toThrow("Duplicate");
    });
  });

  describe("실전: 권한 검사", () => {
    it("사용자 권한 체크", () => {
      const userPerms = Perms.of("READ", "WRITE");
      const requiredPerms = Perms.of("READ", "DELETE");

      const hasAll = userPerms.hasAll(...requiredPerms.toArray());
      expect(hasAll).toBe(false); // DELETE 없음

      const elevated = userPerms.add("DELETE", "ADMIN");
      expect(elevated.hasAll(...requiredPerms.toArray())).toBe(true);
    });
  });
});
