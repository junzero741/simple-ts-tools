import { describe, expect, it } from "vitest";
import { lerp, normalize, percentage } from "./math";

describe("lerp", () => {
  it("t=0이면 start를 반환한다", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("t=1이면 end를 반환한다", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("t=0.5이면 중간값을 반환한다", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it("t=0.25 선형 보간", () => {
    expect(lerp(0, 100, 0.25)).toBe(25);
  });

  it("음수 범위에서도 동작한다", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
    expect(lerp(-100, 0, 0.25)).toBe(-75);
  });

  it("t > 1 extrapolation을 허용한다", () => {
    expect(lerp(0, 100, 1.5)).toBe(150);
  });

  it("t < 0 extrapolation을 허용한다", () => {
    expect(lerp(0, 100, -0.5)).toBe(-50);
  });

  it("start === end이면 항상 같은 값을 반환한다", () => {
    expect(lerp(5, 5, 0.5)).toBe(5);
  });
});

describe("normalize", () => {
  it("범위 내 중간값 → 0.5", () => {
    expect(normalize(50, 0, 100)).toBe(0.5);
  });

  it("min 값 → 0", () => {
    expect(normalize(0, 0, 100)).toBe(0);
    expect(normalize(-10, -10, 10)).toBe(0);
  });

  it("max 값 → 1", () => {
    expect(normalize(100, 0, 100)).toBe(1);
  });

  it("범위 초과 허용 (clamp: false 기본)", () => {
    expect(normalize(150, 0, 100)).toBe(1.5);
    expect(normalize(-50, 0, 100)).toBe(-0.5);
  });

  it("clamp: true이면 결과를 [0, 1]로 제한한다", () => {
    expect(normalize(150, 0, 100, true)).toBe(1);
    expect(normalize(-50, 0, 100, true)).toBe(0);
  });

  it("min === max이면 0을 반환한다 (division by zero 방지)", () => {
    expect(normalize(5, 5, 5)).toBe(0);
  });

  it("음수 범위 정규화", () => {
    expect(normalize(0, -100, 100)).toBe(0.5);
  });
});

describe("percentage", () => {
  it("기본 백분율 계산", () => {
    expect(percentage(30, 200)).toBe(15);
    expect(percentage(50, 100)).toBe(50);
    expect(percentage(100, 100)).toBe(100);
  });

  it("소수점 자리수 지정", () => {
    expect(percentage(1, 3, 1)).toBe(33.3);
    expect(percentage(2, 3, 2)).toBe(66.67);
  });

  it("0%와 100%를 처리한다", () => {
    expect(percentage(0, 100)).toBe(0);
    expect(percentage(100, 100)).toBe(100);
  });

  it("total이 0이면 0을 반환한다", () => {
    expect(percentage(10, 0)).toBe(0);
    expect(percentage(0, 0)).toBe(0);
  });

  it("100%를 초과하는 값도 처리한다", () => {
    expect(percentage(150, 100)).toBe(150);
  });

  it("소수점 반올림이 올바르다", () => {
    expect(percentage(1, 3, 0)).toBe(33);   // 33.333... → 33
    expect(percentage(2, 3, 0)).toBe(67);   // 66.666... → 67
  });

  it("실사용: 진행률 표시", () => {
    const done = 37;
    const total = 50;
    expect(percentage(done, total, 1)).toBe(74);
  });
});
