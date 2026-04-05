/**
 * Undo/Redo 스택.
 *
 * 상태 스냅샷을 기록하고 실행 취소/다시 실행을 지원한다.
 * 텍스트 에디터, 폼 히스토리, 캔버스 드로잉, 설정 변경 등에 활용.
 *
 * @example
 * const history = createUndoStack<string>("initial");
 *
 * history.push("step 1");
 * history.push("step 2");
 * history.current;  // "step 2"
 *
 * history.undo();   // "step 1"
 * history.undo();   // "initial"
 * history.redo();   // "step 1"
 *
 * // undo 후 새 상태를 push하면 redo 히스토리가 사라진다
 * history.push("step 3");
 * history.canRedo;  // false
 *
 * @example
 * // maxSize로 메모리 제한
 * const history = createUndoStack<State>(initialState, { maxSize: 50 });
 *
 * @complexity
 * - push/undo/redo: O(1)
 * - Space: O(n) n = 히스토리 크기
 */

export interface UndoStackOptions {
  /** 최대 히스토리 크기. 초과 시 가장 오래된 상태 제거. */
  maxSize?: number;
}

export interface UndoStack<T> {
  /** 현재 상태. */
  readonly current: T;

  /** 새 상태를 기록한다. redo 히스토리는 사라진다. */
  push(state: T): void;

  /** 실행 취소. 이전 상태를 반환한다. */
  undo(): T | undefined;

  /** 다시 실행. 다음 상태를 반환한다. */
  redo(): T | undefined;

  /** undo 가능 여부. */
  readonly canUndo: boolean;

  /** redo 가능 여부. */
  readonly canRedo: boolean;

  /** undo 스택 크기. */
  readonly undoSize: number;

  /** redo 스택 크기. */
  readonly redoSize: number;

  /** 히스토리를 초기화하고 상태를 설정한다. */
  reset(state: T): void;

  /** 상태 변경 시 구독. 해제 함수 반환. */
  subscribe(handler: (state: T) => void): () => void;
}

export function createUndoStack<T>(
  initialState: T,
  options: UndoStackOptions = {},
): UndoStack<T> {
  const { maxSize } = options;

  const past: T[] = [];
  const future: T[] = [];
  let current = initialState;
  const listeners = new Set<(state: T) => void>();

  function notify(): void {
    for (const h of listeners) h(current);
  }

  const stack: UndoStack<T> = {
    get current() { return current; },

    push(state: T): void {
      past.push(current);
      current = state;
      future.length = 0;

      if (maxSize !== undefined && past.length > maxSize) {
        past.shift();
      }

      notify();
    },

    undo(): T | undefined {
      if (past.length === 0) return undefined;
      future.push(current);
      current = past.pop()!;
      notify();
      return current;
    },

    redo(): T | undefined {
      if (future.length === 0) return undefined;
      past.push(current);
      current = future.pop()!;
      notify();
      return current;
    },

    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    get undoSize() { return past.length; },
    get redoSize() { return future.length; },

    reset(state: T): void {
      past.length = 0;
      future.length = 0;
      current = state;
      notify();
    },

    subscribe(handler: (state: T) => void): () => void {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };

  return stack;
}
