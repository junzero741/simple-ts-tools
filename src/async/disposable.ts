/**
 * 리소스 정리 자동화 (Disposable).
 *
 * 여러 리소스(타이머, 리스너, 커넥션 등)의 cleanup 함수를 등록하고,
 * `dispose()`로 한 번에 정리한다. 등록 역순(LIFO)으로 실행하여
 * 의존 관계가 있는 리소스도 안전하게 해제한다.
 *
 * @example
 * const d = createDisposable();
 *
 * const timer = setInterval(() => poll(), 1000);
 * d.add(() => clearInterval(timer));
 *
 * const conn = await db.connect();
 * d.add(() => conn.close());
 *
 * window.addEventListener("resize", handler);
 * d.add(() => window.removeEventListener("resize", handler));
 *
 * // 컴포넌트 언마운트, 프로세스 종료 등에서 한 번에 정리
 * await d.dispose();
 *
 * @example
 * // using — 스코프 기반 자동 정리
 * await using(async (d) => {
 *   const conn = await db.connect();
 *   d.add(() => conn.close());
 *
 *   const file = await fs.open("data.txt");
 *   d.add(() => file.close());
 *
 *   await processData(conn, file);
 * }); // 여기서 자동 dispose (에러 시에도 보장)
 *
 * @complexity Time: O(n) dispose, n = 등록된 cleanup 수. Space: O(n).
 */

export type CleanupFn = () => void | Promise<void>;

export interface Disposable {
  /** cleanup 함수를 등록한다. 반환값으로 개별 해제 함수를 돌려준다. */
  add(cleanup: CleanupFn): () => void;

  /** 등록된 모든 cleanup을 역순으로 실행한다. 중복 호출은 무시된다. */
  dispose(): Promise<void>;

  /** 이미 dispose되었는지 여부 */
  readonly disposed: boolean;

  /** 등록된 cleanup 수 */
  readonly size: number;
}

export function createDisposable(): Disposable {
  const cleanups: CleanupFn[] = [];
  let isDisposed = false;

  const disposable: Disposable = {
    add(cleanup: CleanupFn): () => void {
      if (isDisposed) {
        throw new Error("Cannot add to a disposed Disposable");
      }
      cleanups.push(cleanup);

      let removed = false;
      return () => {
        if (removed) return;
        removed = true;
        const idx = cleanups.indexOf(cleanup);
        if (idx !== -1) cleanups.splice(idx, 1);
      };
    },

    async dispose(): Promise<void> {
      if (isDisposed) return;
      isDisposed = true;

      const errors: unknown[] = [];

      // 역순 실행 (LIFO) — 나중에 등록된 리소스를 먼저 정리
      while (cleanups.length > 0) {
        const fn = cleanups.pop()!;
        try {
          await fn();
        } catch (err) {
          errors.push(err);
        }
      }

      if (errors.length === 1) throw errors[0];
      if (errors.length > 1) {
        throw new AggregateError(errors, `${errors.length} cleanup(s) failed during dispose`);
      }
    },

    get disposed(): boolean {
      return isDisposed;
    },

    get size(): number {
      return cleanups.length;
    },
  };

  return disposable;
}

/**
 * 스코프 기반 자동 dispose.
 * fn 실행 후(정상/에러 모두) Disposable을 자동으로 dispose한다.
 */
export async function using<T>(fn: (disposable: Disposable) => T | Promise<T>): Promise<T> {
  const d = createDisposable();
  try {
    return await fn(d);
  } finally {
    await d.dispose();
  }
}
