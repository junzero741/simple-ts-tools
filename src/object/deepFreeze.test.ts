import { describe, expect, it } from "vitest";
import { deepFreeze } from "./deepFreeze";

describe("deepFreeze", () => {
  describe("기본 동결", () => {
    it("최상위 객체를 동결한다", () => {
      const obj = deepFreeze({ a: 1, b: 2 });
      expect(Object.isFrozen(obj)).toBe(true);
    });

    it("중첩 객체도 동결한다", () => {
      const obj = deepFreeze({ nested: { x: 1 } });
      expect(Object.isFrozen(obj.nested)).toBe(true);
    });

    it("3단계 이상 깊이도 동결한다", () => {
      const obj = deepFreeze({ a: { b: { c: { d: 42 } } } });
      expect(Object.isFrozen(obj.a)).toBe(true);
      expect(Object.isFrozen(obj.a.b)).toBe(true);
      expect(Object.isFrozen(obj.a.b.c)).toBe(true);
    });

    it("배열도 동결한다", () => {
      const obj = deepFreeze({ arr: [1, 2, 3] });
      expect(Object.isFrozen(obj.arr)).toBe(true);
    });

    it("배열 내 객체도 동결한다", () => {
      const obj = deepFreeze({ items: [{ id: 1 }, { id: 2 }] });
      expect(Object.isFrozen(obj.items[0])).toBe(true);
      expect(Object.isFrozen(obj.items[1])).toBe(true);
    });

    it("원시 값을 그대로 반환한다", () => {
      expect(deepFreeze(42 as never)).toBe(42);
      expect(deepFreeze("hello" as never)).toBe("hello");
      expect(deepFreeze(true as never)).toBe(true);
    });

    it("null을 그대로 반환한다", () => {
      expect(deepFreeze(null as never)).toBeNull();
    });
  });

  describe("런타임 변경 방지", () => {
    it("동결된 객체의 속성 변경 시 strict mode에서 TypeError", () => {
      const obj = deepFreeze({ a: 1 });
      expect(() => {
        "use strict";
        (obj as { a: number }).a = 2;
      }).toThrow(TypeError);
    });

    it("동결된 배열에 push 시 TypeError", () => {
      const obj = deepFreeze({ arr: [1, 2, 3] });
      expect(() => {
        (obj.arr as number[]).push(4);
      }).toThrow(TypeError);
    });

    it("중첩 객체의 속성 변경 시 TypeError", () => {
      const obj = deepFreeze({ nested: { x: 10 } });
      expect(() => {
        "use strict";
        (obj.nested as { x: number }).x = 99;
      }).toThrow(TypeError);
    });
  });

  describe("원본 참조 반환", () => {
    it("원본 객체와 동일한 참조를 반환한다 (in-place 동결)", () => {
      const original = { a: 1, b: { c: 2 } };
      const frozen = deepFreeze(original);
      expect(frozen).toBe(original as never);
    });
  });

  describe("순환 참조 처리", () => {
    it("순환 참조가 있는 객체도 처리한다 (무한 루프 없음)", () => {
      const obj: { self?: unknown } = { self: undefined };
      obj.self = obj;
      expect(() => deepFreeze(obj)).not.toThrow();
      expect(Object.isFrozen(obj)).toBe(true);
    });
  });

  describe("이미 동결된 객체", () => {
    it("이미 동결된 객체는 그대로 반환한다", () => {
      const obj = Object.freeze({ a: 1 });
      const result = deepFreeze(obj);
      expect(result).toBe(obj as never);
    });
  });

  describe("실사용 패턴", () => {
    it("앱 설정 객체로 사용 가능하다", () => {
      const config = deepFreeze({
        api: { url: "https://api.example.com", timeout: 5_000 },
        features: { darkMode: true },
        limits: { maxRetries: 3 },
      });

      expect(config.api.url).toBe("https://api.example.com");
      expect(config.features.darkMode).toBe(true);
      expect(Object.isFrozen(config.api)).toBe(true);
    });

    it("테스트 픽스처로 사용 가능하다 — 테스트 간 데이터 오염 방지", () => {
      const FIXTURE = deepFreeze({
        id: 1,
        name: "Alice",
        roles: ["admin", "user"],
      });

      // 각 테스트가 FIXTURE를 변경하려 해도 방어됨
      expect(() => {
        (FIXTURE.roles as string[]).push("superadmin");
      }).toThrow();

      expect(FIXTURE.roles).toHaveLength(2); // 오염 안 됨
    });

    it("상수 배열로 사용 가능하다", () => {
      const STATUSES = deepFreeze(["pending", "active", "inactive"]);
      expect(Object.isFrozen(STATUSES)).toBe(true);
      expect(() => {
        (STATUSES as string[]).push("deleted");
      }).toThrow();
    });

    it("deepClone 후 deepFreeze로 안전한 snapshot 생성", () => {
      // deepClone은 별도 import 불필요 — 컨셉 테스트
      const original = { count: 0, items: [1, 2, 3] };
      const snapshot = deepFreeze(structuredClone(original));

      original.count = 99;
      original.items.push(4);

      expect(snapshot.count).toBe(0);       // snapshot은 변하지 않음
      expect(snapshot.items).toHaveLength(3);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });
});
