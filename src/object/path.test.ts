import { describe, expect, it } from "vitest";
import { getIn, hasIn, setIn } from "./path";

describe("getIn", () => {
  it("단순 키를 읽는다", () => {
    expect(getIn({ a: 1 }, "a")).toBe(1);
  });

  it("중첩 경로를 읽는다", () => {
    expect(getIn({ user: { address: { city: "Seoul" } } }, "user.address.city")).toBe("Seoul");
  });

  it("배열 인덱스를 처리한다", () => {
    expect(getIn({ items: ["x", "y", "z"] }, "items.1")).toBe("y");
    expect(getIn({ list: [{ name: "Alice" }] }, "list.0.name")).toBe("Alice");
  });

  it("존재하지 않는 경로는 undefined를 반환한다", () => {
    expect(getIn({ a: 1 }, "b")).toBeUndefined();
    expect(getIn({ a: { b: 1 } }, "a.c")).toBeUndefined();
    expect(getIn({ a: 1 }, "a.b.c")).toBeUndefined();
  });

  it("null/undefined 객체에서는 undefined를 반환한다", () => {
    expect(getIn(null, "a")).toBeUndefined();
    expect(getIn(undefined, "a")).toBeUndefined();
  });

  it("값이 null인 경로에서 더 깊이 접근하면 undefined", () => {
    expect(getIn({ a: null }, "a.b")).toBeUndefined();
  });

  it("0, false, 빈 문자열 같은 falsy 값도 반환한다", () => {
    expect(getIn({ a: { b: 0 } }, "a.b")).toBe(0);
    expect(getIn({ a: { b: false } }, "a.b")).toBe(false);
    expect(getIn({ a: { b: "" } }, "a.b")).toBe("");
  });
});

describe("setIn", () => {
  it("기존 키 값을 업데이트한다", () => {
    expect(setIn({ a: 1, b: 2 }, "b", 99)).toEqual({ a: 1, b: 99 });
  });

  it("중첩 경로에 값을 설정한다", () => {
    expect(setIn({ user: { name: "Alice" } }, "user.age", 30)).toEqual({
      user: { name: "Alice", age: 30 },
    });
  });

  it("존재하지 않는 중간 경로를 생성한다", () => {
    expect(setIn({}, "a.b.c", 1)).toEqual({ a: { b: { c: 1 } } });
  });

  it("원본 객체를 변경하지 않는다 (불변)", () => {
    const original = { user: { name: "Alice" } };
    const updated = setIn(original, "user.name", "Bob");
    expect(original.user.name).toBe("Alice");
    expect(updated.user.name).toBe("Bob");
  });

  it("중간 경로의 객체도 새 참조를 갖는다", () => {
    const original = { user: { name: "Alice", address: { city: "Seoul" } } };
    const updated = setIn(original, "user.name", "Bob");
    expect(updated.user).not.toBe(original.user);
    expect(updated.user.address).toBe(original.user.address); // 바뀌지 않은 부분은 공유
  });

  it("배열 인덱스에 값을 설정한다", () => {
    expect(setIn({ items: ["a", "b", "c"] }, "items.1", "X")).toEqual({
      items: ["a", "X", "c"],
    });
  });

  it("깊은 중첩 설정", () => {
    const obj = { a: { b: { c: 1, d: 2 }, e: 3 } };
    expect(setIn(obj, "a.b.c", 99)).toEqual({ a: { b: { c: 99, d: 2 }, e: 3 } });
  });
});

describe("hasIn", () => {
  it("존재하는 경로는 true를 반환한다", () => {
    expect(hasIn({ user: { name: "Alice" } }, "user.name")).toBe(true);
    expect(hasIn({ a: 1 }, "a")).toBe(true);
  });

  it("존재하지 않는 경로는 false를 반환한다", () => {
    expect(hasIn({ user: { name: "Alice" } }, "user.age")).toBe(false);
    expect(hasIn({ a: 1 }, "b")).toBe(false);
    expect(hasIn({ a: 1 }, "a.b")).toBe(false);
  });

  it("값이 undefined여도 키가 있으면 true", () => {
    expect(hasIn({ a: undefined }, "a")).toBe(true);
  });

  it("null/undefined 객체는 false를 반환한다", () => {
    expect(hasIn(null, "a")).toBe(false);
    expect(hasIn(undefined, "a")).toBe(false);
  });

  it("중간 경로가 null이면 false", () => {
    expect(hasIn({ a: null }, "a.b")).toBe(false);
  });

  it("배열 인덱스 경로를 확인한다", () => {
    expect(hasIn({ items: ["x", "y"] }, "items.0")).toBe(true);
    expect(hasIn({ items: ["x", "y"] }, "items.5")).toBe(false);
  });
});
