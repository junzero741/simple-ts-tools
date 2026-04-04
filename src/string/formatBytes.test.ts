import { describe, expect, it } from "vitest";
import { formatBytes } from "./formatBytes";

describe("formatBytes", () => {
  it("0 바이트를 처리한다", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("바이트 단위를 반환한다", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("1024 바이트를 1 KB로 변환한다", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("소수점을 포함한 KB를 반환한다", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1234)).toBe("1.21 KB");
  });

  it("MB를 올바르게 변환한다", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(1024 * 1024 * 1.5)).toBe("1.5 MB");
  });

  it("GB, TB도 변환한다", () => {
    expect(formatBytes(1024 ** 3)).toBe("1 GB");
    expect(formatBytes(1024 ** 4)).toBe("1 TB");
  });

  it("decimals 옵션으로 자릿수를 제어한다", () => {
    expect(formatBytes(1234567, 0)).toBe("1 MB");
    expect(formatBytes(1234567, 1)).toBe("1.2 MB");
    expect(formatBytes(1234567, 3)).toBe("1.177 MB");
  });

  it("소수점 끝 0을 제거한다 (1.50 → 1.5)", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");  // 1.50 아님
  });

  it("음수 바이트는 에러를 던진다", () => {
    expect(() => formatBytes(-1)).toThrow("bytes must be >= 0");
  });
});
