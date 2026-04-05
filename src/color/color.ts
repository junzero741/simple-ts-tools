// ─── 내부 타입 ─────────────────────────────────────────────────────────────────

interface RGBA { r: number; g: number; b: number; a: number }
interface HSLA { h: number; s: number; l: number; a: number }

// ─── 파싱 / 변환 (내부) ────────────────────────────────────────────────────────

function parseHex(hex: string): RGBA {
  const clean = hex.replace(/^#/, "");

  let r: number, g: number, b: number, a = 1;

  if (clean.length === 3 || clean.length === 4) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
    if (clean.length === 4) a = parseInt(clean[3] + clean[3], 16) / 255;
  } else if (clean.length === 6 || clean.length === 8) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
    if (clean.length === 8) a = parseInt(clean.slice(6, 8), 16) / 255;
  } else {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  return { r, g, b, a };
}

function rgbaToHex({ r, g, b, a }: RGBA): string {
  const toHex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  const base = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? base + toHex(Math.round(a * 255)) : base;
}

function rgbaToHsla({ r, g, b, a }: RGBA): HSLA {
  const nr = r / 255, ng = g / 255, nb = b / 255;
  const max = Math.max(nr, ng, nb), min = Math.min(nr, ng, nb);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case nr: h = ((ng - nb) / d + (ng < nb ? 6 : 0)) / 6; break;
      case ng: h = ((nb - nr) / d + 2) / 6; break;
      case nb: h = ((nr - ng) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslaToRgba({ h, s, l, a }: HSLA): RGBA {
  const hn = h / 360, sn = s / 100, ln = l / 100;

  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v, a };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;

  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
    a,
  };
}

// ─── 공개 API ──────────────────────────────────────────────────────────────────

/**
 * HEX 색상을 RGB(A) 객체로 변환한다.
 * `#RGB`, `#RRGGBB`, `#RGBA`, `#RRGGBBAA` 형식을 모두 지원한다.
 *
 * @example
 * hexToRgb("#ff6600")        // { r: 255, g: 102, b: 0, a: 1 }
 * hexToRgb("#f60")           // { r: 255, g: 102, b: 0, a: 1 }
 * hexToRgb("#ff660080")      // { r: 255, g: 102, b: 0, a: 0.502 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  const { r, g, b, a } = parseHex(hex);
  return { r, g, b, a: Math.round(a * 1000) / 1000 };
}

/**
 * RGB(A) 값을 HEX 문자열로 변환한다.
 * alpha < 1이면 8자리 hex(`#RRGGBBAA`)로 반환한다.
 *
 * @example
 * rgbToHex(255, 102, 0)         // "#ff6600"
 * rgbToHex(255, 102, 0, 0.5)   // "#ff660080"
 */
export function rgbToHex(r: number, g: number, b: number, a = 1): string {
  return rgbaToHex({ r, g, b, a });
}

/**
 * HEX 색상을 HSL(A) 객체로 변환한다.
 * h: 0–360, s: 0–100, l: 0–100
 *
 * @example
 * hexToHsl("#ff0000")   // { h: 0, s: 100, l: 50, a: 1 }
 * hexToHsl("#00ff00")   // { h: 120, s: 100, l: 50, a: 1 }
 * hexToHsl("#0000ff")   // { h: 240, s: 100, l: 50, a: 1 }
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number; a: number } {
  return rgbaToHsla(parseHex(hex));
}

/**
 * HSL(A) 값을 HEX 문자열로 변환한다.
 *
 * @example
 * hslToHex(0, 100, 50)       // "#ff0000"
 * hslToHex(120, 100, 50)     // "#00ff00"
 * hslToHex(240, 100, 50, 0.5) // "#0000ff80"
 */
export function hslToHex(h: number, s: number, l: number, a = 1): string {
  return rgbaToHex(hslaToRgba({ h, s, l, a }));
}

/**
 * 색상을 밝게 만든다. amount는 0(변화 없음)~1(흰색).
 *
 * @example
 * lighten("#336699", 0.2)  // lightness +20%p → "#4d80b3"
 */
