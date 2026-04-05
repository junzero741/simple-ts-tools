// 정밀 소수 연산 (Precise Decimal Math).
//
// 부동소수점 오차 없이 금액, 세금, 환율 등을 정확하게 계산한다.
// 0.1 + 0.2 === 0.30000000000000004 문제를 해결.
// 내부적으로 정수 스케일링으로 연산하고, 최종 결과만 소수로 변환.
//
// preciseAdd(0.1, 0.2)        → 0.3
// preciseSubtract(1.0, 0.9)   → 0.1
// preciseMultiply(0.1, 0.2)   → 0.02
// preciseDivide(1, 3, 4)      → 0.3333
// preciseRound(2.555, 2)      → 2.56

function getScale(n: number): number {
  const str = String(n);
  const dotIdx = str.indexOf(".");
  if (dotIdx === -1) return 0;
  // e 표기법 처리
  const eIdx = str.indexOf("e-");
  if (eIdx !== -1) {
    return parseInt(str.slice(eIdx + 2), 10) + (str.indexOf(".") !== -1 ? str.slice(dotIdx + 1, eIdx).length : 0);
  }
  return str.length - dotIdx - 1;
}

function toInt(n: number, scale: number): number {
  return Math.round(n * Math.pow(10, scale));
}

/**
 * 정밀 덧셈. 0.1 + 0.2 = 0.3.
 */
export function preciseAdd(a: number, b: number): number {
  const scale = Math.max(getScale(a), getScale(b));
  const factor = Math.pow(10, scale);
  return (toInt(a, scale) + toInt(b, scale)) / factor;
}

/**
 * 정밀 뺄셈. 1.0 - 0.9 = 0.1.
 */
export function preciseSubtract(a: number, b: number): number {
  const scale = Math.max(getScale(a), getScale(b));
  const factor = Math.pow(10, scale);
  return (toInt(a, scale) - toInt(b, scale)) / factor;
}

/**
 * 정밀 곱셈. 0.1 * 0.2 = 0.02.
 */
export function preciseMultiply(a: number, b: number): number {
  const sa = getScale(a);
  const sb = getScale(b);
  return (toInt(a, sa) * toInt(b, sb)) / Math.pow(10, sa + sb);
}

/**
 * 정밀 나눗셈.
 * @param decimals 소수점 자릿수 (기본: 10)
 */
export function preciseDivide(a: number, b: number, decimals: number = 10): number {
  if (b === 0) throw new Error("Division by zero");
  const scale = Math.max(getScale(a), getScale(b));
  const result = toInt(a, scale) / toInt(b, scale);
  const factor = Math.pow(10, decimals);
  return Math.round(result * factor) / factor;
}

/**
 * 은행원 반올림 (Banker's rounding / Round half to even).
 * 0.5일 때 가장 가까운 짝수로 반올림한다.
 */
export function bankersRound(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const floored = Math.floor(shifted);
  const diff = shifted - floored;

  if (Math.abs(diff - 0.5) < 1e-10) {
    // 정확히 0.5 — 짝수로
    return (floored % 2 === 0 ? floored : floored + 1) / factor;
  }

  return Math.round(shifted) / factor;
}

/**
 * 정밀 반올림.
 */
export function preciseRound(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * 금액을 n등분한다. 나머지를 첫 번째 항에 합산.
 * splitAmount(100, 3) → [33.34, 33.33, 33.33]
 */
export function splitAmount(amount: number, parts: number, decimals: number = 2): number[] {
  if (parts < 1) throw new Error("parts must be at least 1");

  const factor = Math.pow(10, decimals);
  const total = Math.round(amount * factor);
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;

  const result: number[] = [];
  for (let i = 0; i < parts; i++) {
    result.push((base + (i < remainder ? 1 : 0)) / factor);
  }
  return result;
}

/**
 * 숫자를 지정 단위로 반올림/내림/올림한다.
 * roundTo(123.456, 0.05) → 123.45 (5센트 단위)
 * roundTo(17, 5) → 15 (5 단위)
 */
export function roundTo(value: number, step: number, mode: "round" | "floor" | "ceil" = "round"): number {
  const fn = mode === "floor" ? Math.floor : mode === "ceil" ? Math.ceil : Math.round;
  return fn(value / step) * step;
}
