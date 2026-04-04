import { describe, expect, it, vi } from "vitest";
import { randomInt } from "./randomInt";

describe("randomInt", () => {
  it("항상 [min, max] 범위 내 정수를 반환한다", () => {
    for (let i = 0; i < 100; i++) {
      const result = randomInt(1, 6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
      expect(Number.isInteger(result)).toBe(true);
    }
  });

  it("min === max이면 항상 그 값을 반환한다", () => {
    expect(randomInt(5, 5)).toBe(5);
  });

  it("min > max이면 에러를 던진다", () => {
    expect(() => randomInt(10, 1)).toThrow("min must be <= max");
  });

  it("min과 max 경계값도 포함한다", () => {
    // Math.random을 0과 0.999...로 고정해 경계값 테스트
    vi.spyOn(Math, "random").mockReturnValueOnce(0);
    expect(randomInt(1, 6)).toBe(1);

    vi.spyOn(Math, "random").mockReturnValueOnce(0.9999);
    expect(randomInt(1, 6)).toBe(6);

    vi.restoreAllMocks();
  });

  it("소수 인자도 ceil/floor 보정 후 처리한다", () => {
    // min=1.2 → ceil → 2, max=5.9 → floor → 5
    for (let i = 0; i < 50; i++) {
      const result = randomInt(1.2, 5.9);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(5);
    }
  });
});
