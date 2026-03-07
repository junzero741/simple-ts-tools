export interface TreeNode<T = number> {
  value: T;
  children: TreeNode<T>[];
}

/**
 * 트리를 DFS(후위 순회)로 탐색하여 값 배열을 반환한다.
 * @example dfs({ value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] }) // [2, 3, 1]
 * @complexity Time: O(n) | Space: O(n)
 */
export function dfs<T>(node: TreeNode<T>): T[] {
  const results: T[] = [];
  traverse(node, results);
  return results;
}

function traverse<T>(node: TreeNode<T>, results: T[]): void {
  for (const child of node.children) {
    traverse(child, results);
  }
  results.push(node.value);
}
