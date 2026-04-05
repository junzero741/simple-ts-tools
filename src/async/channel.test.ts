import { describe, it, expect } from "vitest";
import { createChannel, select } from "./channel";

describe("createChannel", () => {
  describe("unbuffered (capacity=0)", () => {
    it("send는 recv가 올 때까지 대기한다", async () => {
      const ch = createChannel<number>();
      let sent = false;

      const p = ch.send(42).then(() => { sent = true; });

      await new Promise((r) => setTimeout(r, 10));
      expect(sent).toBe(false);

      const val = await ch.recv();
      await p;
      expect(val).toBe(42);
      expect(sent).toBe(true);

      ch.close();
    });

    it("recv는 send가 올 때까지 대기한다", async () => {
      const ch = createChannel<string>();
      let received: string | undefined;

      const p = ch.recv().then((v) => { received = v; });

      await new Promise((r) => setTimeout(r, 10));
      expect(received).toBeUndefined();

      await ch.send("hello");
      await p;
      expect(received).toBe("hello");

      ch.close();
    });

    it("여러 메시지를 순서대로 전달한다", async () => {
      const ch = createChannel<number>();
      const results: number[] = [];

      const sender = (async () => {
        await ch.send(1);
        await ch.send(2);
        await ch.send(3);
        ch.close();
      })();

      for await (const val of ch) {
        results.push(val);
      }

      await sender;
      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe("buffered", () => {
    it("버퍼가 찰 때까지 send가 즉시 완료된다", async () => {
      const ch = createChannel<number>(2);

      await ch.send(1);
      await ch.send(2);
      expect(ch.size).toBe(2);

      // 세 번째는 대기
      let sent = false;
      const p = ch.send(3).then(() => { sent = true; });

      await new Promise((r) => setTimeout(r, 10));
      expect(sent).toBe(false);

      await ch.recv(); // 버퍼에서 1 꺼냄 → 3이 버퍼에 들어감
      await p;
      expect(sent).toBe(true);

      const v2 = await ch.recv();
      const v3 = await ch.recv();
      expect(v2).toBe(2);
      expect(v3).toBe(3);

      ch.close();
    });

    it("버퍼에 남은 값은 close 후에도 recv 가능", async () => {
      const ch = createChannel<number>(3);

      await ch.send(10);
      await ch.send(20);
      ch.close();

      expect(await ch.recv()).toBe(10);
      expect(await ch.recv()).toBe(20);
      expect(await ch.recv()).toBeUndefined();
    });
  });

  describe("close", () => {
    it("닫힌 채널에 send하면 에러를 던진다", () => {
      const ch = createChannel<number>();
      ch.close();

      expect(() => ch.send(1)).toThrow("Cannot send on a closed channel");
    });

    it("닫힌 빈 채널에서 recv하면 undefined를 반환한다", async () => {
      const ch = createChannel<number>();
      ch.close();

      expect(await ch.recv()).toBeUndefined();
    });

    it("close는 대기 중인 receiver를 깨운다", async () => {
      const ch = createChannel<number>();

      const p = ch.recv();
      ch.close();

      expect(await p).toBeUndefined();
    });

    it("중복 close는 무시된다", () => {
      const ch = createChannel<number>();
      ch.close();
      ch.close(); // 에러 없음
      expect(ch.closed).toBe(true);
    });
  });

  describe("async iterator", () => {
    it("for await...of로 소비한다", async () => {
      const ch = createChannel<number>(3);
      await ch.send(1);
      await ch.send(2);
      await ch.send(3);
      ch.close();

      const results: number[] = [];
      for await (const val of ch) {
        results.push(val);
      }
      expect(results).toEqual([1, 2, 3]);
    });
  });

  it("capacity < 0이면 에러를 던진다", () => {
    expect(() => createChannel<number>(-1)).toThrow("capacity must be non-negative");
  });
});

describe("select", () => {
  it("먼저 값이 도착한 채널에서 수신한다", async () => {
    const ch1 = createChannel<number>(1);
    const ch2 = createChannel<string>(1);

    await ch2.send("first");

    const result = await select<[number, string]>([ch1, ch2]);
    expect(result).toEqual({ index: 1, value: "first" });

    ch1.close();
    ch2.close();
  });

  it("모든 채널이 닫혀 있으면 undefined를 반환한다", async () => {
    const ch1 = createChannel<number>();
    const ch2 = createChannel<string>();
    ch1.close();
    ch2.close();

    const result = await select<[number, string]>([ch1, ch2]);
    expect(result).toBeUndefined();
  });
});
