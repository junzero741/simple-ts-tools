/**
 * Go 스타일 비동기 채널 (Channel).
 *
 * 두 비동기 컨텍스트 간의 타입 안전한 메시지 전달.
 * AsyncQueue와의 차이: unbuffered 모드(sender와 receiver가 동기화),
 * `select`(다중 채널 동시 대기)를 지원한다.
 *
 * - Unbuffered (capacity=0, 기본) — send는 receiver가 recv할 때까지 대기.
 * - Buffered (capacity>0) — 버퍼가 찰 때까지 send가 즉시 완료.
 *
 * @example
 * // Unbuffered 채널 — 동기화 포인트
 * const ch = createChannel<string>();
 *
 * // sender
 * (async () => {
 *   await ch.send("hello");  // recv될 때까지 대기
 *   await ch.send("world");
 *   ch.close();
 * })();
 *
 * // receiver
 * for await (const msg of ch) {
 *   console.log(msg); // "hello", "world"
 * }
 *
 * @example
 * // select — 여러 채널 중 먼저 도착한 것 수신
 * const ch1 = createChannel<number>();
 * const ch2 = createChannel<string>();
 *
 * const { index, value } = await select([ch1, ch2]);
 * if (index === 0) console.log("number:", value);
 * if (index === 1) console.log("string:", value);
 *
 * @complexity
 * - send/recv: O(1) 버퍼 여유 시, O(n) 대기 시 (n = 대기자 수)
 * - select: O(k) k = 채널 수
 */

export interface Channel<T> {
  /** 값을 채널에 보낸다. 버퍼가 가득 차면(unbuffered면 항상) 대기. */
  send(value: T): Promise<void>;

  /** 값을 채널에서 받는다. 비어있으면 대기. 닫힌 빈 채널은 undefined. */
  recv(): Promise<T | undefined>;

  /** 채널을 닫는다. 더 이상 send할 수 없다. 버퍼의 남은 값은 recv 가능. */
  close(): void;

  /** 닫혔는지 여부 */
  readonly closed: boolean;

  /** 버퍼에 있는 값 수 */
  readonly size: number;

  /** 비동기 이터레이터 */
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

export interface SelectResult<T extends unknown[]> {
  /** 값이 도착한 채널의 인덱스 */
  index: number;
  /** 수신한 값 */
  value: T[number];
}

export function createChannel<T>(capacity: number = 0): Channel<T> {
  if (capacity < 0) throw new Error("capacity must be non-negative");

  const buffer: T[] = [];
  let isClosed = false;

  const recvWaiters: Array<(value: T | undefined) => void> = [];
  const sendWaiters: Array<{ value: T; resolve: () => void }> = [];

  const channel: Channel<T> = {
    send(value: T): Promise<void> {
      if (isClosed) throw new Error("Cannot send on a closed channel");

      // receiver가 대기 중이면 직접 전달
      if (recvWaiters.length > 0) {
        const recv = recvWaiters.shift()!;
        recv(value);
        return Promise.resolve();
      }

      // buffered: 버퍼에 여유가 있으면 넣기
      if (capacity > 0 && buffer.length < capacity) {
        buffer.push(value);
        return Promise.resolve();
      }

      // 대기
      return new Promise<void>((resolve) => {
        sendWaiters.push({ value, resolve });
      });
    },

    recv(): Promise<T | undefined> {
      // 버퍼에 값이 있으면 꺼내기
      if (buffer.length > 0) {
        const value = buffer.shift()!;

        // 대기 중인 sender가 있으면 버퍼에 넣기
        if (sendWaiters.length > 0) {
          const sender = sendWaiters.shift()!;
          buffer.push(sender.value);
          sender.resolve();
        }

        return Promise.resolve(value);
      }

      // sender가 대기 중이면 직접 받기 (unbuffered)
      if (sendWaiters.length > 0) {
        const sender = sendWaiters.shift()!;
        sender.resolve();
        return Promise.resolve(sender.value);
      }

      // 닫힌 채널
      if (isClosed) return Promise.resolve(undefined);

      // 대기
      return new Promise<T | undefined>((resolve) => {
        recvWaiters.push(resolve);
      });
    },

    close(): void {
      if (isClosed) return;
      isClosed = true;

      // 대기 중인 receiver에게 종료 알림
      while (recvWaiters.length > 0) {
        recvWaiters.shift()!(undefined);
      }
    },

    get closed(): boolean {
      return isClosed;
    },

    get size(): number {
      return buffer.length;
    },

    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        async next(): Promise<IteratorResult<T>> {
          const value = await channel.recv();
          if (value === undefined && isClosed) {
            return { value: undefined as unknown as T, done: true };
          }
          return { value: value as T, done: false };
        },
      };
    },
  };

  return channel;
}

/**
 * 여러 채널 중 먼저 값이 도착한 채널에서 수신한다.
 * 모든 채널이 닫혀 있으면 undefined를 반환한다.
 */
export function select<T extends unknown[]>(
  channels: { [K in keyof T]: Channel<T[K]> },
): Promise<SelectResult<T> | undefined> {
  return new Promise<SelectResult<T> | undefined>((resolve) => {
    let resolved = false;
    const cleanups: Array<() => void> = [];

    // 모든 채널이 닫혀 있는지 확인
    const allClosed = channels.every((ch) => ch.closed && ch.size === 0);
    if (allClosed) {
      resolve(undefined);
      return;
    }

    for (let i = 0; i < channels.length; i++) {
      const ch = channels[i];

      const tryRecv = ch.recv().then((value) => {
        if (resolved) return;
        if (value === undefined && ch.closed) return;
        resolved = true;
        resolve({ index: i, value } as SelectResult<T>);
      });

      cleanups.push(() => { /* recv는 취소 불가, 무시 */ });
    }
  });
}
