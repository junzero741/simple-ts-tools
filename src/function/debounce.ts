/**
 * 마지막 호출 후 wait ms가 지난 뒤에 fn을 실행한다.
 * 반환된 함수는 .cancel()로 예약을 취소할 수 있다.
 * @example
 * const search = debounce((q: string) => fetchResults(q), 300);
 * input.addEventListener("input", e => search(e.target.value));
 * @complexity Time: O(1) | Space: O(1)
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced as T & { cancel: () => void };
}
