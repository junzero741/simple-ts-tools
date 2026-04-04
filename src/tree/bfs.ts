import type { TreeNode } from "./dfs";

/**
 * 트리를 BFS(너비 우선 탐색, 레벨 순서)로 탐색하여 값 배열을 반환한다.
 *
 * @example
 * const tree = { value: 1, children: [
 *   { value: 2, children: [{ value: 4, children: [] }] },
 *   { value: 3, children: [] }
 * ]};
 * bfs(tree) // [1, 2, 3, 4]
 *
 * @complexity Time: O(n) | Space: O(n)
 */
export function bfs<T>(root: TreeNode<T>): T[] {
  const results: T[] = [];
  const queue: TreeNode<T>[] = [root];

  while (queue.length > 0) {
    const node = queue.shift()!;
    results.push(node.value);
    for (const child of node.children) {
      queue.push(child);
    }
  }

  return results;
}
