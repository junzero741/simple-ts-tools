import { describe, it, expect, vi } from "vitest";
import { createCommandHistory } from "./commandHistory";

describe("createCommandHistory", () => {
  describe("execute / undo / redo", () => {
    it("커맨드를 실행하고 취소한다", () => {
      let value = 0;
      const h = createCommandHistory();

      h.execute({
        execute: () => { value = 10; },
        undo: () => { value = 0; },
      });
      expect(value).toBe(10);

      h.undo();
      expect(value).toBe(0);

      h.redo();
      expect(value).toBe(10);
    });

    it("여러 커맨드를 순서대로 취소한다", () => {
      const log: string[] = [];
      const h = createCommandHistory();

      h.execute({ execute: () => log.push("A"), undo: () => log.pop() });
      h.execute({ execute: () => log.push("B"), undo: () => log.pop() });
      h.execute({ execute: () => log.push("C"), undo: () => log.pop() });

      expect(log).toEqual(["A", "B", "C"]);

      h.undo();
      expect(log).toEqual(["A", "B"]);

      h.undo();
      expect(log).toEqual(["A"]);
    });

    it("undo 후 새 execute는 redo 히스토리를 폐기한다", () => {
      const h = createCommandHistory();
      h.execute({ execute: () => {}, undo: () => {} });
      h.execute({ execute: () => {}, undo: () => {} });
      h.undo();
      expect(h.canRedo).toBe(true);

      h.execute({ execute: () => {}, undo: () => {} });
      expect(h.canRedo).toBe(false);
    });

    it("빈 스택에서 undo/redo는 false", () => {
      const h = createCommandHistory();
      expect(h.undo()).toBe(false);
      expect(h.redo()).toBe(false);
    });
  });

  describe("group (매크로)", () => {
    it("여러 커맨드를 하나로 묶는다", () => {
      let a = 0, b = 0;
      const h = createCommandHistory();

      h.group("batch", () => {
        h.execute({ execute: () => { a = 1; }, undo: () => { a = 0; } });
        h.execute({ execute: () => { b = 2; }, undo: () => { b = 0; } });
      });

      expect(a).toBe(1);
      expect(b).toBe(2);
      expect(h.undoSize).toBe(1); // 매크로 1개

      h.undo(); // 둘 다 취소
      expect(a).toBe(0);
      expect(b).toBe(0);
    });

    it("redo도 하나로 동작한다", () => {
      let a = 0, b = 0;
      const h = createCommandHistory();

      h.group("batch", () => {
        h.execute({ execute: () => { a = 1; }, undo: () => { a = 0; } });
        h.execute({ execute: () => { b = 2; }, undo: () => { b = 0; } });
      });

      h.undo();
      h.redo();
      expect(a).toBe(1);
      expect(b).toBe(2);
    });

    it("빈 그룹은 무시한다", () => {
      const h = createCommandHistory();
      h.group("empty", () => {});
      expect(h.undoSize).toBe(0);
    });

    it("중첩 그룹을 지원한다", () => {
      let value = 0;
      const h = createCommandHistory();

      h.group("outer", () => {
        h.execute({ execute: () => { value += 1; }, undo: () => { value -= 1; } });
        h.group("inner", () => {
          h.execute({ execute: () => { value += 10; }, undo: () => { value -= 10; } });
          h.execute({ execute: () => { value += 100; }, undo: () => { value -= 100; } });
        });
      });

      expect(value).toBe(111);
      expect(h.undoSize).toBe(1);

      h.undo();
      expect(value).toBe(0);
    });
  });

  describe("canUndo / canRedo / sizes", () => {
    it("상태가 정확하다", () => {
      const h = createCommandHistory();

      expect(h.canUndo).toBe(false);
      expect(h.canRedo).toBe(false);
      expect(h.undoSize).toBe(0);

      h.execute({ execute: () => {}, undo: () => {} });
      expect(h.canUndo).toBe(true);
      expect(h.undoSize).toBe(1);

      h.undo();
      expect(h.canRedo).toBe(true);
      expect(h.redoSize).toBe(1);
    });
  });

  describe("descriptions", () => {
    it("커맨드 설명 목록을 반환한다", () => {
      const h = createCommandHistory();

      h.execute({ execute: () => {}, undo: () => {}, description: "First" });
      h.execute({ execute: () => {}, undo: () => {}, description: "Second" });

      expect(h.undoDescriptions).toEqual(["Second", "First"]);
    });
  });

  describe("maxSize", () => {
    it("최대 크기를 초과하면 오래된 커맨드를 제거한다", () => {
      const h = createCommandHistory({ maxSize: 2 });

      h.execute({ execute: () => {}, undo: () => {}, description: "A" });
      h.execute({ execute: () => {}, undo: () => {}, description: "B" });
      h.execute({ execute: () => {}, undo: () => {}, description: "C" });

      expect(h.undoSize).toBe(2);
      expect(h.undoDescriptions).toEqual(["C", "B"]);
    });
  });

  describe("clear", () => {
    it("히스토리를 초기화한다", () => {
      const h = createCommandHistory();
      h.execute({ execute: () => {}, undo: () => {} });
      h.clear();

      expect(h.undoSize).toBe(0);
      expect(h.redoSize).toBe(0);
    });
  });

  describe("subscribe", () => {
    it("execute/undo/redo를 알린다", () => {
      const h = createCommandHistory();
      const events: string[] = [];

      h.subscribe((type) => events.push(type));

      h.execute({ execute: () => {}, undo: () => {} });
      h.undo();
      h.redo();

      expect(events).toEqual(["execute", "undo", "redo"]);
    });

    it("해제 함수로 구독 취소", () => {
      const h = createCommandHistory();
      const fn = vi.fn();

      const off = h.subscribe(fn);
      off();
      h.execute({ execute: () => {}, undo: () => {} });

      expect(fn).not.toHaveBeenCalled();
    });
  });
});