export function lighten(hex: string, amount: number): string {
  const { h, s, l, a } = rgbaToHsla(parseHex(hex));
  return rgbaToHex(hslaToRgba({ h, s, l: Math.min(100, l + amount * 100), a }));
}

/**
 * 색상을 어둡게 만든다. amount는 0(변화 없음)~1(검정).
 *
 * @example
 * darken("#336699", 0.2)  // lightness -20%p → "#1a334d"
 */
export function darken(hex: string, amount: number): string {
  const { h, s, l, a } = rgbaToHsla(parseHex(hex));
  return rgbaToHex(hslaToRgba({ h, s, l: Math.max(0, l - amount * 100), a }));
}

/**
 * 색상의 채도를 높인다. amount는 0(변화 없음)~1(최대 채도).
 *
 * @example
 * saturate("#7f9f7f", 0.5)  // saturation +50%p
 */
export function saturate(hex: string, amount: number): string {
  const { h, s, l, a } = rgbaToHsla(parseHex(hex));
  return rgbaToHex(hslaToRgba({ h, s: Math.min(100, s + amount * 100), l, a }));
}

/**
 * 색상의 채도를 낮춘다. amount는 0(변화 없음)~1(무채색).
 *
 * @example
 * desaturate("#ff6600", 0.5)  // saturation -50%p → 회색빛
 */
export function desaturate(hex: string, amount: number): string {
  const { h, s, l, a } = rgbaToHsla(parseHex(hex));
  return rgbaToHex(hslaToRgba({ h, s: Math.max(0, s - amount * 100), l, a }));
}

/**
 * 색상의 불투명도(alpha)를 설정한다. opacity는 0(투명)~1(불투명).
 * opacity < 1이면 8자리 hex를 반환한다.
 *
 * @example
 * setAlpha("#ff6600", 0.5)   // "#ff660080"
 * setAlpha("#ff660080", 1)   // "#ff6600"
 */
export function setAlpha(hex: string, opacity: number): string {
  const { r, g, b } = parseHex(hex);
  return rgbaToHex({ r, g, b, a: Math.max(0, Math.min(1, opacity)) });
}

/**
 * 두 색상을 혼합한다. weight는 0(첫 번째 색상)~1(두 번째 색상), 기본 0.5.
 *
 * @example
 * mix("#ff0000", "#0000ff")        // "#800080" (보라)
 * mix("#ff0000", "#0000ff", 0.25)  // 25% 두 번째 색 → 빨강에 가까운 보라
 * mix("#ff0000", "#0000ff", 0.75)  // 75% 두 번째 색 → 파랑에 가까운 보라
 */
export function mix(hex1: string, hex2: string, weight = 0.5): string {
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  const w = Math.max(0, Math.min(1, weight));
  return rgbaToHex({
    r: Math.round(c1.r + (c2.r - c1.r) * w),
    g: Math.round(c1.g + (c2.g - c1.g) * w),
    b: Math.round(c1.b + (c2.b - c1.b) * w),
    a: c1.a + (c2.a - c1.a) * w,
  });
}

/**
 * 색상의 보색(hue + 180°)을 반환한다.
 *
 * @example
 * complement("#ff6600")  // "#0099ff"
 */
export function complement(hex: string): string {
  const { h, s, l, a } = rgbaToHsla(parseHex(hex));
  return rgbaToHex(hslaToRgba({ h: (h + 180) % 360, s, l, a }));
}

/**
 * 색상이 밝은지(light) 어두운지(dark) 판별한다.
 * W3C WCAG 상대 휘도 공식을 사용한다.
 *
 * 흰 글자/검정 글자 자동 선택 등 접근성 처리에 유용하다.
 *
 * @example
 * isLight("#ffffff")   // true
 * isLight("#000000")   // false
 * isLight("#ff6600")   // false
 *
 * // 사용 예: 배경색에 맞는 텍스트 색 선택
 * const textColor = isLight(bgColor) ? "#000000" : "#ffffff";
 */
export function isLight(hex: string): boolean {
  const { r, g, b } = parseHex(hex);
  // W3C 상대 휘도 공식
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.179;
}
