import { describe, it, expect } from "vitest";
import { dfs, TreeNode } from "./dfs";

describe("dfs", () => {
  it("단일 노드", () => {
    const node: TreeNode = { value: 1, children: [] };
    expect(dfs(node)).toEqual([1]);
  });

  it("후위 순회 순서로 반환", () => {
    const tree: TreeNode = {
      value: 1,
      children: [
        { value: 2, children: [] },
        { value: 3, children: [] },
      ],
    };
    expect(dfs(tree)).toEqual([2, 3, 1]);
  });

  it("깊은 트리", () => {
    const tree: TreeNode = {
      value: 1,
      children: [
        {
          value: 2,
          children: [
            { value: 4, children: [] },
            { value: 5, children: [] },
          ],
        },
        { value: 3, children: [{ value: 6, children: [] }] },
      ],
    };
    expect(dfs(tree)).toEqual([4, 5, 2, 6, 3, 1]);
  });

  it("문자열 값", () => {
    const tree: TreeNode<string> = {
      value: "a",
      children: [
        { value: "b", children: [] },
        { value: "c", children: [] },
      ],
    };
    expect(dfs(tree)).toEqual(["b", "c", "a"]);
  });
});
