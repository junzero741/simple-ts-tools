import { describe, expect, it, vi } from "vitest";
import { BehaviorSubject } from "./BehaviorSubject";

describe("BehaviorSubject", () => {
  it("초기값을 즉시 반환한다", () => {
    const subject = new BehaviorSubject(42);
    expect(subject.getValue()).toBe(42);
  });

  it("subscribe 즉시 현재 값으로 핸들러를 호출한다", () => {
    const subject = new BehaviorSubject("hello");
    const handler = vi.fn();

    subject.subscribe(handler);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("hello");
  });

  it("set으로 값을 변경하면 구독자에게 알린다", () => {
    const subject = new BehaviorSubject(0);
    const received: number[] = [];
    subject.subscribe(v => received.push(v));

    subject.set(1);
    subject.set(2);

    expect(received).toEqual([0, 1, 2]);
  });

  it("같은 값으로 set하면 알림을 보내지 않는다", () => {
    const subject = new BehaviorSubject(0);
    const handler = vi.fn();
    subject.subscribe(handler);   // 즉시 1회 호출

    subject.set(0); // 동일값 — 무시
    subject.set(0);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("update로 현재 값을 기반으로 업데이트한다", () => {
    const subject = new BehaviorSubject(10);
    subject.update(v => v * 2);
    expect(subject.getValue()).toBe(20);
  });

  it("구독 해제 후 더 이상 알림을 받지 않는다", () => {
    const subject = new BehaviorSubject(0);
    const handler = vi.fn();
    const unsub = subject.subscribe(handler);

    unsub();
    subject.set(1);

    expect(handler).toHaveBeenCalledTimes(1); // 초기값만
  });

  it("여러 구독자가 모두 알림을 받는다", () => {
    const subject = new BehaviorSubject(0);
    const h1 = vi.fn();
    const h2 = vi.fn();

    subject.subscribe(h1);
    subject.subscribe(h2);
    subject.set(5);

    expect(h1).toHaveBeenLastCalledWith(5);
    expect(h2).toHaveBeenLastCalledWith(5);
  });

  it("complete 후 set/update가 무시된다", () => {
    const subject = new BehaviorSubject(0);
    const handler = vi.fn();
    subject.subscribe(handler);

    subject.complete();
    subject.set(99);

    expect(handler).toHaveBeenCalledTimes(1); // 초기값만
    expect(subject.getValue()).toBe(0);
    expect(subject.isCompleted).toBe(true);
    expect(subject.subscriberCount).toBe(0);
  });

  it("객체 상태 관리 패턴", () => {
    type State = { count: number; name: string };
    const state$ = new BehaviorSubject<State>({ count: 0, name: "Alice" });
    const history: State[] = [];

    state$.subscribe(v => history.push({ ...v }));
    state$.update(s => ({ ...s, count: s.count + 1 }));
    state$.update(s => ({ ...s, name: "Bob" }));

    expect(history).toEqual([
      { count: 0, name: "Alice" },
      { count: 1, name: "Alice" },
      { count: 1, name: "Bob" },
    ]);
  });
});
