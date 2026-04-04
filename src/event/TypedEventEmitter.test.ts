import { describe, expect, it, vi } from "vitest";
import { TypedEventEmitter } from "./TypedEventEmitter";

type TestEvents = {
  data:    { value: number };
  error:   Error;
  signal:  void;
};

describe("TypedEventEmitter", () => {
  it("on으로 등록한 핸들러가 emit 시 호출된다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter.on("data", handler);
    emitter.emit("data", { value: 42 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it("같은 이벤트에 여러 핸들러를 등록할 수 있다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();

    emitter.on("data", h1).on("data", h2);
    emitter.emit("data", { value: 1 });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("off로 핸들러를 제거하면 더 이상 호출되지 않는다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter.on("data", handler);
    emitter.off("data", handler);
    emitter.emit("data", { value: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it("once 핸들러는 첫 번째 emit에만 실행된다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter.once("data", handler);
    emitter.emit("data", { value: 1 });
    emitter.emit("data", { value: 2 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ value: 1 });
  });

  it("clear(event)로 특정 이벤트의 모든 핸들러를 제거한다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();

    emitter.on("data", h1).on("error", h2);
    emitter.clear("data");

    emitter.emit("data", { value: 1 });
    emitter.emit("error", new Error("e"));

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });

  it("clear()로 모든 이벤트 핸들러를 제거한다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const h1 = vi.fn();
    const h2 = vi.fn();

    emitter.on("data", h1).on("error", h2);
    emitter.clear();

    emitter.emit("data", { value: 1 });
    emitter.emit("error", new Error("e"));

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it("listenerCount로 등록된 핸들러 수를 확인한다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    expect(emitter.listenerCount("data")).toBe(0);

    const h1 = vi.fn();
    const h2 = vi.fn();
    emitter.on("data", h1).on("data", h2);
    expect(emitter.listenerCount("data")).toBe(2);

    emitter.off("data", h1);
    expect(emitter.listenerCount("data")).toBe(1);
  });

  it("등록되지 않은 이벤트를 emit해도 에러가 발생하지 않는다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    expect(() => emitter.emit("data", { value: 0 })).not.toThrow();
  });

  it("메서드 체이닝을 지원한다", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const handler = vi.fn();

    emitter
      .on("data", handler)
      .emit("data", { value: 1 })
      .off("data", handler)
      .emit("data", { value: 2 });

    expect(handler).toHaveBeenCalledOnce();
  });
});
