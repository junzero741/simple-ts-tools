import { describe, it, expect } from "vitest";
import { createRateMeter } from "./rateMeter";

function createMockClock() {
  let time = 0;
  return {
    now: () => time,
    advance: (ms: number) => { time += ms; },
  };
}

describe("createRateMeter", () => {
  describe("mark / count", () => {
    it("이벤트를 카운트한다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now });

      meter.mark();
      meter.mark();
      meter.mark(3);

      expect(meter.count).toBe(5);
    });

    it("기본값은 1", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now });

      meter.mark();
      expect(meter.count).toBe(1);
    });
  });

  describe("meanRate", () => {
    it("전체 평균 rate를 계산한다", () => {
      const clock = createMockClock();
      clock.advance(1); // startTime != 0
      const meter = createRateMeter({ now: clock.now });

      meter.mark(100);
      clock.advance(10_000); // 10초

      // 100 events / 10 seconds = 10 events/sec
      expect(meter.meanRate).toBeCloseTo(10, 0);
    });

    it("시작 시 0", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now });
      expect(meter.meanRate).toBe(0);
    });
  });

  describe("EWMA rates", () => {
    it("tick 후 rate가 계산된다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      // 100개 이벤트 기록
      meter.mark(100);

      // 1 tick (1초) 경과
      clock.advance(1000);
      const r1 = meter.rate1();

      // 첫 tick이므로 instantRate = 100/1 = 100
      expect(r1).toBe(100);
    });

    it("이벤트가 없으면 rate가 감소한다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      meter.mark(100);
      clock.advance(1000);
      const initial = meter.rate1();

      // 추가 이벤트 없이 시간 경과
      clock.advance(5000);
      const later = meter.rate1();

      expect(later).toBeLessThan(initial);
    });

    it("지속적인 이벤트로 rate가 안정화된다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      // 매 tick마다 10개씩 기록 (60번 = 1분)
      for (let i = 0; i < 60; i++) {
        meter.mark(10);
        clock.advance(1000);
      }

      // 1분간 10 events/sec → rate1이 10에 수렴
      expect(meter.rate1()).toBeCloseTo(10, 0);
    });

    it("rate5는 rate1보다 느리게 변한다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      // 높은 burst
      meter.mark(1000);
      clock.advance(1000);

      const r1 = meter.rate1();
      const r5 = meter.rate5();

      // 첫 tick이므로 둘 다 같은 값
      expect(r1).toBe(r5);

      // burst 후 조용히
      for (let i = 0; i < 30; i++) {
        clock.advance(1000);
      }

      // rate1이 더 빨리 감소
      expect(meter.rate1()).toBeLessThan(meter.rate5());
    });

    it("rate15는 가장 느리게 변한다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      meter.mark(1000);
      clock.advance(1000);

      // 60초 조용히
      for (let i = 0; i < 60; i++) {
        clock.advance(1000);
      }

      expect(meter.rate1()).toBeLessThan(meter.rate5());
      expect(meter.rate5()).toBeLessThan(meter.rate15());
    });
  });

  describe("reset", () => {
    it("모든 상태를 초기화한다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      meter.mark(100);
      clock.advance(1000);

      meter.reset();
      expect(meter.count).toBe(0);
      expect(meter.rate1()).toBe(0);
      expect(meter.meanRate).toBe(0);
    });
  });

  describe("여러 tick 간격 누락", () => {
    it("오래 경과 후에도 정확히 tick을 따라잡는다", () => {
      const clock = createMockClock();
      const meter = createRateMeter({ now: clock.now, tickInterval: 1000 });

      meter.mark(100);
      clock.advance(10_000); // 10 ticks 한 번에

      // 에러 없이 rate를 계산
      expect(meter.rate1()).toBeGreaterThanOrEqual(0);
      expect(meter.rate5()).toBeGreaterThanOrEqual(0);
    });
  });
});
