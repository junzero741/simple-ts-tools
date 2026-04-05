import { describe, it, expect } from "vitest";
import { comparing, naturalOrder, reverseOrder } from "./comparator";

type User = { name: string; age: number; dept: string };

const users: User[] = [
  { name: "Charlie", age: 30, dept: "Eng" },
  { name: "Alice", age: 25, dept: "Eng" },
  { name: "Bob", age: 30, dept: "Sales" },
  { name: "Diana", age: 25, dept: "Sales" },
];

describe("comparing", () => {
  it("단일 키 오름차순 정렬", () => {
    const sorted = [...users].sort(comparing<User>((u) => u.age));
    expect(sorted.map((u) => u.name)).toEqual(["Alice", "Diana", "Charlie", "Bob"]);
  });

  it("단일 키 내림차순 정렬", () => {
    const sorted = [...users].sort(comparing<User>((u) => u.age, "desc"));
    expect(sorted.map((u) => u.name)).toEqual(["Charlie", "Bob", "Alice", "Diana"]);
  });

  it("thenBy — 다중 키 정렬", () => {
    const cmp = comparing<User>((u) => u.age).thenBy((u) => u.name);
    const sorted = [...users].sort(cmp);
    expect(sorted.map((u) => u.name)).toEqual(["Alice", "Diana", "Bob", "Charlie"]);
  });

  it("thenBy — 혼합 방향 (부서 오름차순, 나이 내림차순)", () => {
    const cmp = comparing<User>((u) => u.dept).thenBy((u) => u.age, "desc");
    const sorted = [...users].sort(cmp);
    expect(sorted.map((u) => u.name)).toEqual(["Charlie", "Alice", "Bob", "Diana"]);
  });

  it("3단계 정렬", () => {
    const data = [
      { a: 1, b: 2, c: "z" },
      { a: 1, b: 2, c: "a" },
      { a: 1, b: 1, c: "m" },
      { a: 2, b: 1, c: "x" },
    ];

    const cmp = comparing<typeof data[0]>((x) => x.a)
      .thenBy((x) => x.b)
      .thenBy((x) => x.c);

    const sorted = [...data].sort(cmp);
    expect(sorted.map((x) => x.c)).toEqual(["m", "a", "z", "x"]);
  });
});

describe("null 처리", () => {
  type Item = { price: number | null };

  const items: Item[] = [
    { price: 30 },
    { price: null },
    { price: 10 },
    { price: null },
    { price: 20 },
  ];

  it("nulls: last — null을 맨 뒤로", () => {
    const sorted = [...items].sort(comparing<Item>((i) => i.price, { nulls: "last" }));
    expect(sorted.map((i) => i.price)).toEqual([10, 20, 30, null, null]);
  });

  it("nulls: first — null을 맨 앞으로", () => {
    const sorted = [...items].sort(comparing<Item>((i) => i.price, { nulls: "first" }));
    expect(sorted.map((i) => i.price)).toEqual([null, null, 10, 20, 30]);
  });

  it("nulls: last + desc", () => {
    const sorted = [...items].sort(
      comparing<Item>((i) => i.price, { direction: "desc", nulls: "last" }),
    );
    expect(sorted.map((i) => i.price)).toEqual([30, 20, 10, null, null]);
  });
});

describe("reversed", () => {
  it("전체 체인을 반전시킨다", () => {
    const cmp = comparing<User>((u) => u.age).thenBy((u) => u.name);
    const sorted = [...users].sort(cmp.reversed());
    expect(sorted.map((u) => u.name)).toEqual(["Charlie", "Bob", "Diana", "Alice"]);
  });
});

describe("naturalOrder / reverseOrder", () => {
  it("naturalOrder — 원시 값 오름차순", () => {
    expect([3, 1, 2].sort(naturalOrder())).toEqual([1, 2, 3]);
    expect(["c", "a", "b"].sort(naturalOrder())).toEqual(["a", "b", "c"]);
  });

  it("reverseOrder — 원시 값 내림차순", () => {
    expect([3, 1, 2].sort(reverseOrder())).toEqual([3, 2, 1]);
  });
});

describe("문자열 정렬", () => {
  it("대소문자 무시 정렬", () => {
    const names = ["Charlie", "alice", "Bob"];
    const sorted = [...names].sort(comparing<string>((s) => s.toLowerCase()));
    expect(sorted).toEqual(["alice", "Bob", "Charlie"]);
  });
});
