import { describe, expect, it } from "vitest";
import { lerp, mapRange, normalize, percentage } from "./math";

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

describe("mapRange", () => {
  describe("기본 매핑", () => {
    it("[0,100] → [0,800] 중간값", () => {
      expect(mapRange(50, 0, 100, 0, 800)).toBe(400);
    });

    it("입력 범위의 시작 → 출력 범위의 시작", () => {
      expect(mapRange(0, 0, 100, 0, 255)).toBe(0);
    });

    it("입력 범위의 끝 → 출력 범위의 끝", () => {
      expect(mapRange(100, 0, 100, 0, 255)).toBe(255);
    });

    it("온도 변환: 섭씨 → 화씨", () => {
      expect(mapRange(0, 0, 100, 32, 212)).toBe(32);
      expect(mapRange(100, 0, 100, 32, 212)).toBe(212);
      expect(mapRange(50, 0, 100, 32, 212)).toBe(122);
    });

    it("슬라이더 비율(0~1) → 볼륨(0~100)", () => {
      expect(mapRange(0.7, 0, 1, 0, 100)).toBe(70);
      expect(mapRange(0, 0, 1, 0, 100)).toBe(0);
      expect(mapRange(1, 0, 1, 0, 100)).toBe(100);
    });
  });

  describe("범위 초과 (extrapolation)", () => {
    it("입력이 inMax를 넘으면 extrapolation된다", () => {
      expect(mapRange(150, 0, 100, 0, 255)).toBeCloseTo(382.5);
    });

    it("입력이 inMin보다 작으면 extrapolation된다", () => {
      expect(mapRange(-50, 0, 100, 0, 255)).toBeCloseTo(-127.5);
    });
  });

  describe("clamp 옵션", () => {
    it("clamp:true 이면 결과가 [outMin, outMax]를 벗어나지 않는다", () => {
      expect(mapRange(150, 0, 100, 0, 255, true)).toBe(255);
      expect(mapRange(-50, 0, 100, 0, 255, true)).toBe(0);
    });

    it("clamp:true, 범위 내 값은 그대로 반환한다", () => {
      expect(mapRange(50, 0, 100, 0, 255, true)).toBeCloseTo(127.5);
    });

    it("역방향 출력 범위에서도 clamp가 동작한다", () => {
      // outMin=255, outMax=0 (내림차순)
      expect(mapRange(150, 0, 100, 255, 0, true)).toBe(0);
      expect(mapRange(-50, 0, 100, 255, 0, true)).toBe(255);
    });
  });

  describe("엣지 케이스", () => {
    it("inMin === inMax 이면 outMin을 반환한다 (division by zero 방지)", () => {
      expect(mapRange(50, 100, 100, 0, 255)).toBe(0);
    });

    it("역방향 입력 범위도 지원한다 (inMax < inMin)", () => {
      // [100,0] → [0,255]: 값 100이 시작, 0이 끝
      expect(mapRange(100, 100, 0, 0, 255)).toBe(0);
      expect(mapRange(0, 100, 0, 0, 255)).toBe(255);
    });

    it("역방향 출력 범위도 지원한다", () => {
      // 오디오 레벨 반전: 0dB=0%, -60dB=100%
      expect(mapRange(0, 0, -60, 0, 100)).toBe(0);
      expect(mapRange(-60, 0, -60, 0, 100)).toBe(100);
      expect(mapRange(-30, 0, -60, 0, 100)).toBe(50);
    });
  });

  describe("normalize + lerp와의 동치 관계", () => {
    it("mapRange(v, a, b, c, d) === lerp(c, d, normalize(v, a, b))", () => {
      const v = 37, a = 10, b = 90, c = -100, d = 200;
      const viaCompose = lerp(c, d, normalize(v, a, b));
      expect(mapRange(v, a, b, c, d)).toBeCloseTo(viaCompose);
    });
  });

  describe("실사용 시나리오", () => {
    it("데이터 시각화 — 데이터 값 → 차트 픽셀 좌표", () => {
      const data = [0, 25, 50, 75, 100];
      const chartWidth = 600;
      const pixels = data.map(v => mapRange(v, 0, 100, 0, chartWidth));
      expect(pixels).toEqual([0, 150, 300, 450, 600]);
    });

    it("게임 — 체력(0~100)을 색상 채널(255→0)으로 매핑", () => {
      // 100% 체력: green(0 → 0), 0% 체력: red(255 → 255)
      const hp = 60;
      const red   = Math.round(mapRange(hp, 100, 0, 0, 255, true)); // 낮을수록 빨강
      const green = Math.round(mapRange(hp, 0, 100, 0, 255, true)); // 높을수록 초록
      expect(red).toBe(102);
      expect(green).toBe(153);
    });

    it("배열에 일괄 적용 — 점수 분포 정규화", () => {
      const scores = [40, 55, 70, 85, 95];
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const normalized = scores.map(s =>
        Math.round(mapRange(s, minScore, maxScore, 0, 100))
      );
      expect(normalized[0]).toBe(0);
      expect(normalized[normalized.length - 1]).toBe(100);
    });
  });
});
