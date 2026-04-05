import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("LIFO 순서로 요소를 꺼낸다", () => {
    const s = new Stack([1, 2, 3]);
    expect(s.pop()).toBe(3);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
  });

  it("push는 top에 추가한다", () => {
    const s = new Stack<number>();
    s.push(10).push(20).push(30);
    expect(s.pop()).toBe(30);
  });

  it("peek은 요소를 제거하지 않는다", () => {
    const s = new Stack([1, 2, 3]);
    expect(s.peek()).toBe(3);
    expect(s.peek()).toBe(3);
    expect(s.size).toBe(3);
  });

  it("빈 스택에서 pop/peek은 undefined를 반환한다", () => {
    const s = new Stack<number>();
    expect(s.pop()).toBeUndefined();
    expect(s.peek()).toBeUndefined();
  });

  it("isEmpty와 size가 올바르게 동작한다", () => {
    const s = new Stack<string>();
    expect(s.isEmpty).toBe(true);
    s.push("a");
    expect(s.isEmpty).toBe(false);
    expect(s.size).toBe(1);
    s.pop();
    expect(s.isEmpty).toBe(true);
  });

  it("clear는 스택을 비운다", () => {
    const s = new Stack([1, 2, 3]);
    s.clear();
    expect(s.size).toBe(0);
    expect(s.isEmpty).toBe(true);
  });

  it("toArray는 bottom→top 순서로 반환한다", () => {
    const s = new Stack([1, 2, 3]);
    s.push(4);
    expect(s.toArray()).toEqual([1, 2, 3, 4]);
  });

  it("괄호 유효성 검사 패턴", () => {
    function isBalanced(str: string): boolean {
      const stack = new Stack<string>();
      const pairs: Record<string, string> = { ")": "(", "}": "{", "]": "[" };
      for (const ch of str) {
        if ("({[".includes(ch)) stack.push(ch);
        else if (")}]".includes(ch)) {
          if (stack.pop() !== pairs[ch]) return false;
        }
      }
      return stack.isEmpty;
    }
    expect(isBalanced("({[]})")).toBe(true);
    expect(isBalanced("({[})")).toBe(false);
    expect(isBalanced("")).toBe(true);
  });
});
