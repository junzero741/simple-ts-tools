// 타입 안전 RPC 추상화 (Remote Procedure Call).
//
// 전송 계층(postMessage, WebSocket, HTTP, IPC 등)과 무관하게
// 요청-응답 매칭, 타임아웃, 에러 전파를 처리한다.
//
// // Worker 측
// const server = createRPCServer<API>({
//   add: (a, b) => a + b,
//   greet: (name) => `Hello, ${name}!`,
// });
// self.onmessage = (e) => server.handle(e.data).then(r => self.postMessage(r));
//
// // Main 측
// const client = createRPCClient<API>((msg) => worker.postMessage(msg));
// worker.onmessage = (e) => client.receive(e.data);
//
// const sum = await client.call("add", 1, 2); // 3

export interface RPCRequest {
  id: string;
  method: string;
  args: unknown[];
}

export interface RPCResponse {
  id: string;
  result?: unknown;
  error?: { message: string; stack?: string };
}

export interface RPCClientOptions {
  timeout?: number;
}

export interface RPCClient<T extends Record<string, (...args: any[]) => any>> {
  call<K extends keyof T & string>(
    method: K,
    ...args: Parameters<T[K]>
  ): Promise<ReturnType<T[K]>>;

  receive(response: RPCResponse): void;

  readonly pendingCount: number;
}

export interface RPCServer<T extends Record<string, (...args: any[]) => any>> {
  handle(request: RPCRequest): Promise<RPCResponse>;
}

let idCounter = 0;
function generateId(): string {
  return `rpc_${++idCounter}_${Date.now().toString(36)}`;
}

export function createRPCClient<T extends Record<string, (...args: any[]) => any>>(
  send: (request: RPCRequest) => void,
  options: RPCClientOptions = {},
): RPCClient<T> {
  const { timeout } = options;
  const pending = new Map<
    string,
    { resolve: (value: unknown) => void; reject: (error: Error) => void; timer?: ReturnType<typeof setTimeout> }
  >();

  const client: RPCClient<T> = {
    call<K extends keyof T & string>(
      method: K,
      ...args: Parameters<T[K]>
    ): Promise<ReturnType<T[K]>> {
      return new Promise<ReturnType<T[K]>>((resolve, reject) => {
        const id = generateId();

        const entry: (typeof pending extends Map<string, infer V> ? V : never) = {
          resolve: resolve as (value: unknown) => void,
          reject,
        };

        if (timeout !== undefined) {
          entry.timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error(`RPC call "${method}" timed out after ${timeout}ms`));
          }, timeout);
        }

        pending.set(id, entry);
        send({ id, method, args });
      });
    },

    receive(response: RPCResponse): void {
      const entry = pending.get(response.id);
      if (!entry) return;

      pending.delete(response.id);
      if (entry.timer) clearTimeout(entry.timer);

      if (response.error) {
        const err = new Error(response.error.message);
        if (response.error.stack) err.stack = response.error.stack;
        entry.reject(err);
      } else {
        entry.resolve(response.result);
      }
    },

    get pendingCount() {
      return pending.size;
    },
  };

  return client;
}

export function createRPCServer<T extends Record<string, (...args: any[]) => any>>(
  handlers: T,
): RPCServer<T> {
  return {
    async handle(request: RPCRequest): Promise<RPCResponse> {
      const { id, method, args } = request;

      const handler = handlers[method];
      if (!handler) {
        return {
          id,
          error: { message: `Unknown method: "${method}"` },
        };
      }

      try {
        const result = await handler(...args);
        return { id, result };
      } catch (err) {
        const error = err instanceof Error
          ? { message: err.message, stack: err.stack }
          : { message: String(err) };
        return { id, error };
      }
    },
  };
}
