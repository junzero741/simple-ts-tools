import { describe, expect, it, vi } from "vitest";
import { createStore } from "./store";

interface TestState {
  count: number;
  user: { name: string; role: "admin" | "user" } | null;
  theme: "light" | "dark";
}

function makeStore() {
  return createStore<TestState>({
    count: 0,
    user: null,
    theme: "light",
  });
}

describe("get / set / replace / update", () => {
  it("get()은 초기 상태를 반환한다", () => {
    const store = makeStore();
    expect(store.get()).toEqual({ count: 0, user: null, theme: "light" });
  });

  it("set()은 partial을 얕게 병합한다", () => {
    const store = makeStore();
    store.set({ count: 5 });
    expect(store.get()).toEqual({ count: 5, user: null, theme: "light" });
  });

  it("set()은 관련 없는 키를 유지한다", () => {
    const store = makeStore();
    store.set({ theme: "dark" });
    expect(store.get().count).toBe(0);
    expect(store.get().user).toBeNull();
  });

  it("replace()는 상태 전체를 교체한다", () => {
    const store = makeStore();
    const next: TestState = { count: 99, user: { name: "Alice", role: "admin" }, theme: "dark" };
    store.replace(next);
    expect(store.get()).toEqual(next);
  });

  it("update()는 현재 상태를 기반으로 업데이트한다", () => {
    const store = makeStore();
    store.update(s => ({ count: s.count + 10 }));
    expect(store.get().count).toBe(10);
  });
});

