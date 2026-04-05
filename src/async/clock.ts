/**
 * 테스트용 가짜 시계 (Fake Clock).
 *
 * 시간 의존 로직을 결정적으로 테스트하기 위한 가짜 타이머.
 * `tick(ms)`으로 시간을 수동 전진시키고, 예약된 타이머를 실행한다.
 *
 * vitest의 `vi.useFakeTimers()`와 달리 글로벌을 오염시키지 않고,
 * 코드에 clock 인스턴스를 주입하여 사용한다.
 *
 * @example
 * const clock = createClock();
 *
 * let called = false;
 * clock.setTimeout(() => { called = true; }, 1000);
 *
 * clock.tick(500);
 * // called === false
 *
 * clock.tick(500);
 * // called === true
 *
 * @example
 * // setInterval
 * const values: number[] = [];
 * clock.setInterval(() => values.push(clock.now()), 100);
 *
 * clock.tick(350);
 * // values === [100, 200, 300]
 *
 * @example
 * // sleep과 함께 사용
 * async function fetchWithDelay(clock: Clock) {
 *   await clock.sleep(1000);
 *   return "done";
 * }
 *
 * const p = fetchWithDelay(clock);
 * clock.tick(1000);
 * await p; // "done"
 *
 * @complexity Time: O(n log n) per tick, n = 예약된 타이머 수.
 */

export interface Clock {
  /** 현재 시각 (ms). */
  now(): number;

  /** 시간을 ms만큼 전진시키고 만료된 타이머를 실행한다. */
  tick(ms: number): void;

  /** 타이머를 예약한다. 핸들을 반환한다. */
  setTimeout(fn: () => void, delay: number): number;

  /** 타이머를 취소한다. */
  clearTimeout(handle: number): void;

  /** 반복 타이머를 예약한다. */
  setInterval(fn: () => void, interval: number): number;

  /** 반복 타이머를 취소한다. */
  clearInterval(handle: number): void;

  /** Promise 기반 대기. tick()으로 전진시킨다. */
  sleep(ms: number): Promise<void>;

  /** 모든 타이머를 제거한다. */
  reset(): void;

  /** 예약된 타이머 수. */
  readonly pendingTimers: number;
}

interface TimerEntry {
  id: number;
  fn: () => void;
  fireAt: number;
  interval: number | null; // null이면 setTimeout, 값이면 setInterval
  cancelled: boolean;
}

export function createClock(startTime: number = 0): Clock {
  let currentTime = startTime;
  let nextId = 1;
  const timers: TimerEntry[] = [];
  const sleepResolvers: Array<{ resolveAt: number; resolve: () => void }> = [];

  function addTimer(fn: () => void, delay: number, interval: number | null): number {
    const id = nextId++;
    timers.push({
      id,
      fn,
      fireAt: currentTime + Math.max(0, delay),
      interval,
      cancelled: false,
    });
    timers.sort((a, b) => a.fireAt - b.fireAt);
    return id;
  }

  function removeTimer(id: number): void {
    const entry = timers.find((t) => t.id === id);
    if (entry) entry.cancelled = true;
  }

  const clock: Clock = {
    now() {
      return currentTime;
    },

    tick(ms: number) {
      const target = currentTime + ms;

      while (true) {
        // 가장 빠른 미취소 타이머 찾기
        const idx = timers.findIndex((t) => !t.cancelled && t.fireAt <= target);
        if (idx === -1) break;

        const entry = timers[idx];
        currentTime = entry.fireAt;

        // sleep resolver 처리 (앞에서부터 순서대로)
        while (sleepResolvers.length > 0 && sleepResolvers[0].resolveAt <= currentTime) {
          sleepResolvers.shift()!.resolve();
        }

        if (entry.cancelled) continue;

        if (entry.interval !== null) {
          // setInterval: 다음 실행 예약
          entry.fireAt += entry.interval;
          entry.fn();
          timers.sort((a, b) => a.fireAt - b.fireAt);
        } else {
          // setTimeout: 한 번 실행 후 제거
          timers.splice(idx, 1);
          entry.fn();
        }
      }

      currentTime = target;

      // 남은 sleep resolver 처리
      while (sleepResolvers.length > 0 && sleepResolvers[0].resolveAt <= currentTime) {
        sleepResolvers.shift()!.resolve();
      }
    },

    setTimeout(fn, delay) {
      return addTimer(fn, delay, null);
    },

    clearTimeout(handle) {
      removeTimer(handle);
    },

    setInterval(fn, interval) {
      return addTimer(fn, interval, interval);
    },

    clearInterval(handle) {
      removeTimer(handle);
    },

    sleep(ms) {
      return new Promise<void>((resolve) => {
        sleepResolvers.push({ resolveAt: currentTime + ms, resolve });
        sleepResolvers.sort((a, b) => a.resolveAt - b.resolveAt);
      });
    },

    reset() {
      timers.length = 0;
      sleepResolvers.length = 0;
    },

    get pendingTimers() {
      return timers.filter((t) => !t.cancelled).length;
    },
  };

  return clock;
}
