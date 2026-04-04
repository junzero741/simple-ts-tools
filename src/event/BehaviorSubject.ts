/**
 * 현재 값을 보유하고, 값이 바뀔 때마다 구독자에게 알리는 반응형 상태 홀더.
 * 새 구독자는 즉시 현재 값을 받는다.
 * complete() 후에는 더 이상 알림이 전달되지 않는다.
 *
 * @example
 * const count$ = new BehaviorSubject(0);
 *
 * const unsub = count$.subscribe(v => console.log(v)); // 즉시 0 출력
 * count$.set(1);                 // 1 출력
 * count$.update(v => v + 1);    // 2 출력
 * console.log(count$.getValue()); // 2
 *
 * unsub();          // 구독 해제
 * count$.complete(); // 완료 처리
 */
export class BehaviorSubject<T> {
  private value: T;
  private subscribers = new Set<(value: T) => void>();
  private completed = false;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  /** 현재 값을 동기적으로 반환한다. */
  getValue(): T {
    return this.value;
  }

  /**
   * 새 값을 설정한다. 이전 값과 같으면 알림을 보내지 않는다.
   * complete() 이후에는 무시된다.
   */
  set(newValue: T): void {
    if (this.completed || Object.is(this.value, newValue)) return;
    this.value = newValue;
    this.notify();
  }

  /**
   * 현재 값을 기반으로 새 값을 계산하여 설정한다.
   * @example count$.update(v => v + 1)
   */
  update(fn: (current: T) => T): void {
    this.set(fn(this.value));
  }

  /**
   * 구독을 등록한다. 등록 즉시 현재 값으로 핸들러가 호출된다.
   * @returns 구독 해제 함수
   */
  subscribe(handler: (value: T) => void): () => void {
    this.subscribers.add(handler);
    handler(this.value); // 즉시 현재 값 전달

    return () => {
      this.subscribers.delete(handler);
    };
  }

  /**
   * Subject를 완료 상태로 전환한다.
   * 이후 set/update 호출은 무시되며 모든 구독이 해제된다.
   */
  complete(): void {
    this.completed = true;
    this.subscribers.clear();
  }

  /** 현재 구독자 수를 반환한다. */
  get subscriberCount(): number {
    return this.subscribers.size;
  }

  /** 완료 여부를 반환한다. */
  get isCompleted(): boolean {
    return this.completed;
  }

  private notify(): void {
    for (const handler of this.subscribers) {
      handler(this.value);
    }
  }
}
