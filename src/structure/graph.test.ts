import { describe, it, expect } from "vitest";
import { createGraph } from "./graph";

describe("createGraph", () => {
  describe("노드/간선 관리", () => {
    it("노드를 추가한다", () => {
      const g = createGraph<string>();
      g.addNode("A").addNode("B");
      expect(g.nodeCount).toBe(2);
      expect(g.hasNode("A")).toBe(true);
    });

    it("간선을 추가하면 노드도 자동 추가된다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B");
      expect(g.hasNode("A")).toBe(true);
      expect(g.hasNode("B")).toBe(true);
    });

    it("무방향 — 양쪽에서 접근 가능", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B");
      expect(g.hasEdge("A", "B")).toBe(true);
      expect(g.hasEdge("B", "A")).toBe(true);
    });

    it("방향 — 한쪽만 접근 가능", () => {
      const g = createGraph<string>({ directed: true });
      g.addEdge("A", "B");
      expect(g.hasEdge("A", "B")).toBe(true);
      expect(g.hasEdge("B", "A")).toBe(false);
    });

    it("가중치 간선", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B", 5);
      expect(g.neighbors("A")).toEqual([{ node: "B", weight: 5 }]);
    });

    it("기본 가중치는 1", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B");
      expect(g.neighbors("A")[0].weight).toBe(1);
    });

    it("간선을 제거한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B");
      g.removeEdge("A", "B");
      expect(g.hasEdge("A", "B")).toBe(false);
      expect(g.hasEdge("B", "A")).toBe(false);
    });

    it("노드를 제거한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B");
      g.addEdge("A", "C");
      g.removeNode("A");
      expect(g.hasNode("A")).toBe(false);
      expect(g.neighbors("B").length).toBe(0);
    });

    it("nodes — 노드 목록", () => {
      const g = createGraph<string>();
      g.addEdge("X", "Y");
      expect(g.nodes.sort()).toEqual(["X", "Y"]);
    });
  });

  describe("BFS", () => {
    it("너비 우선 순회한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B").addEdge("A", "C").addEdge("B", "D").addEdge("C", "D");
      const result = g.bfs("A");
      expect(result[0]).toBe("A");
      expect(result).toContain("B");
      expect(result).toContain("C");
      expect(result).toContain("D");
      expect(result.length).toBe(4);
    });
  });

  describe("DFS", () => {
    it("깊이 우선 순회한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B").addEdge("A", "C").addEdge("B", "D");
      const result = g.dfs("A");
      expect(result[0]).toBe("A");
      expect(result.length).toBe(4);
    });
  });

  describe("Dijkstra", () => {
    it("최단 거리를 계산한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B", 4);
      g.addEdge("A", "C", 2);
      g.addEdge("C", "B", 1);
      g.addEdge("B", "D", 3);
      g.addEdge("C", "D", 8);

      const dist = g.dijkstra("A");
      expect(dist.get("A")).toBe(0);
      expect(dist.get("C")).toBe(2);
      expect(dist.get("B")).toBe(3); // A→C→B (2+1)
      expect(dist.get("D")).toBe(6); // A→C→B→D (2+1+3)
    });
  });

  describe("shortestPath", () => {
    it("최단 경로와 거리를 반환한다", () => {
      const g = createGraph<string>();
      g.addEdge("A", "B", 1);
      g.addEdge("B", "C", 2);
      g.addEdge("A", "C", 10);

      const result = g.shortestPath("A", "C");
      expect(result).toBeDefined();
      expect(result!.distance).toBe(3);
      expect(result!.path).toEqual(["A", "B", "C"]);
    });

    it("도달 불가 시 undefined", () => {
      const g = createGraph<string>({ directed: true });
      g.addNode("A").addNode("B");
      expect(g.shortestPath("A", "B")).toBeUndefined();
    });
  });

  describe("topologicalSort", () => {
    it("DAG를 위상 정렬한다", () => {
      const g = createGraph<string>({ directed: true });
      g.addEdge("a", "b");
      g.addEdge("a", "c");
      g.addEdge("b", "d");
      g.addEdge("c", "d");

      const sorted = g.topologicalSort();
      expect(sorted.indexOf("a")).toBeLessThan(sorted.indexOf("b"));
      expect(sorted.indexOf("a")).toBeLessThan(sorted.indexOf("c"));
      expect(sorted.indexOf("b")).toBeLessThan(sorted.indexOf("d"));
      expect(sorted.indexOf("c")).toBeLessThan(sorted.indexOf("d"));
    });

    it("사이클이 있으면 에러를 던진다", () => {
      const g = createGraph<string>({ directed: true });
      g.addEdge("a", "b").addEdge("b", "c").addEdge("c", "a");
      expect(() => g.topologicalSort()).toThrow("cycle");
    });
  });

  describe("hasCycle", () => {
    it("방향 그래프 — 사이클 감지", () => {
      const g = createGraph<string>({ directed: true });
      g.addEdge("a", "b").addEdge("b", "c");
      expect(g.hasCycle()).toBe(false);

      g.addEdge("c", "a");
      expect(g.hasCycle()).toBe(true);
    });

    it("무방향 그래프 — 사이클 감지", () => {
      const g = createGraph<string>();
      g.addEdge("a", "b").addEdge("b", "c");
      expect(g.hasCycle()).toBe(false);

      g.addEdge("c", "a");
      expect(g.hasCycle()).toBe(true);
    });

    it("노드만 있으면 사이클 없음", () => {
      const g = createGraph<string>({ directed: true });
      g.addNode("a").addNode("b");
      expect(g.hasCycle()).toBe(false);
    });
  });

  describe("체이닝", () => {
    it("addNode/addEdge를 체이닝한다", () => {
      const g = createGraph<number>()
        .addNode(0)
        .addEdge(0, 1, 5)
        .addEdge(1, 2, 3);

      expect(g.nodeCount).toBe(3);
      expect(g.shortestPath(0, 2)!.distance).toBe(8);
    });
  });
});
