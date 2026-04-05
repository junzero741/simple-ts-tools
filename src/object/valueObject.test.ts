import { describe, it, expect } from "vitest";
import { defineValueObject } from "./valueObject";

const Money = defineValueObject<{ amount: number; currency: string }>({
  name: "Money",
});

const Email = defineValueObject<{ address: string }>({
  name: "Email",
  validate: (props) => {
    if (!props.address.includes("@")) throw new Error("Invalid email");
  },
});

describe("defineValueObject", () => {
  describe("생성", () => {
    it("값 객체를 생성한다", () => {
      const m = Money({ amount: 100, currency: "USD" });
      expect(m.amount).toBe(100);
      expect(m.currency).toBe("USD");
    });

    it("불변이다", () => {
      const m = Money({ amount: 100, currency: "USD" });
      expect(() => { (m as any).amount = 999; }).toThrow();
    });
  });

  describe("equals", () => {
    it("구조적으로 같으면 true", () => {
      const a = Money({ amount: 100, currency: "USD" });
      const b = Money({ amount: 100, currency: "USD" });
      expect(a.equals(b)).toBe(true);
    });

    it("다르면 false", () => {
      const a = Money({ amount: 100, currency: "USD" });
      const b = Money({ amount: 200, currency: "USD" });
      expect(a.equals(b)).toBe(false);
    });

    it("자기 자신과 비교하면 true", () => {
      const a = Money({ amount: 100, currency: "USD" });
      expect(a.equals(a)).toBe(true);
    });

    it("null/undefined와 비교하면 false", () => {
      const a = Money({ amount: 100, currency: "USD" });
      expect(a.equals(null)).toBe(false);
      expect(a.equals(undefined)).toBe(false);
    });

    it("다른 타입과 비교하면 false", () => {
      const m = Money({ amount: 100, currency: "USD" });
      const e = Email({ address: "a@b.com" });
      expect(m.equals(e)).toBe(false);
    });
  });

  describe("with", () => {
    it("일부 속성을 변경한 새 객체를 생성한다", () => {
      const a = Money({ amount: 100, currency: "USD" });
      const b = a.with({ amount: 200 });

      expect(b.amount).toBe(200);
      expect(b.currency).toBe("USD");
      expect(a.amount).toBe(100); // 원본 불변
    });

    it("새 객체도 값 객체이다", () => {
      const a = Money({ amount: 100, currency: "USD" });
      const b = a.with({ amount: 200 });

      expect(Money.is(b)).toBe(true);
      expect(b.equals(Money({ amount: 200, currency: "USD" }))).toBe(true);
    });
  });

  describe("toJSON", () => {
    it("순수 데이터 객체를 반환한다", () => {
      const m = Money({ amount: 100, currency: "USD" });
      expect(m.toJSON()).toEqual({ amount: 100, currency: "USD" });
    });

    it("JSON.stringify와 호환된다", () => {
      const m = Money({ amount: 100, currency: "USD" });
      const json = JSON.stringify(m);
      expect(JSON.parse(json)).toEqual({ amount: 100, currency: "USD" });
    });
  });

  describe("toString", () => {
    it("이름과 속성을 포함한다", () => {
      const m = Money({ amount: 100, currency: "USD" });
      expect(m.toString()).toBe('Money(amount=100, currency="USD")');
    });
  });

  describe("is (타입 가드)", () => {
    it("같은 팩토리로 생성된 객체는 true", () => {
      const m = Money({ amount: 100, currency: "USD" });
      expect(Money.is(m)).toBe(true);
    });

    it("다른 팩토리/일반 객체는 false", () => {
      expect(Money.is({ amount: 100, currency: "USD" })).toBe(false);
      expect(Money.is(null)).toBe(false);
      expect(Money.is(Email({ address: "a@b.com" }))).toBe(false);
    });
  });

  describe("validate", () => {
    it("유효하면 생성된다", () => {
      expect(() => Email({ address: "user@example.com" })).not.toThrow();
    });

    it("유효하지 않으면 에러를 던진다", () => {
      expect(() => Email({ address: "invalid" })).toThrow("Invalid email");
    });

    it("with로 변경 시에도 검증한다", () => {
      const e = Email({ address: "a@b.com" });
      expect(() => e.with({ address: "bad" })).toThrow("Invalid email");
    });
  });

  describe("커스텀 equals", () => {
    it("커스텀 비교 함수를 지원한다", () => {
      const CaseInsensitiveName = defineValueObject<{ name: string }>({
        equals: (a, b) => a.name.toLowerCase() === b.name.toLowerCase(),
      });

      const a = CaseInsensitiveName({ name: "Alice" });
      const b = CaseInsensitiveName({ name: "alice" });
      expect(a.equals(b)).toBe(true);
    });
  });
});
