import { describe, it, expect, vi } from "vitest";
import { createMemo, computed } from "./memo";

describe("createMemo", () => {
  it("첫 접근 시 계산한다", () => {
    const factory = vi.fn(() => 42);
    const memo = createMemo(factory, () => [1]);

    expect(memo.value).toBe(42);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("의존성이 같으면 캐시를 반환한다", () => {
    const factory = vi.fn(() => Math.random());
    const dep = { v: 1 };
    const memo = createMemo(factory, () => [dep.v]);

    const first = memo.value;
    const second = memo.value;

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("의존성이 바뀌면 재계산한다", () => {
    const factory = vi.fn(() => Math.random());
    let dep = 1;
    const memo = createMemo(factory, () => [dep]);

    const first = memo.value;
    dep = 2;
    const second = memo.value;

    expect(first).not.toBe(second);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("여러 의존성을 추적한다", () => {
    const factory = vi.fn(() => "result");
    let a = 1, b = "x";
    const memo = createMemo(factory, () => [a, b]);

    memo.value;
    memo.value;
    expect(factory).toHaveBeenCalledTimes(1);

    a = 2;
    memo.value;
    expect(factory).toHaveBeenCalledTimes(2);

    b = "y";
    memo.value;
    expect(factory).toHaveBeenCalledTimes(3);
  });

  it("invalidate — 캐시를 강제 무효화한다", () => {
    const factory = vi.fn(() => "val");
    const memo = createMemo(factory, () => [1]);

    memo.value;
    memo.invalidate();
    memo.value;

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("deps — 마지막 의존성 값을 반환한다", () => {
    let dep = 10;
    const memo = createMemo(() => dep * 2, () => [dep]);

    memo.value;
    expect(memo.deps).toEqual([10]);

    dep = 20;
    memo.value;
    expect(memo.deps).toEqual([20]);
  });

  it("의존성 배열 길이가 바뀌면 재계산한다", () => {
    const factory = vi.fn(() => "r");
    let deps = [1, 2];
    const memo = createMemo(factory, () => deps);

    memo.value;
    deps = [1, 2, 3];
    memo.value;

    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("커스텀 equals 함수를 지원한다", () => {
    const factory = vi.fn(() => "val");
    let dep = { id: 1, name: "a" };

    const memo = createMemo(
      factory,
      () => [dep],
      (a: unknown, b: unknown) => (a as any)?.id === (b as any)?.id,
    );

    memo.value;
    dep = { id: 1, name: "b" }; // id 동일
    memo.value;
    expect(factory).toHaveBeenCalledTimes(1);

    dep = { id: 2, name: "b" }; // id 변경
    memo.value;
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("실전 — 필터링된 목록 캐시", () => {
    let users = [
      { name: "alice", active: true },
      { name: "bob", active: false },
      { name: "charlie", active: true },
    ];
    let filterActive = true;

    const filtered = createMemo(
      () => users.filter(u => u.active === filterActive),
      () => [users, filterActive],
    );

    expect(filtered.value).toEqual([
      { name: "alice", active: true },
      { name: "charlie", active: true },
    ]);

    // 의존성 미변경 → 캐시
    const cached = filtered.value;
    expect(cached).toBe(filtered.value);

    // filterActive 변경 → 재계산
    filterActive = false;
    expect(filtered.value).toEqual([{ name: "bob", active: false }]);
  });
});

describe("computed", () => {
  it("매 접근마다 fn을 실행한다", () => {
    let count = 0;
    const c = computed(() => ++count);

    expect(c.value).toBe(1);
    expect(c.value).toBe(2);
  });

  it("결과가 같으면 이전 참조를 유지한다", () => {
    const obj = { x: 1 };
    const c = computed(() => obj, (a, b) => a.x === b.x);

    const first = c.value;
    const second = c.value;
    expect(first).toBe(second);
  });

  it("결과가 바뀌면 새 값을 반환한다", () => {
    let n = 1;
    const c = computed(() => n * 2);

    expect(c.value).toBe(2);
    n = 5;
    expect(c.value).toBe(10);
  });
});