describe("subscribe()", () => {
  it("등록 즉시 현재 상태로 호출된다", () => {
    const store = makeStore();
    const calls: TestState[] = [];
    store.subscribe(s => calls.push(s));
    expect(calls).toHaveLength(1);
    expect(calls[0].count).toBe(0);
  });

  it("상태 변경 시 구독자가 호출된다", () => {
    const store = makeStore();
    const calls: number[] = [];
    store.subscribe(s => calls.push(s.count));
    store.set({ count: 1 });
    store.set({ count: 2 });
    expect(calls).toEqual([0, 1, 2]);
  });

  it("변경 없으면 구독자가 호출되지 않는다", () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.set({ count: 0 }); // 동일 값
    expect(listener).not.toHaveBeenCalled();
  });

  it("구독 해제 후 호출되지 않는다", () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    listener.mockClear();

    unsub();
    store.set({ count: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("여러 구독자가 독립적으로 동작한다", () => {
    const store = makeStore();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);
    a.mockClear();
    b.mockClear();

    store.set({ count: 1 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe("select()", () => {
  it("get()이 선택된 슬라이스를 반환한다", () => {
    const store = makeStore();
    store.set({ count: 7 });
    const count = store.select(s => s.count);
    expect(count.get()).toBe(7);
  });

  it("등록 즉시 현재 슬라이스 값으로 호출된다", () => {
    const store = makeStore();
    store.set({ count: 5 });
    const calls: number[] = [];
    store.select(s => s.count).subscribe(v => calls.push(v));
    expect(calls).toEqual([5]);
  });

  it("선택된 슬라이스가 바뀔 때만 호출된다", () => {
    const store = makeStore();
    const listener = vi.fn();
    store.select(s => s.count).subscribe(listener);
    listener.mockClear();

    store.set({ theme: "dark" }); // count는 바뀌지 않음
    expect(listener).not.toHaveBeenCalled();

    store.set({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it("파생 계산값도 selector로 사용할 수 있다", () => {
    const store = makeStore();
    const calls: boolean[] = [];
    store.select(s => s.count > 5).subscribe(v => calls.push(v));

    store.set({ count: 3 }); // false → false (변경 없음, 호출 없음)
    store.set({ count: 6 }); // false → true (변경, 호출)
    store.set({ count: 10 }); // true → true (변경 없음, 호출 없음)

    expect(calls).toEqual([false, true]); // 초기(false) + 변경(true)
  });

  it("구독 해제 후 호출되지 않는다", () => {
    const store = makeStore();
    const listener = vi.fn();
    const unsub = store.select(s => s.count).subscribe(listener);
    listener.mockClear();

    unsub();
    store.set({ count: 1 });
    expect(listener).not.toHaveBeenCalled();
  });

  it("마지막 구독자 해제 시 store 핸들러도 해제된다 (메모리 누수 없음)", () => {
    const store = makeStore();
    const selected = store.select(s => s.count);

    const unsub1 = selected.subscribe(() => {});
    const unsub2 = selected.subscribe(() => {});

    // 두 구독자가 있을 때 store 내부 listeners에 핸들러가 있어야 함
    const listenersBefore = (store as unknown as { listeners?: Set<unknown> });
    unsub1();
    unsub2(); // 마지막 → store 핸들러 해제

    // 이제 store 변경이 선택 핸들러를 호출하지 않아야 함
    const spy = vi.fn();
    selected.subscribe(spy);
    spy.mockClear();
    store.set({ count: 99 });
    expect(spy).toHaveBeenCalledWith(99);
  });

  it("커스텀 equals 옵션으로 객체 비교 가능", () => {
    interface Item { id: number }
    const store = createStore({ items: [{ id: 1 }, { id: 2 }] as Item[] });
    const listener = vi.fn();

    // 동일 내용의 새 배열은 참조가 달라도 동등하게 처리
    store.select(s => s.items, {
      equals: (a, b) => a.length === b.length && a.every((v, i) => v.id === b[i].id),
    }).subscribe(listener);
    listener.mockClear();

    store.set({ items: [{ id: 1 }, { id: 2 }] }); // 내용 동일 → 호출 없음
    expect(listener).not.toHaveBeenCalled();

    store.set({ items: [{ id: 1 }] }); // 내용 변경 → 호출
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("동일 store에서 여러 독립 selector를 만들 수 있다", () => {
    const store = makeStore();
    const countSel = vi.fn();
    const themeSel = vi.fn();

    store.select(s => s.count).subscribe(countSel);
    store.select(s => s.theme).subscribe(themeSel);
    countSel.mockClear();
    themeSel.mockClear();

    store.set({ count: 1 });
    expect(countSel).toHaveBeenCalledTimes(1);
    expect(themeSel).not.toHaveBeenCalled();

    store.set({ theme: "dark" });
    expect(countSel).toHaveBeenCalledTimes(1);
    expect(themeSel).toHaveBeenCalledTimes(1);
  });
});

describe("reset()", () => {
  it("초기 상태로 복원하고 구독자에게 알린다", () => {
    const store = makeStore();
    store.set({ count: 99, theme: "dark" });
    const listener = vi.fn();
    store.subscribe(listener);
    listener.mockClear();

    store.reset();
    expect(store.get()).toEqual({ count: 0, user: null, theme: "light" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reset 후 초기 상태가 변경되지 않는다 (불변 초기값)", () => {
    const store = makeStore();
    store.set({ count: 5 });
    store.reset();
    store.set({ count: 10 });
    store.reset();
    expect(store.get().count).toBe(0);
  });
});

describe("실사용 시나리오", () => {
  it("인증 상태 관리 — 로그인/로그아웃", () => {
    const authStore = createStore({ user: null as { name: string } | null, token: "" });
    const isLoggedIn = authStore.select(s => s.user !== null);

    const states: boolean[] = [];
    isLoggedIn.subscribe(v => states.push(v));

    authStore.set({ user: { name: "Alice" }, token: "abc" });
    authStore.set({ user: null, token: "" });

    expect(states).toEqual([false, true, false]);
  });

  it("알림 배지 — 숫자가 바뀔 때만 UI 업데이트", () => {
    const store = createStore({ notifications: 0, loading: false });
    const badgeUpdates: number[] = [];

    store.select(s => s.notifications).subscribe(n => badgeUpdates.push(n));

    store.set({ loading: true });   // notifications 변경 없음 → badge 호출 안 됨
    store.set({ notifications: 3 });
    store.set({ loading: false });  // notifications 변경 없음
    store.set({ notifications: 3 }); // 동일 값 → 호출 안 됨

    expect(badgeUpdates).toEqual([0, 3]);
  });
});
