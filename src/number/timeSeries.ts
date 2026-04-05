/**
 * 시계열 윈도우 (Time Series Window).
 *
 * 시간 기반 슬라이딩 윈도우로 rate, throughput, 이동 평균,
 * min/max를 실시간 추적한다. 모니터링 대시보드, 성능 측정,
 * rate limiter 내부, 헬스체크 등에 활용.
 *
 * @example
 * const ts = createTimeSeries({ window: 60_000 }); // 1분 윈도우
 *
 * // 요청마다 기록
 * ts.add(1);
 * ts.add(1);
 *
 * ts.rate();  // 초당 요청 수 (RPS)
 * ts.sum();   // 윈도우 내 총합
 * ts.avg();   // 평균 값
 * ts.count(); // 데이터 포인트 수
 *
 * @example
 * // 응답 시간 추적
 * const latency = createTimeSeries({ window: 30_000 });
 *
 * latency.add(120);  // 120ms
 * latency.add(85);   // 85ms
 *
 * latency.avg();     // 평균 레이턴시
 * latency.min();     // 최소
 * latency.max();     // 최대
 * latency.p(95);     // 95th 퍼센타일
 *
 * @complexity
 * - add: O(1)
 * - rate/sum/avg/min/max: O(n) n = 윈도우 내 포인트 수
 * - p (퍼센타일): O(n log n)
 */

export interface TimeSeriesOptions {
  /** 윈도우 크기 (ms). 이 시간보다 오래된 데이터는 제거된다. */
  window: number;
  /** 현재 시각을 반환하는 함수 (테스트용 주입). 기본: Date.now */
  now?: () => number;
}

interface DataPoint {
  time: number;
  value: number;
}

export interface TimeSeries {
  /** 데이터 포인트를 추가한다. */
  add(value: number): void;

  /** 윈도우 내 데이터 포인트 수. */
  count(): number;

  /** 윈도우 내 합계. */
  sum(): number;

  /** 윈도우 내 평균. */
  avg(): number;

  /** 윈도우 내 최솟값. */
  min(): number;

  /** 윈도우 내 최댓값. */
  max(): number;

  /** 초당 rate (합계 / 경과 초). */
  rate(): number;

  /** 퍼센타일. p(95) = 95th 퍼센타일. */
  p(percentile: number): number;

  /** 윈도우 내 데이터를 초기화한다. */
  reset(): void;
}

export function createTimeSeries(options: TimeSeriesOptions): TimeSeries {
  const { window: windowMs, now = Date.now } = options;
  const points: DataPoint[] = [];

  function prune(): void {
    const cutoff = now() - windowMs;
    while (points.length > 0 && points[0].time < cutoff) {
      points.shift();
    }
  }

  const ts: TimeSeries = {
    add(value: number): void {
      points.push({ time: now(), value });
      prune();
    },

    count(): number {
      prune();
      return points.length;
    },

    sum(): number {
      prune();
      let total = 0;
      for (const p of points) total += p.value;
      return total;
    },

    avg(): number {
      prune();
      if (points.length === 0) return 0;
      let total = 0;
      for (const p of points) total += p.value;
      return total / points.length;
    },

    min(): number {
      prune();
      if (points.length === 0) return 0;
      let m = Infinity;
      for (const p of points) {
        if (p.value < m) m = p.value;
      }
      return m;
    },

    max(): number {
      prune();
      if (points.length === 0) return 0;
      let m = -Infinity;
      for (const p of points) {
        if (p.value > m) m = p.value;
      }
      return m;
    },

    rate(): number {
      prune();
      if (points.length === 0) return 0;
      const elapsed = (now() - points[0].time) / 1000;
      if (elapsed === 0) return 0;
      let total = 0;
      for (const p of points) total += p.value;
      return total / elapsed;
    },

    p(percentile: number): number {
      prune();
      if (points.length === 0) return 0;
      const sorted = points.map((p) => p.value).sort((a, b) => a - b);
      const idx = Math.ceil((percentile / 100) * sorted.length) - 1;
      return sorted[Math.max(0, idx)];
    },

    reset(): void {
      points.length = 0;
    },
  };

  return ts;
}
