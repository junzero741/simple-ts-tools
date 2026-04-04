import { describe, expect, it } from "vitest";
import { bfs } from "./bfs";
import type { TreeNode } from "./dfs";

describe("bfs", () => {
  it("단일 노드 트리를 반환한다", () => {
    const tree: TreeNode<number> = { value: 1, children: [] };
    expect(bfs(tree)).toEqual([1]);
  });

  it("레벨 순서(너비 우선)로 탐색한다", () => {
    //      1
    //    /   \
    //   2     3
    //  / \
    // 4   5
    const tree: TreeNode<number> = {
      value: 1,
      children: [
        {
          value: 2,
          children: [
            { value: 4, children: [] },
            { value: 5, children: [] },
          ],
        },
        { value: 3, children: [] },
      ],
    };
    expect(bfs(tree)).toEqual([1, 2, 3, 4, 5]);
  });

  it("선형 트리(한쪽으로만 뻗은)에서도 올바르게 동작한다", () => {
    // 1 -> 2 -> 3
    const tree: TreeNode<number> = {
      value: 1,
      children: [{ value: 2, children: [{ value: 3, children: [] }] }],
    };
    expect(bfs(tree)).toEqual([1, 2, 3]);
  });

  it("문자열 값을 가진 트리도 처리한다", () => {
    const tree: TreeNode<string> = {
      value: "root",
      children: [
        { value: "a", children: [{ value: "c", children: [] }] },
        { value: "b", children: [] },
      ],
    };
    expect(bfs(tree)).toEqual(["root", "a", "b", "c"]);
  });

  it("넓은 트리(자식이 많은)를 레벨 순서로 탐색한다", () => {
    //       1
    //   / | | \ \
    //  2  3  4  5  6
    const tree: TreeNode<number> = {
      value: 1,
      children: [2, 3, 4, 5, 6].map((v) => ({ value: v, children: [] })),
    };
    expect(bfs(tree)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
