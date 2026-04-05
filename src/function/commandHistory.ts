// 커맨드 패턴 Undo/Redo (Command History).
//
// UndoStack이 상태 전체를 스냅샷하는 반면, 이건 각 변경을
// execute/undo 함수 쌍으로 기록한다. 대형 상태에서 메모리 효율적이고,
// 여러 커맨드를 하나로 묶는 매크로(group)를 지원한다.
//
// const history = createCommandHistory();
//
// history.execute({
//   execute: () => { doc.insert(0, "Hello"); },
//   undo: () => { doc.delete(0, 5); },
//   description: "Insert text",
// });
//
// history.undo();  // doc.delete(0, 5) 실행
// history.redo();  // doc.insert(0, "Hello") 재실행
//
// // 매크로 — 여러 커맨드를 하나로
// history.group("Format paragraph", () => {
//   history.execute(boldCmd);
//   history.execute(alignCmd);
// });
// history.undo(); // boldCmd + alignCmd 한 번에 취소

export interface Command {
  execute(): void;
  undo(): void;
  description?: string;
}

export interface CommandHistoryOptions {
  maxSize?: number;
}

export interface CommandHistory {
  /** 커맨드를 실행하고 히스토리에 기록한다. */
  execute(command: Command): void;

  /** 마지막 커맨드를 취소한다. */
  undo(): boolean;

  /** 취소한 커맨드를 다시 실행한다. */
  redo(): boolean;

  /** 여러 커맨드를 하나의 매크로로 묶어 실행한다. */
  group(description: string, fn: () => void): void;

  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoSize: number;
  readonly redoSize: number;

  /** undo 스택의 커맨드 설명 목록. */
  readonly undoDescriptions: string[];

  /** redo 스택의 커맨드 설명 목록. */
  readonly redoDescriptions: string[];

  /** 히스토리를 초기화한다. */
  clear(): void;

  /** 상태 변경 구독. 해제 함수 반환. */
  subscribe(handler: (type: "execute" | "undo" | "redo") => void): () => void;
}

export function createCommandHistory(
  options: CommandHistoryOptions = {},
): CommandHistory {
  const { maxSize } = options;

  const undoStack: Command[] = [];
  const redoStack: Command[] = [];
  const listeners = new Set<(type: "execute" | "undo" | "redo") => void>();
  let grouping = false;
  let groupCommands: Command[] = [];

  function notify(type: "execute" | "undo" | "redo"): void {
    for (const h of listeners) h(type);
  }

  const history: CommandHistory = {
    execute(command: Command): void {
      command.execute();

      if (grouping) {
        groupCommands.push(command);
        return;
      }

      undoStack.push(command);
      redoStack.length = 0;

      if (maxSize !== undefined && undoStack.length > maxSize) {
        undoStack.shift();
      }

      notify("execute");
    },

    undo(): boolean {
      if (undoStack.length === 0) return false;
      const command = undoStack.pop()!;
      command.undo();
      redoStack.push(command);
      notify("undo");
      return true;
    },

    redo(): boolean {
      if (redoStack.length === 0) return false;
      const command = redoStack.pop()!;
      command.execute();
      undoStack.push(command);
      notify("redo");
      return true;
    },

    group(description: string, fn: () => void): void {
      const prevGrouping = grouping;
      const prevCommands = groupCommands;
      grouping = true;
      groupCommands = [];

      try {
        fn();
      } finally {
        const cmds = groupCommands;
        grouping = prevGrouping;
        groupCommands = prevCommands;

        if (cmds.length === 0) return;

        const macro: Command = {
          execute() { for (const c of cmds) c.execute(); },
          undo() { for (let i = cmds.length - 1; i >= 0; i--) cmds[i].undo(); },
          description,
        };

        if (grouping) {
          groupCommands.push(macro);
        } else {
          undoStack.push(macro);
          redoStack.length = 0;
          if (maxSize !== undefined && undoStack.length > maxSize) {
            undoStack.shift();
          }
          notify("execute");
        }
      }
    },

    get canUndo() { return undoStack.length > 0; },
    get canRedo() { return redoStack.length > 0; },
    get undoSize() { return undoStack.length; },
    get redoSize() { return redoStack.length; },

    get undoDescriptions() {
      return undoStack.map((c) => c.description ?? "").reverse();
    },

    get redoDescriptions() {
      return redoStack.map((c) => c.description ?? "").reverse();
    },

    clear(): void {
      undoStack.length = 0;
      redoStack.length = 0;
    },

    subscribe(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };

  return history;
}
