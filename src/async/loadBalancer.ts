// 로드 밸런서 (Load Balancer).
//
// === 예상 사용처 ===
// - 여러 API 엔드포인트 중 하나를 선택하여 요청 분산 (CDN, 리전별 서버)
// - DB 읽기 복제본(read replica) 선택 (쓰기는 마스터, 읽기는 복제본)
// - 마이크로서비스 클라이언트 사이드 로드 밸런싱 (서비스 디스커버리 후)
// - WebSocket 서버 풀에서 연결할 서버 선택
// - 워커 스레드/프로세스 풀에 작업 배분
// - A/B 테스트 트래픽 분배 (가중치 기반)
//
// const lb = createLoadBalancer(["s1.api.com", "s2.api.com", "s3.api.com"]);
// lb.next();  // "s1.api.com" (round-robin)
// lb.next();  // "s2.api.com"
//
// const weighted = createLoadBalancer(
//   [{ target: "fast", weight: 3 }, { target: "slow", weight: 1 }],
//   { strategy: "weighted-round-robin" },
// );

export type Strategy = "round-robin" | "random" | "least-connections" | "weighted-round-robin";

export interface WeightedTarget<T> {
  target: T;
  weight: number;
}

export interface LoadBalancerOptions {
  strategy?: Strategy;
}

export interface LoadBalancer<T> {
  /** 다음 대상을 선택한다. */
  next(): T;

  /** 대상에 연결을 추가한다 (least-connections 용). */
  acquire(target: T): void;

  /** 대상의 연결을 해제한다. */
  release(target: T): void;

  /** 대상을 풀에서 제거한다 (장애 격리). */
  remove(target: T): void;

  /** 제거된 대상을 복원한다. */
  restore(target: T): void;

  /** 활성 대상 목록. */
  readonly targets: T[];

  /** 대상 수. */
  readonly size: number;
}

export function createLoadBalancer<T>(
  targets: T[] | WeightedTarget<T>[],
  options: LoadBalancerOptions = {},
): LoadBalancer<T> {
  const { strategy = "round-robin" } = options;

  const isWeighted = targets.length > 0 && typeof targets[0] === "object" && targets[0] !== null && "weight" in (targets[0] as object);

  let pool: T[];
  let weights: Map<T, number>;
  const removed = new Set<T>();
  const connections = new Map<T, number>();
  let index = 0;

  if (isWeighted) {
    const wt = targets as WeightedTarget<T>[];
    pool = wt.map((w) => w.target);
    weights = new Map(wt.map((w) => [w.target, w.weight]));
  } else {
    pool = [...(targets as T[])];
    weights = new Map(pool.map((t) => [t, 1]));
  }

  for (const t of pool) connections.set(t, 0);

  function activeTargets(): T[] {
    return pool.filter((t) => !removed.has(t));
  }

  function nextRoundRobin(): T {
    const active = activeTargets();
    if (active.length === 0) throw new Error("No available targets");
    const target = active[index % active.length];
    index = (index + 1) % active.length;
    return target;
  }

  function nextRandom(): T {
    const active = activeTargets();
    if (active.length === 0) throw new Error("No available targets");
    return active[Math.floor(Math.random() * active.length)];
  }

  function nextLeastConnections(): T {
    const active = activeTargets();
    if (active.length === 0) throw new Error("No available targets");
    let min = Infinity;
    let best = active[0];
    for (const t of active) {
      const c = connections.get(t) ?? 0;
      if (c < min) { min = c; best = t; }
    }
    return best;
  }

  function nextWeightedRoundRobin(): T {
    const active = activeTargets();
    if (active.length === 0) throw new Error("No available targets");

    // 가중치 배열 확장
    const expanded: T[] = [];
    for (const t of active) {
      const w = weights.get(t) ?? 1;
      for (let i = 0; i < w; i++) expanded.push(t);
    }

    const target = expanded[index % expanded.length];
    index = (index + 1) % expanded.length;
    return target;
  }

  const lb: LoadBalancer<T> = {
    next(): T {
      switch (strategy) {
        case "round-robin": return nextRoundRobin();
        case "random": return nextRandom();
        case "least-connections": return nextLeastConnections();
        case "weighted-round-robin": return nextWeightedRoundRobin();
      }
    },

    acquire(target) { connections.set(target, (connections.get(target) ?? 0) + 1); },
    release(target) { connections.set(target, Math.max(0, (connections.get(target) ?? 0) - 1)); },

    remove(target) { removed.add(target); },
    restore(target) { removed.delete(target); },

    get targets() { return activeTargets(); },
    get size() { return activeTargets().length; },
  };

  return lb;
}
