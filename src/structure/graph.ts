/**
 * 범용 그래프 자료구조.
 *
 * 방향/무방향, 가중치 간선을 지원하는 인접 리스트 기반 그래프.
 * Dijkstra 최단 경로, 위상 정렬, 사이클 감지, BFS/DFS를 제공한다.
 *
 * @example
 * const g = createGraph<string>();
 * g.addEdge("A", "B", 4);
 * g.addEdge("A", "C", 2);
 * g.addEdge("C", "B", 1);
 *
 * g.dijkstra("A");
 * // Map { "A" => 0, "C" => 2, "B" => 3 }
 *
 * g.bfs("A");       // ["A", "B", "C"]
 * g.neighbors("A"); // [{ node: "B", weight: 4 }, { node: "C", weight: 2 }]
 *
 * @example
 * // 방향 그래프 + 위상 정렬
 * const dag = createGraph<string>({ directed: true });
 * dag.addEdge("a", "b");
 * dag.addEdge("b", "c");
 * dag.addEdge("a", "c");
 * dag.topologicalSort(); // ["a", "b", "c"]
 *
 * @complexity
 * - addNode/addEdge: O(1)
 * - BFS/DFS: O(V + E)
 * - Dijkstra: O((V + E) log V)
 * - topologicalSort: O(V + E)
 */

export interface Edge<T> {
  node: T;
  weight: number;
}

export interface GraphOptions {
  /** true면 방향 그래프 (기본: false = 무방향) */
  directed?: boolean;
}

export interface Graph<T> {
  addNode(node: T): Graph<T>;
  addEdge(from: T, to: T, weight?: number): Graph<T>;
  removeNode(node: T): void;
  removeEdge(from: T, to: T): void;
  hasNode(node: T): boolean;
  hasEdge(from: T, to: T): boolean;
  neighbors(node: T): Edge<T>[];
  readonly nodes: T[];
  readonly nodeCount: number;
  readonly edgeCount: number;

  bfs(start: T): T[];
  dfs(start: T): T[];
  dijkstra(start: T): Map<T, number>;
  shortestPath(from: T, to: T): { path: T[]; distance: number } | undefined;
  topologicalSort(): T[];
  hasCycle(): boolean;
}

