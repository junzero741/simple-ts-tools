import { describe, it, expect } from "vitest";
import { createRPCClient, createRPCServer } from "./rpc";
import type { RPCRequest, RPCResponse } from "./rpc";

type API = {
  add: (a: number, b: number) => number;
  greet: (name: string) => string;
  fail: () => never;
  slow: () => Promise<string>;
};

function createConnectedPair() {
  const serverHandlers: API = {
    add: (a, b) => a + b,
    greet: (name) => `Hello, ${name}!`,
    fail: () => { throw new Error("boom"); },
    slow: () => new Promise((r) => setTimeout(() => r("done"), 50)),
  };

  const server = createRPCServer(serverHandlers);

  let clientReceive: (response: RPCResponse) => void;

  const client = createRPCClient<API>((request: RPCRequest) => {
    // 비동기로 서버 처리 시뮬레이션
    server.handle(request).then((response) => {
      clientReceive(response);
    });
  });

  clientReceive = (response) => client.receive(response);

  return { client, server };
}

describe("RPC", () => {
  describe("기본 호출", () => {
    it("함수를 호출하고 결과를 반환한다", async () => {
      const { client } = createConnectedPair();

      const result = await client.call("add", 3, 4);
      expect(result).toBe(7);
    });

    it("문자열 결과를 반환한다", async () => {
      const { client } = createConnectedPair();

      const result = await client.call("greet", "Alice");
      expect(result).toBe("Hello, Alice!");
    });
  });

  describe("에러 전파", () => {
    it("서버 에러를 클라이언트에 전파한다", async () => {
      const { client } = createConnectedPair();

      await expect(client.call("fail")).rejects.toThrow("boom");
    });

    it("미등록 메서드는 에러를 반환한다", async () => {
      const { client } = createConnectedPair();

      await expect(client.call("unknown" as any)).rejects.toThrow("Unknown method");
    });
  });

  describe("async 핸들러", () => {
    it("비동기 핸들러를 지원한다", async () => {
      const { client } = createConnectedPair();

      const result = await client.call("slow");
      expect(result).toBe("done");
    });
  });

  describe("타임아웃", () => {
    it("타임아웃 시 에러를 던진다", async () => {
      const client = createRPCClient<API>(
        () => { /* 응답 안 보냄 */ },
        { timeout: 30 },
      );

      await expect(client.call("add", 1, 2)).rejects.toThrow("timed out after 30ms");
    });
  });

  describe("pendingCount", () => {
    it("대기 중인 호출 수를 반환한다", async () => {
      const { client } = createConnectedPair();

      expect(client.pendingCount).toBe(0);
      const p = client.call("slow");
      expect(client.pendingCount).toBe(1);

      await p;
      expect(client.pendingCount).toBe(0);
    });
  });

  describe("여러 동시 호출", () => {
    it("동시에 여러 호출을 처리한다", async () => {
      const { client } = createConnectedPair();

      const [r1, r2, r3] = await Promise.all([
        client.call("add", 1, 1),
        client.call("add", 2, 2),
        client.call("greet", "Bob"),
      ]);

      expect(r1).toBe(2);
      expect(r2).toBe(4);
      expect(r3).toBe("Hello, Bob!");
    });
  });

  describe("서버 단독", () => {
    it("handle이 RPCResponse를 반환한다", async () => {
      const server = createRPCServer({ echo: (x: string) => x });

      const response = await server.handle({
        id: "test-1",
        method: "echo",
        args: ["hello"],
      });

      expect(response).toEqual({ id: "test-1", result: "hello" });
    });

    it("에러 시 error 필드를 포함한다", async () => {
      const server = createRPCServer({
        fail: () => { throw new Error("oops"); },
      });

      const response = await server.handle({
        id: "test-2",
        method: "fail",
        args: [],
      });

      expect(response.id).toBe("test-2");
      expect(response.error?.message).toBe("oops");
    });
  });
});
