// 지수 이동 평균 처리량 측정기 (Rate Meter / EWMA).
//
// Unix load average와 동일한 EWMA(Exponentially Weighted Moving Average)로
// 초당 이벤트 수(rate)를 추적한다. 1분/5분/15분 평균을 동시에 제공.
//
// 서버 RPS, 메시지 처리량, 에러율, 네트워크 패킷 카운터 등에 활용.
//
// const meter = createRateMeter();
//
// // 이벤트 발생마다 mark
// meter.mark();
// meter.mark(5); // 5개 이벤트 한 번에 기록
//
// meter.rate1();  // 1분 EWMA (events/sec)
// meter.rate5();  // 5분 EWMA
// meter.rate15(); // 15분 EWMA
// meter.count;    // 총 이벤트 수
// meter.meanRate; // 전체 평균 (count / 경과초)

const TICK_INTERVAL = 5000; // 5초마다 EWMA 갱신
const M1_ALPHA = 1 - Math.exp(-TICK_INTERVAL / 60000);
const M5_ALPHA = 1 - Math.exp(-TICK_INTERVAL / 300000);
const M15_ALPHA = 1 - Math.exp(-TICK_INTERVAL / 900000);

export interface RateMeter {
  /** n개 이벤트를 기록한다 (기본 1). */
  mark(n?: number): void;

  /** 1분 EWMA (events/sec). */
  rate1(): number;

  /** 5분 EWMA (events/sec). */
  rate5(): number;

  /** 15분 EWMA (events/sec). */
  rate15(): number;

  /** 전체 평균 rate (events/sec). */
  readonly meanRate: number;

  /** 총 이벤트 수. */
  readonly count: number;

  /** 측정기를 초기화한다. */
  reset(): void;
}

export interface RateMeterOptions {
  /** 현재 시각 함수 (테스트용). 기본: Date.now */
  now?: () => number;
  /** tick 간격 ms (기본: 5000). 짧을수록 반응이 빠르지만 CPU 사용 증가. */
  tickInterval?: number;
}

class EWMA {
  private rate = 0;
  private uncounted = 0;
  private initialized = false;

  constructor(private alpha: number, private intervalSec: number) {}

  update(n: number): void {
    this.uncounted += n;
  }

  tick(): void {
    const instantRate = this.uncounted / this.intervalSec;
    this.uncounted = 0;

    if (this.initialized) {
      this.rate += this.alpha * (instantRate - this.rate);
    } else {
      this.rate = instantRate;
      this.initialized = true;
    }
  }

  getRate(): number {
    return this.rate;
  }

  reset(): void {
    this.rate = 0;
    this.uncounted = 0;
    this.initialized = false;
  }
}

export function createRateMeter(options: RateMeterOptions = {}): RateMeter {
  const { now = Date.now, tickInterval = TICK_INTERVAL } = options;
  const intervalSec = tickInterval / 1000;

  const customM1Alpha = 1 - Math.exp(-tickInterval / 60000);
  const customM5Alpha = 1 - Math.exp(-tickInterval / 300000);
  const customM15Alpha = 1 - Math.exp(-tickInterval / 900000);

  const m1 = new EWMA(customM1Alpha, intervalSec);
  const m5 = new EWMA(customM5Alpha, intervalSec);
  const m15 = new EWMA(customM15Alpha, intervalSec);

  let totalCount = 0;
  let startTime = now();
  let lastTick = now();

  function tickIfNeeded(): void {
    const current = now();
    const elapsed = current - lastTick;
    const ticks = Math.floor(elapsed / tickInterval);

    for (let i = 0; i < ticks; i++) {
      m1.tick();
      m5.tick();
      m15.tick();
      lastTick += tickInterval;
    }
  }

  const meter: RateMeter = {
    mark(n: number = 1): void {
      tickIfNeeded();
      totalCount += n;
      m1.update(n);
      m5.update(n);
      m15.update(n);
    },

    rate1(): number {
      tickIfNeeded();
      return m1.getRate();
    },

    rate5(): number {
      tickIfNeeded();
      return m5.getRate();
    },

    rate15(): number {
      tickIfNeeded();
      return m15.getRate();
    },

    get meanRate(): number {
      const elapsed = (now() - startTime) / 1000;
      if (elapsed === 0) return 0;
      return totalCount / elapsed;
    },

    get count(): number {
      return totalCount;
    },

    reset(): void {
      totalCount = 0;
      startTime = now();
      lastTick = now();
      m1.reset();
      m5.reset();
      m15.reset();
    },
  };

  return meter;
}
