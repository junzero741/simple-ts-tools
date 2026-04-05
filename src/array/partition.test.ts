import { describe, expect, it } from "vitest";
import { partition } from "./partition";

describe("partition", () => {
  it("짝수와 홀수로 분리한다", () => {
    expect(partition([1, 2, 3, 4, 5], (n) => n % 2 === 0)).toEqual([
      [2, 4],
      [1, 3, 5],
    ]);
  });

  it("객체 배열을 조건으로 분리한다", () => {
    const users = [
      { name: "Alice", active: true },
      { name: "Bob", active: false },
      { name: "Carol", active: true },
    ];
    const [active, inactive] = partition(users, (u) => u.active);
    expect(active).toEqual([
      { name: "Alice", active: true },
      { name: "Carol", active: true },
    ]);
    expect(inactive).toEqual([{ name: "Bob", active: false }]);
  });

  it("모두 통과하면 두 번째 배열이 비어 있다", () => {
    expect(partition([1, 2, 3], () => true)).toEqual([[1, 2, 3], []]);
  });

  it("아무것도 통과 못하면 첫 번째 배열이 비어 있다", () => {
    expect(partition([1, 2, 3], () => false)).toEqual([[], [1, 2, 3]]);
  });

  it("빈 배열이면 두 빈 배열을 반환한다", () => {
    expect(partition([], () => true)).toEqual([[], []]);
  });

  it("타입 가드 predicate로 타입을 좁힌다", () => {
    const values: (string | number)[] = [1, "a", 2, "b", 3];
    const [strings, numbers] = partition(
      values,
      (v): v is string => typeof v === "string"
    );
    // strings는 string[], numbers는 number[] 로 추론됨
    expect(strings).toEqual(["a", "b"]);
    expect(numbers).toEqual([1, 2, 3]);
  });

  it("원래 순서를 유지한다", () => {
    const arr = [5, 1, 4, 2, 3];
    const [big, small] = partition(arr, (n) => n >= 3);
    expect(big).toEqual([5, 4, 3]);
    expect(small).toEqual([1, 2]);
  });
});
