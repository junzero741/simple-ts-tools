/**
 * fn이 interval ms 내에 최대 한 번만 실행되도록 제한한다. (leading-edge)
 * 반환된 함수는 .cancel()로 쿨다운을 초기화할 수 있다.
 * @example
 * const onScroll = throttle(() => updatePosition(), 100);
 * window.addEventListener("scroll", onScroll);
 * @complexity Time: O(1) | Space: O(1)
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      lastCall = now;
      fn(...args);
    } else if (timer === undefined) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = undefined;
        fn(...args);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    lastCall = 0;
  };

  return throttled as T & { cancel: () => void };
}
