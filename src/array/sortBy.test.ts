import { describe, expect, it } from "vitest";
import { sortBy } from "./sortBy";

const users = [
  { id: 3, name: "Charlie", age: 25 },
  { id: 1, name: "Alice",   age: 30 },
  { id: 2, name: "Bob",     age: 25 },
];

describe("sortBy", () => {
  it("문자열 키로 오름차순 정렬한다", () => {
    const result = sortBy(users, u => u.name);
    expect(result.map(u => u.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  it("숫자 키로 오름차순 정렬한다", () => {
    const result = sortBy(users, u => u.id);
    expect(result.map(u => u.id)).toEqual([1, 2, 3]);
  });

  it("order: 'desc'로 내림차순 정렬한다", () => {
    const result = sortBy(users, u => u.age, "desc");
    expect(result[0].age).toBe(30);
    expect(result[result.length - 1].age).toBe(25);
  });

  it("keyFn 음수 반환으로 내림차순을 표현할 수 있다", () => {
    const result = sortBy(users, u => -u.id);
    expect(result.map(u => u.id)).toEqual([3, 2, 1]);
  });

  it("동일한 키값이면 원래 순서를 유지한다 (stable)", () => {
    // Charlie(25)와 Bob(25)은 age가 같으므로 원본 순서 유지
    const result = sortBy(users, u => u.age);
    const sameAge = result.filter(u => u.age === 25);
    expect(sameAge.map(u => u.name)).toEqual(["Charlie", "Bob"]);
  });

  it("원본 배열을 변경하지 않는다", () => {
    const original = [...users];
    sortBy(users, u => u.name);
    expect(users).toEqual(original);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(sortBy([], x => x)).toEqual([]);
  });
});
