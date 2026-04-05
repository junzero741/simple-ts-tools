// 액터 모델 (Actor Model).
//
// 각 액터가 독립된 상태와 메일박스를 가지고, 메시지를 순차 처리한다.
// 공유 상태 없이 메시지 전달만으로 통신하여 경쟁 조건을 원천 차단.
//
// const counter = createActor(0, {
//   increment: (state, amount: number) => state + amount,
//   decrement: (state, amount: number) => state - amount,
//   reset: () => 0,
// });
//
// await counter.send("increment", 5);
// await counter.send("increment", 3);
// counter.state; // 8
//
// // 여러 곳에서 동시에 send해도 순차 처리 보장

export interface Actor<TState, TMessages extends Record<string, (...args: any[]) => any>> {
  send<K extends keyof TMessages & string>(
    type: K,
    ...args: Parameters<TMessages[K]>
  ): Promise<void>;

  readonly state: TState;

  subscribe(handler: (state: TState, message: string) => void): () => void;

  readonly pending: number;

  stop(): void;
  readonly stopped: boolean;
}

export function createActor<
  TState,
  TMessages extends Record<string, (state: TState, ...args: any[]) => TState>,
>(
  initialState: TState,
  handlers: TMessages,
): Actor<TState, { [K in keyof TMessages]: TMessages[K] extends (state: TState, ...args: infer A) => TState ? (...args: A) => TState : never }> {
  let state = initialState;
  let isStopped = false;
  const listeners = new Set<(state: TState, message: string) => void>();

  // 메일박스 — FIFO 큐 + 순차 처리
  const mailbox: Array<{ type: string; args: unknown[]; resolve: () => void }> = [];
  let processing = false;

  async function processMailbox(): Promise<void> {
    if (processing) return;
    processing = true;

    while (mailbox.length > 0) {
      const msg = mailbox.shift()!;
      const handler = handlers[msg.type];
      if (handler) {
        try {
          const result = handler(state, ...msg.args);
          state = result instanceof Promise ? await result : result;
          for (const h of listeners) h(state, msg.type);
        } catch {
          // 메시지 처리 실패 — 상태 변경 없음
        }
      }
      msg.resolve();
    }

    processing = false;
  }

  const actor: Actor<TState, any> = {
    send(type, ...args) {
      if (isStopped) return Promise.reject(new Error("Actor is stopped"));

      return new Promise<void>((resolve) => {
        mailbox.push({ type: type as string, args, resolve });
        processMailbox();
      });
    },

    get state() { return state; },

    subscribe(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },

    get pending() { return mailbox.length; },

    stop() { isStopped = true; },
    get stopped() { return isStopped; },
  };

  return actor;
}
