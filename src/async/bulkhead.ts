// 벌크헤드 패턴 (Bulkhead / Isolation).
//
// === 예상 사용처 ===
// - 마이크로서비스에서 서비스별 리소스 격리 (하나의 느린 API가 전체 스레드 고갈 방지)
// - API 게이트웨이에서 테넌트별 동시성 할당 (멀티테넌트 공정 사용)
// - 배치 작업과 실시간 요청의 리소스 분리 (배치가 실시간을 압도 방지)
// - 데이터베이스 커넥션 풀 파티셔닝 (읽기/쓰기 풀 분리)
// - 외부 API 호출 격리 (결제 API 장애가 검색 API에 영향 안 주도록)
// - CPU/메모리 집약 작업 격리 (이미지 처리 vs 일반 요청)
//
// const bulkhead = createBulkhead({
//   "critical": { maxConcurrent: 20, maxQueue: 100 },
//   "batch":    { maxConcurrent: 5,  maxQueue: 50 },
//   "default":  { maxConcurrent: 10, maxQueue: 200 },
// });
//
// await bulkhead.run("critical", () => handlePayment());
// await bulkhead.run("batch", () => processReport());
// bulkhead.stats(); // 파티션별 사용량

export interface PartitionConfig {
  /** 최대 동시 실행 수. */
  maxConcurrent: number;
  /** 최대 대기 큐 크기. 초과 시 즉시 reject. */
  maxQueue?: number;
  /** 대기 타임아웃 ms. */
  queueTimeout?: number;
}

export interface PartitionStats {
  active: number;
  queued: number;
  totalExecuted: number;
  totalRejected: number;
  totalTimedOut: number;
}

export interface Bulkhead {
  /** 지정 파티션에서 함수를 실행한다. 동시성 초과 시 큐 대기. */
  run<T>(partition: string, fn: () => T | Promise<T>): Promise<T>;

  /** 특정 파티션의 통계. */
  stats(partition: string): PartitionStats;

  /** 전체 파티션 통계 맵. */
  allStats(): Record<string, PartitionStats>;

  /** 등록된 파티션 이름. */
  readonly partitions: string[];
}

interface Partition {
  config: PartitionConfig;
  active: number;
  queue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    fn: () => unknown;
    timer?: ReturnType<typeof setTimeout>;
  }>;
  totalExecuted: number;
  totalRejected: number;
  totalTimedOut: number;
}

export function createBulkhead(
  configs: Record<string, PartitionConfig>,
): Bulkhead {
  const partitions = new Map<string, Partition>();

  for (const [name, config] of Object.entries(configs)) {
    partitions.set(name, {
      config,
      active: 0,
      queue: [],
      totalExecuted: 0,
      totalRejected: 0,
      totalTimedOut: 0,
    });
  }

  function getPartition(name: string): Partition {
    const p = partitions.get(name);
    if (!p) throw new Error(`Bulkhead partition "${name}" not found`);
    return p;
  }

  function tryDequeue(p: Partition): void {
    while (p.active < p.config.maxConcurrent && p.queue.length > 0) {
      const waiter = p.queue.shift()!;
      if (waiter.timer) clearTimeout(waiter.timer);
      p.active++;
      executeAndRelease(p, waiter.fn, waiter.resolve, waiter.reject);
    }
  }

  async function executeAndRelease(
    p: Partition,
    fn: () => unknown,
    resolve: (v: unknown) => void,
    reject: (e: Error) => void,
  ): Promise<void> {
    try {
      const result = await fn();
      p.totalExecuted++;
      resolve(result);
    } catch (err) {
      p.totalExecuted++;
      reject(err as Error);
    } finally {
      p.active--;
      tryDequeue(p);
    }
  }

  const bulkhead: Bulkhead = {
    run<T>(partition: string, fn: () => T | Promise<T>): Promise<T> {
      const p = getPartition(partition);

      // 동시성 여유가 있으면 즉시 실행
      if (p.active < p.config.maxConcurrent) {
        p.active++;
        return new Promise<T>((resolve, reject) => {
          executeAndRelease(p, fn as () => unknown, resolve as (v: unknown) => void, reject);
        });
      }

      // 큐 크기 제한 확인
      if (p.config.maxQueue !== undefined && p.queue.length >= p.config.maxQueue) {
        p.totalRejected++;
        return Promise.reject(
          new Error(`Bulkhead partition "${partition}" queue is full (${p.config.maxQueue})`),
        );
      }

      // 큐에 대기
      return new Promise<T>((resolve, reject) => {
        const waiter: (typeof p.queue)[number] = {
          resolve: resolve as (v: unknown) => void,
          reject,
          fn: fn as () => unknown,
        };

        if (p.config.queueTimeout !== undefined) {
          waiter.timer = setTimeout(() => {
            const idx = p.queue.indexOf(waiter);
            if (idx !== -1) {
              p.queue.splice(idx, 1);
              p.totalTimedOut++;
              reject(new Error(`Bulkhead partition "${partition}" queue timeout`));
            }
          }, p.config.queueTimeout);
        }

        p.queue.push(waiter);
      });
    },

    stats(partition: string): PartitionStats {
      const p = getPartition(partition);
      return {
        active: p.active,
        queued: p.queue.length,
        totalExecuted: p.totalExecuted,
        totalRejected: p.totalRejected,
        totalTimedOut: p.totalTimedOut,
      };
    },

    allStats(): Record<string, PartitionStats> {
      const result: Record<string, PartitionStats> = {};
      for (const [name] of partitions) {
        result[name] = bulkhead.stats(name);
      }
      return result;
    },

    get partitions() { return [...partitions.keys()]; },
  };

  return bulkhead;
}
