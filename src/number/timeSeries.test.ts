import { describe, it, expect } from "vitest";
import { createTimeSeries } from "./timeSeries";

function createMockClock() {
  let time = 1000;
  return {
    now: () => time,
    advance: (ms: number) => { time += ms; },
  };
}

describe("createTimeSeries", () => {
  describe("add / count", () => {
    it("데이터 포인트를 추가한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(1);
      ts.add(2);
      ts.add(3);

      expect(ts.count()).toBe(3);
    });

    it("윈도우 밖의 데이터를 제거한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 1000, now: clock.now });

      ts.add(1);
      clock.advance(500);
      ts.add(2);
      clock.advance(600); // 첫 번째 포인트가 윈도우 밖
      ts.add(3);

      expect(ts.count()).toBe(2);
    });
  });

  describe("sum", () => {
    it("윈도우 내 합계를 반환한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(10);
      ts.add(20);
      ts.add(30);

      expect(ts.sum()).toBe(60);
    });

    it("만료된 포인트를 제외한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 1000, now: clock.now });

      ts.add(100);
      clock.advance(1100);
      ts.add(50);

      expect(ts.sum()).toBe(50);
    });
  });

  describe("avg", () => {
    it("평균을 반환한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(10);
      ts.add(20);
      ts.add(30);

      expect(ts.avg()).toBe(20);
    });

    it("빈 시리즈는 0을 반환한다", () => {
      const ts = createTimeSeries({ window: 10_000 });
      expect(ts.avg()).toBe(0);
    });
  });

  describe("min / max", () => {
    it("최소/최대를 반환한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(50);
      ts.add(10);
      ts.add(80);
      ts.add(30);

      expect(ts.min()).toBe(10);
      expect(ts.max()).toBe(80);
    });

    it("빈 시리즈는 0을 반환한다", () => {
      const ts = createTimeSeries({ window: 10_000 });
      expect(ts.min()).toBe(0);
      expect(ts.max()).toBe(0);
    });
  });

  describe("rate", () => {
    it("초당 rate를 반환한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(1);
      clock.advance(1000);
      ts.add(1);
      clock.advance(1000);
      ts.add(1);

      // 3개 포인트, 2초 경과 → rate = 3/2 = 1.5
      expect(ts.rate()).toBe(1.5);
    });

    it("빈 시리즈는 0을 반환한다", () => {
      const ts = createTimeSeries({ window: 10_000 });
      expect(ts.rate()).toBe(0);
    });
  });

  describe("p (퍼센타일)", () => {
    it("50th 퍼센타일 (중앙값)", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      for (const v of [10, 20, 30, 40, 50]) {
        ts.add(v);
        clock.advance(100);
      }

      expect(ts.p(50)).toBe(30);
    });

    it("95th 퍼센타일", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 60_000, now: clock.now });

      for (let i = 1; i <= 100; i++) {
        ts.add(i);
        clock.advance(10);
      }

      expect(ts.p(95)).toBe(95);
    });

    it("100th 퍼센타일 = max", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(10);
      clock.advance(100);
      ts.add(99);
      clock.advance(100);
      ts.add(50);

      expect(ts.p(100)).toBe(99);
    });

    it("빈 시리즈는 0을 반환한다", () => {
      const ts = createTimeSeries({ window: 10_000 });
      expect(ts.p(50)).toBe(0);
    });
  });

  describe("reset", () => {
    it("모든 데이터를 제거한다", () => {
      const clock = createMockClock();
      const ts = createTimeSeries({ window: 10_000, now: clock.now });

      ts.add(1);
      ts.add(2);
      ts.reset();

      expect(ts.count()).toBe(0);
      expect(ts.sum()).toBe(0);
    });
  });

  describe("실전 시나리오", () => {
    it("응답 시간 추적", () => {
      const clock = createMockClock();
      const latency = createTimeSeries({ window: 5000, now: clock.now });

      const samples = [120, 85, 200, 95, 110, 500, 88, 102, 97, 105];
      for (const s of samples) {
        latency.add(s);
        clock.advance(100);
      }

      expect(latency.count()).toBe(10);
      expect(latency.min()).toBe(85);
      expect(latency.max()).toBe(500);
      expect(latency.avg()).toBeCloseTo(150.2, 1);
      expect(latency.p(95)).toBe(500);
    });
  });
});
