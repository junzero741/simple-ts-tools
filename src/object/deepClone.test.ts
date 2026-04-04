import { describe, expect, it } from "vitest";
import { deepClone } from "./deepClone";
import { deepEqual } from "./deepEqual";

describe("deepClone — 원시값", () => {
  it("원시값은 그대로 반환한다", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });
});

describe("deepClone — 배열", () => {
  it("배열을 새 인스턴스로 복사한다", () => {
    const original = [1, 2, 3];
    const clone = deepClone(original);
    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
  });

  it("배열 수정이 원본에 영향을 주지 않는다", () => {
    const original = [1, [2, 3]];
    const clone = deepClone(original);
    (clone[1] as number[]).push(4);
    expect(original[1]).toEqual([2, 3]);
  });
});

describe("deepClone — 객체", () => {
  it("중첩 객체를 깊게 복사한다", () => {
    const original = { a: 1, b: { c: 2, d: [3, 4] } };
    const clone = deepClone(original);
    expect(deepEqual(clone, original)).toBe(true);
    expect(clone).not.toBe(original);
    expect(clone.b).not.toBe(original.b);
  });

  it("복사본 수정이 원본에 영향을 주지 않는다", () => {
    const original = { tags: ["a", "b"] };
    const clone = deepClone(original);
    clone.tags.push("c");
    expect(original.tags).toEqual(["a", "b"]);
  });
});

describe("deepClone — Date / RegExp", () => {
  it("Date를 새 인스턴스로 복사한다", () => {
    const original = new Date("2024-01-01");
    const clone = deepClone(original);
    expect(clone.getTime()).toBe(original.getTime());
    expect(clone).not.toBe(original);
  });

  it("RegExp를 새 인스턴스로 복사한다", () => {
    const original = /abc/gi;
    const clone = deepClone(original);
    expect(clone.source).toBe(original.source);
    expect(clone.flags).toBe(original.flags);
    expect(clone).not.toBe(original);
  });
});

describe("deepClone — Map / Set", () => {
  it("Map을 깊게 복사한다", () => {
    const original = new Map([["key", { value: 1 }]]);
    const clone = deepClone(original);
    clone.get("key")!.value = 999;
    expect(original.get("key")!.value).toBe(1);
  });

  it("Set을 깊게 복사한다", () => {
    const obj = { x: 1 };
    const original = new Set([obj]);
    const clone = deepClone(original);
    expect(clone.size).toBe(1);
    expect([...clone][0]).not.toBe(obj); // 새 참조
  });
});

describe("deepClone — 복합", () => {
  it("deepEqual과 함께 불변 업데이트 패턴을 구현할 수 있다", () => {
    const state = { user: { name: "Alice", scores: [10, 20] } };
    const next = deepClone(state);
    next.user.scores.push(30);

    expect(state.user.scores).toEqual([10, 20]); // 원본 불변
    expect(next.user.scores).toEqual([10, 20, 30]);
  });
});
