import { describe, expect, it } from "vitest";
import { deepEqual } from "./deepEqual";

describe("deepEqual — 원시값", () => {
  it("같은 원시값은 true", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
  });

  it("다른 원시값은 false", () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(null, undefined)).toBe(false);
  });
});

describe("deepEqual — 배열", () => {
  it("같은 구조와 값이면 true", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([[1], [2]], [[1], [2]])).toBe(true);
  });

  it("길이나 값이 다르면 false", () => {
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
  });
});

describe("deepEqual — 객체", () => {
  it("같은 구조와 값이면 true", () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  it("키나 값이 다르면 false", () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("키 순서가 달라도 true", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });
});

describe("deepEqual — Date", () => {
  it("같은 시각이면 true", () => {
    expect(deepEqual(new Date("2024-01-01"), new Date("2024-01-01"))).toBe(true);
  });

  it("다른 시각이면 false", () => {
    expect(deepEqual(new Date("2024-01-01"), new Date("2024-01-02"))).toBe(false);
  });
});

describe("deepEqual — RegExp", () => {
  it("같은 패턴과 플래그면 true", () => {
    expect(deepEqual(/abc/gi, /abc/gi)).toBe(true);
  });

  it("패턴이나 플래그가 다르면 false", () => {
    expect(deepEqual(/abc/, /abc/i)).toBe(false);
    expect(deepEqual(/abc/, /xyz/)).toBe(false);
  });
});

describe("deepEqual — Map / Set", () => {
  it("같은 Map 항목이면 true", () => {
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 1]]))).toBe(true);
  });

  it("Map 값이 다르면 false", () => {
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
  });

  it("같은 Set 항목이면 true", () => {
    expect(deepEqual(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(true);
  });

  it("Set 항목이 다르면 false", () => {
    expect(deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
  });
});

describe("deepEqual — 복합", () => {
  it("중첩 객체/배열/Date를 재귀적으로 비교한다", () => {
    const a = { users: [{ id: 1, born: new Date("1990-01-01") }] };
    const b = { users: [{ id: 1, born: new Date("1990-01-01") }] };
    expect(deepEqual(a, b)).toBe(true);
  });

  it("타입이 다르면 false", () => {
    expect(deepEqual([], {})).toBe(false);
    expect(deepEqual(1, "1")).toBe(false);
  });
});
