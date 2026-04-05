import { describe, it, expect, vi } from "vitest";
import { createAbortScope, linkSignals, abortable } from "./abortScope";

describe("createAbortScope", () => {
  describe("기본", () => {
    it("abort하면 signal이 aborted 상태가 된다", () => {
      const scope = createAbortScope();
      expect(scope.aborted).toBe(false);

      scope.abort("reason");
      expect(scope.aborted).toBe(true);
      expect(scope.reason).toBe("reason");
    });

    it("중복 abort는 무시된다", () => {
      const scope = createAbortScope();
      scope.abort("first");
      scope.abort("second");
      expect(scope.reason).toBe("first");
    });
  });

  describe("child", () => {
    it("부모 abort 시 자식도 abort된다", () => {
      const parent = createAbortScope();
      const child = parent.child();

      expect(child.aborted).toBe(false);
      parent.abort("parent reason");

      expect(child.aborted).toBe(true);
      expect(child.reason).toBe("parent reason");
    });

    it("자식 abort는 부모에 영향 없다", () => {
      const parent = createAbortScope();
      const child = parent.child();

      child.abort("child reason");
      expect(parent.aborted).toBe(false);
      expect(child.aborted).toBe(true);
    });

    it("다단계 계층 — 조부모 abort 시 손자도 abort", () => {
      const root = createAbortScope();
      const mid = root.child();
      const leaf = mid.child();

      root.abort();
      expect(mid.aborted).toBe(true);
      expect(leaf.aborted).toBe(true);
    });

    it("이미 aborted된 부모에서 child를 만들면 즉시 abort", () => {
      const parent = createAbortScope();
      parent.abort("already");

      const child = parent.child();
      expect(child.aborted).toBe(true);
    });
  });

  describe("withTimeout", () => {
    it("타임아웃 후 자동 abort된다", async () => {
      const scope = createAbortScope();
      const timed = scope.withTimeout(30);

      expect(timed.aborted).toBe(false);
      await new Promise((r) => setTimeout(r, 50));
      expect(timed.aborted).toBe(true);
    });

    it("부모 abort가 타임아웃보다 먼저 발생하면 타이머가 정리된다", () => {
      const scope = createAbortScope();
      const timed = scope.withTimeout(10_000);

      scope.abort();
      expect(timed.aborted).toBe(true);
    });
  });

  describe("onAbort", () => {
    it("abort 시 콜백을 실행한다", () => {
      const scope = createAbortScope();
      const fn = vi.fn();

      scope.onAbort(fn);
      scope.abort();

      expect(fn).toHaveBeenCalledOnce();
    });

    it("반환 함수로 해제한다", () => {
      const scope = createAbortScope();
      const fn = vi.fn();

      const off = scope.onAbort(fn);
      off();
      scope.abort();

      expect(fn).not.toHaveBeenCalled();
    });

    it("이미 aborted면 즉시 실행한다", () => {
      const scope = createAbortScope();
      scope.abort();

      const fn = vi.fn();
      scope.onAbort(fn);
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe("defer", () => {
    it("abort 시 cleanup을 실행한다", () => {
      const scope = createAbortScope();
      const fn = vi.fn();

      scope.defer(fn);
      scope.abort();

      expect(fn).toHaveBeenCalledOnce();
    });

    it("이미 aborted면 즉시 실행한다", () => {
      const scope = createAbortScope();
      scope.abort();

      const fn = vi.fn();
      scope.defer(fn);
      expect(fn).toHaveBeenCalledOnce();
    });
  });
});

describe("linkSignals", () => {
  it("하나라도 abort되면 결과도 abort된다", () => {
    const c1 = new AbortController();
    const c2 = new AbortController();

    const linked = linkSignals(c1.signal, c2.signal);
    expect(linked.aborted).toBe(false);

    c2.abort("from c2");
    expect(linked.aborted).toBe(true);
    expect(linked.reason).toBe("from c2");
  });

  it("이미 aborted된 signal이 있으면 즉시 abort", () => {
    const c1 = new AbortController();
    c1.abort("already");

    const linked = linkSignals(c1.signal, new AbortController().signal);
    expect(linked.aborted).toBe(true);
  });
});

describe("abortable", () => {
  it("정상 완료 시 값을 반환한다", async () => {
    const controller = new AbortController();
    const result = await abortable(Promise.resolve(42), controller.signal);
    expect(result).toBe(42);
  });

  it("abort 시 reject된다", async () => {
    const controller = new AbortController();
    const slow = new Promise((r) => setTimeout(() => r("done"), 100));

    setTimeout(() => controller.abort("cancelled"), 10);

    await expect(abortable(slow, controller.signal)).rejects.toBe("cancelled");
  });

  it("이미 aborted된 signal이면 즉시 reject", async () => {
    const controller = new AbortController();
    controller.abort("already");

    await expect(abortable(Promise.resolve(1), controller.signal)).rejects.toBe("already");
  });
});
