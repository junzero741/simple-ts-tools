import { describe, expect, it } from "vitest";
import {
  complement,
  darken,
  desaturate,
  hexToHsl,
  hexToRgb,
  hslToHex,
  isLight,
  lighten,
  mix,
  rgbToHex,
  saturate,
  setAlpha,
} from "./color";

// ─── hexToRgb ─────────────────────────────────────────────────────────────────

describe("hexToRgb", () => {
  it("6자리 hex를 파싱한다", () => {
    expect(hexToRgb("#ff6600")).toEqual({ r: 255, g: 102, b: 0, a: 1 });
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
  });

  it("3자리 축약형을 파싱한다", () => {
    expect(hexToRgb("#f60")).toEqual({ r: 255, g: 102, b: 0, a: 1 });
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(hexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it("8자리 hex(alpha 포함)를 파싱한다", () => {
    const { r, g, b, a } = hexToRgb("#ff660080");
    expect(r).toBe(255);
    expect(g).toBe(102);
    expect(b).toBe(0);
    expect(a).toBeCloseTo(0.502, 2);
  });

  it("# 없이도 파싱한다", () => {
    expect(hexToRgb("ff6600")).toEqual({ r: 255, g: 102, b: 0, a: 1 });
  });

  it("잘못된 hex는 에러를 던진다", () => {
    expect(() => hexToRgb("#xyz")).toThrow();
    expect(() => hexToRgb("#12345")).toThrow();
  });
});

// ─── rgbToHex ─────────────────────────────────────────────────────────────────

describe("rgbToHex", () => {
  it("RGB를 6자리 hex로 변환한다", () => {
    expect(rgbToHex(255, 102, 0)).toBe("#ff6600");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
    expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
  });

  it("alpha < 1이면 8자리 hex를 반환한다", () => {
    expect(rgbToHex(255, 102, 0, 0.5)).toBe("#ff660080");
  });

  it("alpha = 1이면 6자리 hex를 반환한다", () => {
    expect(rgbToHex(255, 102, 0, 1)).toBe("#ff6600");
  });

  it("범위를 벗어난 값을 클램프한다", () => {
    expect(rgbToHex(300, -10, 0)).toBe("#ff0000");
  });

  it("hexToRgb와 rgbToHex는 역연산이다", () => {
    const original = "#4a9eff";
    const { r, g, b, a } = hexToRgb(original);
    expect(rgbToHex(r, g, b, a)).toBe(original);
  });
});

// ─── hexToHsl ─────────────────────────────────────────────────────────────────

describe("hexToHsl", () => {
  it("빨강", () => {
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50, a: 1 });
  });

  it("초록", () => {
    expect(hexToHsl("#00ff00")).toEqual({ h: 120, s: 100, l: 50, a: 1 });
  });

  it("파랑", () => {
    expect(hexToHsl("#0000ff")).toEqual({ h: 240, s: 100, l: 50, a: 1 });
  });

  it("흰색", () => {
    const { s, l } = hexToHsl("#ffffff");
    expect(l).toBe(100);
    expect(s).toBe(0);
  });

  it("검정", () => {
    const { s, l } = hexToHsl("#000000");
    expect(l).toBe(0);
    expect(s).toBe(0);
  });

  it("회색", () => {
    const { s, l } = hexToHsl("#808080");
    expect(s).toBe(0);
    expect(l).toBeCloseTo(50, 0);
  });
});

// ─── hslToHex ─────────────────────────────────────────────────────────────────

describe("hslToHex", () => {
  it("빨강", () => {
    expect(hslToHex(0, 100, 50)).toBe("#ff0000");
  });

  it("초록", () => {
    expect(hslToHex(120, 100, 50)).toBe("#00ff00");
  });

  it("파랑", () => {
    expect(hslToHex(240, 100, 50)).toBe("#0000ff");
  });

  it("흰색", () => {
    expect(hslToHex(0, 0, 100)).toBe("#ffffff");
  });

  it("검정", () => {
    expect(hslToHex(0, 0, 0)).toBe("#000000");
  });

  it("alpha < 1이면 8자리 hex를 반환한다", () => {
    expect(hslToHex(240, 100, 50, 0.5)).toBe("#0000ff80");
  });

  it("hexToHsl와 hslToHex는 역연산이다", () => {
    const original = "#3366cc";
    const { h, s, l } = hexToHsl(original);
    expect(hslToHex(h, s, l)).toBe(original);
  });
});

// ─── lighten / darken ─────────────────────────────────────────────────────────

describe("lighten", () => {
  it("lightness를 증가시킨다", () => {
    const before = hexToHsl("#336699").l;
    const after = hexToHsl(lighten("#336699", 0.2)).l;
    expect(after).toBeGreaterThan(before);
  });

  it("amount=0이면 색상이 변하지 않는다", () => {
    expect(lighten("#336699", 0)).toBe("#336699");
  });

  it("amount=1이면 흰색이 된다", () => {
    expect(lighten("#336699", 1)).toBe("#ffffff");
  });

  it("이미 밝은 색을 더 밝게 할 때 100을 초과하지 않는다", () => {
    const { l } = hexToHsl(lighten("#e0e0e0", 0.5));
    expect(l).toBeLessThanOrEqual(100);
  });
});

describe("darken", () => {
  it("lightness를 감소시킨다", () => {
    const before = hexToHsl("#336699").l;
    const after = hexToHsl(darken("#336699", 0.2)).l;
    expect(after).toBeLessThan(before);
  });

  it("amount=0이면 색상이 변하지 않는다", () => {
    expect(darken("#336699", 0)).toBe("#336699");
  });

  it("amount=1이면 검정이 된다", () => {
    expect(darken("#336699", 1)).toBe("#000000");
  });
});

// ─── saturate / desaturate ────────────────────────────────────────────────────

describe("saturate", () => {
  it("채도를 높인다", () => {
    const before = hexToHsl("#7f9f7f").s;
    const after = hexToHsl(saturate("#7f9f7f", 0.3)).s;
    expect(after).toBeGreaterThan(before);
  });

  it("amount=0이면 채도가 변하지 않는다", () => {
    const { s: s1 } = hexToHsl("#7f9f7f");
    const { s: s2 } = hexToHsl(saturate("#7f9f7f", 0));
    expect(s2).toBe(s1);
  });

  it("100을 초과하지 않는다", () => {
    const { s } = hexToHsl(saturate("#ff0000", 1));
    expect(s).toBeLessThanOrEqual(100);
  });
});

describe("desaturate", () => {
  it("채도를 낮춘다", () => {
    const before = hexToHsl("#ff6600").s;
    const after = hexToHsl(desaturate("#ff6600", 0.5)).s;
    expect(after).toBeLessThan(before);
  });

  it("amount=1이면 무채색이 된다", () => {
    const { s } = hexToHsl(desaturate("#ff6600", 1));
    expect(s).toBe(0);
  });
});

// ─── setAlpha ─────────────────────────────────────────────────────────────────

describe("setAlpha", () => {
  it("opacity를 설정한다", () => {
    expect(setAlpha("#ff6600", 0.5)).toBe("#ff660080");
  });

  it("opacity=1이면 6자리 hex를 반환한다", () => {
    expect(setAlpha("#ff660080", 1)).toBe("#ff6600");
  });

  it("opacity=0이면 완전 투명", () => {
    expect(setAlpha("#ff6600", 0)).toBe("#ff660000");
  });

  it("범위를 벗어난 opacity를 클램프한다", () => {
    expect(setAlpha("#ff6600", 1.5)).toBe("#ff6600");
    expect(setAlpha("#ff6600", -0.5)).toBe("#ff660000");
  });
});

// ─── mix ──────────────────────────────────────────────────────────────────────

describe("mix", () => {
  it("weight=0.5이면 두 색의 중간값", () => {
    expect(mix("#ff0000", "#0000ff")).toBe("#800080");
  });

  it("weight=0이면 첫 번째 색과 같다", () => {
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#ff0000");
  });

  it("weight=1이면 두 번째 색과 같다", () => {
    expect(mix("#ff0000", "#0000ff", 1)).toBe("#0000ff");
  });

  it("weight=0.25이면 첫 번째 색에 가깝다", () => {
    const { r } = hexToRgb(mix("#ff0000", "#0000ff", 0.25));
    expect(r).toBeGreaterThan(128); // 빨강 우세
  });
});

// ─── complement ───────────────────────────────────────────────────────────────

describe("complement", () => {
  it("빨강의 보색은 시안", () => {
    expect(complement("#ff0000")).toBe("#00ffff");
  });

  it("파랑의 보색은 노랑", () => {
    expect(complement("#0000ff")).toBe("#ffff00");
  });

  it("보색의 보색은 원래 색", () => {
    const original = "#336699";
    const c = complement(complement(original));
    // HSL 반올림으로 1~2 채널 오차 허용
    const { r: r1, g: g1, b: b1 } = hexToRgb(original);
    const { r: r2, g: g2, b: b2 } = hexToRgb(c);
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(2);
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(2);
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(2);
  });
});

// ─── isLight ──────────────────────────────────────────────────────────────────

describe("isLight", () => {
  it("흰색은 light", () => {
    expect(isLight("#ffffff")).toBe(true);
  });

  it("검정은 dark", () => {
    expect(isLight("#000000")).toBe(false);
  });

  it("밝은 노랑은 light", () => {
    expect(isLight("#ffff00")).toBe(true);
  });

  it("짙은 남색은 dark", () => {
    expect(isLight("#003366")).toBe(false);
  });

  it("접근성 사용 — 배경색에 맞는 텍스트 색 선택", () => {
    const textColor = (bg: string) => isLight(bg) ? "#000000" : "#ffffff";
    expect(textColor("#ffffff")).toBe("#000000"); // 흰 배경 → 검정 글자
    expect(textColor("#000000")).toBe("#ffffff"); // 검정 배경 → 흰 글자
    expect(textColor("#336699")).toBe("#ffffff"); // 짙은 파랑 → 흰 글자
  });
});