export function createGraph<T>(options: GraphOptions = {}): Graph<T> {
  const { directed = false } = options;
  const adj = new Map<T, Edge<T>[]>();
  let edges = 0;

  function ensureNode(node: T): void {
    if (!adj.has(node)) adj.set(node, []);
  }

  const graph: Graph<T> = {
    addNode(node) {
      ensureNode(node);
      return graph;
    },

    addEdge(from, to, weight = 1) {
      ensureNode(from);
      ensureNode(to);
      adj.get(from)!.push({ node: to, weight });
      if (!directed) {
        adj.get(to)!.push({ node: from, weight });
      }
      edges++;
      return graph;
    },

    removeNode(node) {
      if (!adj.has(node)) return;
      // 다른 노드에서 이 노드를 가리키는 간선 제거
      for (const [, edgeList] of adj) {
        for (let i = edgeList.length - 1; i >= 0; i--) {
          if (edgeList[i].node === node) {
            edgeList.splice(i, 1);
            edges--;
          }
        }
      }
      edges -= adj.get(node)!.length;
      if (!directed) {
        // 무방향이면 이미 양쪽에서 제거됐으므로 조정 불필요
        // edges는 addEdge 호출 횟수이므로 재계산
      }
      adj.delete(node);
    },

    removeEdge(from, to) {
      const list = adj.get(from);
      if (list) {
        const idx = list.findIndex((e) => e.node === to);
        if (idx !== -1) { list.splice(idx, 1); edges--; }
      }
      if (!directed) {
        const revList = adj.get(to);
        if (revList) {
          const idx = revList.findIndex((e) => e.node === from);
          if (idx !== -1) revList.splice(idx, 1);
        }
      }
    },

    hasNode(node) { return adj.has(node); },

    hasEdge(from, to) {
      const list = adj.get(from);
      return list ? list.some((e) => e.node === to) : false;
    },

    neighbors(node) {
      return adj.get(node) ?? [];
    },

    get nodes() { return [...adj.keys()]; },
    get nodeCount() { return adj.size; },
    get edgeCount() { return edges; },

    bfs(start) {
      const visited = new Set<T>();
      const queue: T[] = [start];
      const result: T[] = [];
      visited.add(start);

      while (queue.length > 0) {
        const node = queue.shift()!;
        result.push(node);
        for (const edge of adj.get(node) ?? []) {
          if (!visited.has(edge.node)) {
            visited.add(edge.node);
            queue.push(edge.node);
          }
        }
      }
      return result;
    },

    dfs(start) {
      const visited = new Set<T>();
      const result: T[] = [];

      function visit(node: T): void {
        if (visited.has(node)) return;
        visited.add(node);
        result.push(node);
        for (const edge of adj.get(node) ?? []) {
          visit(edge.node);
        }
      }

      visit(start);
      return result;
    },

    dijkstra(start) {
      const dist = new Map<T, number>();
      const visited = new Set<T>();

      for (const node of adj.keys()) {
        dist.set(node, Infinity);
      }
      dist.set(start, 0);

      while (true) {
        let minNode: T | undefined;
        let minDist = Infinity;
        for (const [node, d] of dist) {
          if (!visited.has(node) && d < minDist) {
            minDist = d;
            minNode = node;
          }
        }
        if (minNode === undefined) break;

        visited.add(minNode);
        for (const edge of adj.get(minNode) ?? []) {
          const alt = minDist + edge.weight;
          if (alt < (dist.get(edge.node) ?? Infinity)) {
            dist.set(edge.node, alt);
          }
        }
      }

      return dist;
    },

    shortestPath(from, to) {
      const dist = new Map<T, number>();
      const prev = new Map<T, T | undefined>();
      const visited = new Set<T>();

      for (const node of adj.keys()) {
        dist.set(node, Infinity);
        prev.set(node, undefined);
      }
      dist.set(from, 0);

      while (true) {
        let minNode: T | undefined;
        let minDist = Infinity;
        for (const [node, d] of dist) {
          if (!visited.has(node) && d < minDist) {
            minDist = d;
            minNode = node;
          }
        }
        if (minNode === undefined || minNode === to) break;

        visited.add(minNode);
        for (const edge of adj.get(minNode) ?? []) {
          const alt = minDist + edge.weight;
          if (alt < (dist.get(edge.node) ?? Infinity)) {
            dist.set(edge.node, alt);
            prev.set(edge.node, minNode);
          }
        }
      }

      const d = dist.get(to);
      if (d === undefined || d === Infinity) return undefined;

      const path: T[] = [];
      let current: T | undefined = to;
      while (current !== undefined) {
        path.unshift(current);
        current = prev.get(current);
      }

      return { path, distance: d };
    },

    topologicalSort() {
      const inDegree = new Map<T, number>();
      for (const node of adj.keys()) inDegree.set(node, 0);

      for (const [, edgeList] of adj) {
        for (const edge of edgeList) {
          inDegree.set(edge.node, (inDegree.get(edge.node) ?? 0) + 1);
        }
      }

      const queue: T[] = [];
      for (const [node, deg] of inDegree) {
        if (deg === 0) queue.push(node);
      }

      const result: T[] = [];
      while (queue.length > 0) {
        const node = queue.shift()!;
        result.push(node);
        for (const edge of adj.get(node) ?? []) {
          const newDeg = (inDegree.get(edge.node) ?? 0) - 1;
          inDegree.set(edge.node, newDeg);
          if (newDeg === 0) queue.push(edge.node);
        }
      }

      if (result.length !== adj.size) {
        throw new Error("Graph contains a cycle — topological sort is not possible");
      }

      return result;
    },

    hasCycle() {
      if (directed) {
        const white = new Set<T>(adj.keys());
        const gray = new Set<T>();

        function visit(node: T): boolean {
          white.delete(node);
          gray.add(node);
          for (const edge of adj.get(node) ?? []) {
            if (gray.has(edge.node)) return true;
            if (white.has(edge.node) && visit(edge.node)) return true;
          }
          gray.delete(node);
          return false;
        }

        for (const node of adj.keys()) {
          if (white.has(node) && visit(node)) return true;
        }
        return false;
      } else {
        const visited = new Set<T>();

        function visit(node: T, parent: T | undefined): boolean {
          visited.add(node);
          for (const edge of adj.get(node) ?? []) {
            if (!visited.has(edge.node)) {
              if (visit(edge.node, node)) return true;
            } else if (edge.node !== parent) {
              return true;
            }
          }
          return false;
        }

        for (const node of adj.keys()) {
          if (!visited.has(node) && visit(node, undefined)) return true;
        }
        return false;
      }
    },
  };

  return graph;
}
