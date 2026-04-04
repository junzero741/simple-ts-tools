import { describe, expect, it } from "vitest";
import { clamp } from "./clamp";

describe("clamp", () => {
  it("범위 안의 값은 그대로 반환한다", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("최솟값보다 작으면 min을 반환한다", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("최댓값보다 크면 max를 반환한다", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("경계값을 그대로 반환한다", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("min === max이면 항상 그 값을 반환한다", () => {
    expect(clamp(99, 5, 5)).toBe(5);
  });

  it("min > max이면 에러를 던진다", () => {
    expect(() => clamp(5, 10, 0)).toThrow("min must be <= max");
  });
});
