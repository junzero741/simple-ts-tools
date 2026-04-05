import { describe, it, expect, vi } from "vitest";
import { createUndoStack } from "./undoStack";

describe("createUndoStack", () => {
  describe("push / current", () => {
    it("초기 상태를 설정한다", () => {
      const s = createUndoStack("init");
      expect(s.current).toBe("init");
    });

    it("새 상태를 push한다", () => {
      const s = createUndoStack(0);
      s.push(1);
      s.push(2);
      expect(s.current).toBe(2);
    });
  });

  describe("undo", () => {
    it("이전 상태로 돌아간다", () => {
      const s = createUndoStack("a");
      s.push("b");
      s.push("c");

      expect(s.undo()).toBe("b");
      expect(s.current).toBe("b");

      expect(s.undo()).toBe("a");
      expect(s.current).toBe("a");
    });

    it("더 이상 undo할 수 없으면 undefined", () => {
      const s = createUndoStack("a");
      expect(s.undo()).toBeUndefined();
      expect(s.current).toBe("a");
    });
  });

  describe("redo", () => {
    it("undo한 상태를 다시 실행한다", () => {
      const s = createUndoStack("a");
      s.push("b");
      s.push("c");

      s.undo(); // b
      s.undo(); // a

      expect(s.redo()).toBe("b");
      expect(s.redo()).toBe("c");
      expect(s.current).toBe("c");
    });

    it("더 이상 redo할 수 없으면 undefined", () => {
      const s = createUndoStack("a");
      expect(s.redo()).toBeUndefined();
    });

    it("undo 후 push하면 redo 히스토리가 사라진다", () => {
      const s = createUndoStack("a");
      s.push("b");
      s.push("c");

      s.undo(); // b
      s.push("d");

      expect(s.canRedo).toBe(false);
      expect(s.current).toBe("d");
    });
  });

  describe("canUndo / canRedo", () => {
    it("상태에 따라 정확하다", () => {
      const s = createUndoStack(0);
      expect(s.canUndo).toBe(false);
      expect(s.canRedo).toBe(false);

      s.push(1);
      expect(s.canUndo).toBe(true);
      expect(s.canRedo).toBe(false);

      s.undo();
      expect(s.canUndo).toBe(false);
      expect(s.canRedo).toBe(true);
    });
  });

  describe("undoSize / redoSize", () => {
    it("스택 크기를 반환한다", () => {
      const s = createUndoStack("a");
      s.push("b");
      s.push("c");

      expect(s.undoSize).toBe(2);
      expect(s.redoSize).toBe(0);

      s.undo();
      expect(s.undoSize).toBe(1);
      expect(s.redoSize).toBe(1);
    });
  });

  describe("maxSize", () => {
    it("최대 크기를 초과하면 오래된 상태를 제거한다", () => {
      const s = createUndoStack(0, { maxSize: 3 });

      s.push(1);
      s.push(2);
      s.push(3);
      s.push(4); // 0이 제거됨

      expect(s.undoSize).toBe(3);

      s.undo(); // 3
      s.undo(); // 2
      s.undo(); // 1
      expect(s.current).toBe(1);
      expect(s.canUndo).toBe(false); // 0은 제거됨
    });
  });

  describe("reset", () => {
    it("히스토리를 초기화한다", () => {
      const s = createUndoStack("a");
      s.push("b");
      s.push("c");

      s.reset("new");
      expect(s.current).toBe("new");
      expect(s.canUndo).toBe(false);
      expect(s.canRedo).toBe(false);
    });
  });

  describe("subscribe", () => {
    it("상태 변경을 구독한다", () => {
      const s = createUndoStack(0);
      const states: number[] = [];

      const off = s.subscribe((state) => states.push(state));

      s.push(1);
      s.push(2);
      s.undo();

      off();
      s.push(3); // 구독 해제 후

      expect(states).toEqual([1, 2, 1]);
    });

    it("reset도 알림한다", () => {
      const s = createUndoStack("a");
      const handler = vi.fn();

      s.subscribe(handler);
      s.reset("x");

      expect(handler).toHaveBeenCalledWith("x");
    });
  });

  describe("객체 상태", () => {
    it("복잡한 객체를 관리한다", () => {
      type State = { text: string; cursor: number };
      const s = createUndoStack<State>({ text: "", cursor: 0 });

      s.push({ text: "h", cursor: 1 });
      s.push({ text: "he", cursor: 2 });
      s.push({ text: "hel", cursor: 3 });

      s.undo();
      expect(s.current).toEqual({ text: "he", cursor: 2 });

      s.redo();
      expect(s.current).toEqual({ text: "hel", cursor: 3 });
    });
  });
});
