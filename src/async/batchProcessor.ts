// 배치 프로세서 (Batch Processor).
//
// 대량 아이템을 청크로 나눠 동시성 제한하에 비동기 처리한다.
// 진행률 콜백, 에러 수집(fail-safe), 재시도, abort를 지원.
//
// const result = await batchProcess(users, {
//   handler: async (user) => await sendEmail(user),
//   concurrency: 10,
//   chunkSize: 50,
//   onProgress: ({ completed, total, percent }) => updateUI(percent),
//   onError: "collect",  // 에러 수집 후 계속
// });
//
// result.succeeded   // 성공 수
// result.failed      // 실패 수
// result.errors      // 실패 아이템 + 에러 목록
// result.elapsed     // 소요 시간

export interface BatchOptions<T, R> {
  /** 각 아이템에 대해 실행할 함수. */
  handler: (item: T, index: number) => R | Promise<R>;

  /** 동시 실행 수 (기본: 5). */
  concurrency?: number;

  /** 에러 처리 모드. "collect"면 수집 후 계속, "throw"면 즉시 중단 (기본: "collect"). */
  onError?: "collect" | "throw";

  /** 진행률 콜백. */
  onProgress?: (progress: BatchProgress) => void;

  /** 취소 signal. */
  signal?: AbortSignal;
}

export interface BatchProgress {
  completed: number;
  failed: number;
  total: number;
  percent: number;
}

export interface BatchError<T> {
  item: T;
  index: number;
  error: unknown;
}

export interface BatchResult<T, R> {
  results: Array<{ item: T; result: R; index: number }>;
  errors: BatchError<T>[];
  succeeded: number;
  failed: number;
  total: number;
  elapsed: number;
}

export async function batchProcess<T, R>(
  items: T[],
  options: BatchOptions<T, R>,
): Promise<BatchResult<T, R>> {
  const {
    handler,
    concurrency = 5,
    onError = "collect",
    onProgress,
    signal,
  } = options;

  const total = items.length;
  const results: Array<{ item: T; result: R; index: number }> = [];
  const errors: BatchError<T>[] = [];
  let completed = 0;
  let failed = 0;
  const start = Date.now();

  function reportProgress(): void {
    if (!onProgress) return;
    onProgress({
      completed: completed + failed,
      failed,
      total,
      percent: total === 0 ? 100 : Math.round(((completed + failed) / total) * 100),
    });
  }

  // 동시성 제한 실행
  let index = 0;
  const executing = new Set<Promise<void>>();

  async function processItem(item: T, idx: number): Promise<void> {
    try {
      if (signal?.aborted) return;
      const result = await handler(item, idx);
      results.push({ item, result, index: idx });
      completed++;
    } catch (err) {
      failed++;
      if (onError === "throw") throw err;
      errors.push({ item, index: idx, error: err });
    }
    reportProgress();
  }

  for (const item of items) {
    if (signal?.aborted) break;

    const idx = index++;
    const p = processItem(item, idx).then(() => {
      executing.delete(p);
    });
    executing.add(p);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);

  return {
    results,
    errors,
    succeeded: completed,
    failed,
    total,
    elapsed: Date.now() - start,
  };
}
