import { describe, it, expect } from "vitest";
import {
  humanizeNumber, humanizeDuration, approximateNumber,
  toFraction, pluralizeUnit, progressBar,
} from "./humanize";

describe("humanizeNumber", () => {
  it("천 미만은 그대로", () => {
    expect(humanizeNumber(42)).toBe("42");
    expect(humanizeNumber(999)).toBe("999");
  });

  it("K 단위", () => {
    expect(humanizeNumber(1500)).toBe("1.5K");
    expect(humanizeNumber(12345)).toBe("12.3K");
  });

  it("M 단위", () => {
    expect(humanizeNumber(1_500_000)).toBe("1.5M");
    expect(humanizeNumber(12_345_678)).toBe("12.3M");
  });

  it("B 단위", () => {
    expect(humanizeNumber(2_500_000_000)).toBe("2.5B");
  });

  it("T 단위", () => {
    expect(humanizeNumber(1_200_000_000_000)).toBe("1.2T");
  });

  it("음수", () => {
    expect(humanizeNumber(-5000)).toBe("-5.0K");
  });

  it("소수점 자릿수 지정", () => {
    expect(humanizeNumber(12345, 0)).toBe("12K");
    expect(humanizeNumber(12345, 2)).toBe("12.35K");
  });
});

describe("humanizeDuration", () => {
  it("초", () => {
    expect(humanizeDuration(45)).toBe("45초");
  });

  it("분 초", () => {
    expect(humanizeDuration(90)).toBe("1분 30초");
  });

  it("시간 분", () => {
    expect(humanizeDuration(3661)).toBe("1시간 1분 1초");
  });

  it("일", () => {
    expect(humanizeDuration(90000)).toBe("1일 1시간");
  });

  it("0초", () => {
    expect(humanizeDuration(0)).toBe("0초");
  });

  it("정확한 시간", () => {
    expect(humanizeDuration(3600)).toBe("1시간");
  });
});

describe("approximateNumber", () => {
  it("작은 수는 그대로", () => {
    expect(approximateNumber(5)).toBe("5");
  });

  it("대략적 표현", () => {
    expect(approximateNumber(1234)).toBe("약 1,200");
    expect(approximateNumber(56)).toBe("약 60");
  });

  it("큰 수", () => {
    const result = approximateNumber(98765);
    expect(result).toContain("약");
  });
});

describe("toFraction", () => {
  it("단순 분수", () => {
    expect(toFraction(0.5)).toBe("1/2");
    expect(toFraction(0.25)).toBe("1/4");
    expect(toFraction(0.75)).toBe("3/4");
  });

  it("3분의 1", () => {
    expect(toFraction(1 / 3)).toBe("1/3");
  });

  it("정수", () => {
    expect(toFraction(3)).toBe("3");
  });

  it("음수", () => {
    expect(toFraction(-0.5)).toBe("-1/2");
  });

  it("0", () => {
    expect(toFraction(0)).toBe("0");
  });
});

describe("pluralizeUnit", () => {
  it("단수", () => {
    expect(pluralizeUnit(1, "item")).toBe("1 item");
  });

  it("복수", () => {
    expect(pluralizeUnit(3, "item")).toBe("3 items");
    expect(pluralizeUnit(0, "item")).toBe("0 items");
  });

  it("커스텀 복수형", () => {
    expect(pluralizeUnit(2, "child", "children")).toBe("2 children");
  });
});

describe("progressBar", () => {
  it("0%", () => {
    expect(progressBar(0, 10)).toBe("░░░░░░░░░░ 0%");
  });

  it("50%", () => {
    expect(progressBar(0.5, 10)).toBe("█████░░░░░ 50%");
  });

  it("100%", () => {
    expect(progressBar(1, 10)).toBe("██████████ 100%");
  });

  it("75%", () => {
    const bar = progressBar(0.75, 20);
    expect(bar).toContain("75%");
    expect(bar.length).toBeGreaterThan(20);
  });

  it("범위 밖 클램프", () => {
    expect(progressBar(-0.5, 5)).toContain("0%");
    expect(progressBar(1.5, 5)).toContain("100%");
  });
});
