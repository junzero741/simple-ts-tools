import { describe, expect, it } from "vitest";
import { createId, createUUID } from "./createId";

describe("createId", () => {
  describe("기본 동작", () => {
    it("기본 길이는 21자다", () => {
      expect(createId()).toHaveLength(21);
    });

    it("반환값이 문자열이다", () => {
      expect(typeof createId()).toBe("string");
    });

    it("length 옵션으로 길이를 지정할 수 있다", () => {
      expect(createId({ length: 10 })).toHaveLength(10);
      expect(createId({ length: 1 })).toHaveLength(1);
      expect(createId({ length: 64 })).toHaveLength(64);
    });

    it("반복 호출 시 다른 값을 반환한다 (충돌 확률 극히 낮음)", () => {
      const ids = new Set(Array.from({ length: 100 }, () => createId()));
      expect(ids.size).toBe(100);
    });
  });

  describe("문자셋 검증", () => {
    it("기본 문자셋은 URL-safe 문자만 포함한다", () => {
      const URL_SAFE = /^[A-Za-z0-9_-]+$/;
      for (let i = 0; i < 20; i++) {
        expect(createId()).toMatch(URL_SAFE);
      }
    });

    it("커스텀 alphabet을 사용할 수 있다", () => {
      const hexId = createId({ length: 8, alphabet: "0123456789abcdef" });
      expect(hexId).toHaveLength(8);
      expect(hexId).toMatch(/^[0-9a-f]{8}$/);
    });

    it("숫자만 포함된 alphabet으로 숫자 ID를 생성한다", () => {
      const numId = createId({ length: 6, alphabet: "0123456789" });
      expect(numId).toMatch(/^\d{6}$/);
    });

    it("단일 문자 alphabet은 같은 문자를 length만큼 반복한다", () => {
      const id = createId({ length: 5, alphabet: "X" });
      expect(id).toBe("XXXXX");
    });

    it("대소문자 구별 문자셋이 정확히 사용된다", () => {
      // 소문자만 허용
      const lowerOnly = createId({ length: 20, alphabet: "abcdefghijklmnopqrstuvwxyz" });
      expect(lowerOnly).toMatch(/^[a-z]{20}$/);
    });
  });

  describe("균일 분포 검증 (편향 없는 생성)", () => {
    it("binary alphabet에서 0과 1이 근사적으로 균등하게 나온다", () => {
      const N = 1000;
      const id = createId({ length: N, alphabet: "01" });
      const zeros = id.split("").filter(c => c === "0").length;
      const ones = N - zeros;
      // 카이제곱 검정 대신 간단히: 편향이 30% 이내
      expect(zeros).toBeGreaterThan(N * 0.35);
      expect(zeros).toBeLessThan(N * 0.65);
      expect(ones).toBeGreaterThan(N * 0.35);
      expect(ones).toBeLessThan(N * 0.65);
    });

    it("32자 alphabet (2의 거듭제곱 아님)에서도 모든 문자가 등장한다", () => {
      const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ012345"; // 32자
      const id = createId({ length: 500, alphabet: alpha });
      const chars = new Set(id.split(""));
      // 500자에서 32개 문자 모두 등장할 확률: (1 - (31/32)^500)^32 ≈ 100%
      expect(chars.size).toBe(32);
    });
  });

  describe("에러 처리", () => {
    it("length가 0이면 RangeError를 던진다", () => {
      expect(() => createId({ length: 0 })).toThrow(RangeError);
    });

    it("length가 음수이면 RangeError를 던진다", () => {
      expect(() => createId({ length: -1 })).toThrow(RangeError);
    });

    it("length가 정수가 아니면 RangeError를 던진다", () => {
      expect(() => createId({ length: 1.5 })).toThrow(RangeError);
    });

    it("alphabet이 빈 문자열이면 RangeError를 던진다", () => {
      expect(() => createId({ alphabet: "" })).toThrow(RangeError);
    });

    it("alphabet이 256자를 초과하면 RangeError를 던진다", () => {
      expect(() => createId({ alphabet: "a".repeat(257) })).toThrow(RangeError);
    });
  });
});

describe("createUUID", () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it("UUID v4 형식이다", () => {
    expect(createUUID()).toMatch(UUID_RE);
  });

  it("version 비트가 4이다", () => {
    const uuid = createUUID();
    expect(uuid[14]).toBe("4");
  });

  it("variant 비트가 8, 9, a, b 중 하나다", () => {
    for (let i = 0; i < 20; i++) {
      expect(createUUID()[19]).toMatch(/[89ab]/);
    }
  });

  it("반복 호출 시 다른 UUID를 반환한다", () => {
    const uuids = new Set(Array.from({ length: 50 }, () => createUUID()));
    expect(uuids.size).toBe(50);
  });

  it("36자 문자열이다 (하이픈 포함)", () => {
    expect(createUUID()).toHaveLength(36);
  });

  it("소문자 16진수와 하이픈만 포함한다", () => {
    expect(createUUID()).toMatch(/^[0-9a-f-]+$/);
  });
});
