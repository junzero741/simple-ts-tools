import { describe, expect, it } from "vitest";
import { deepDiff, deepPatch, hasDeepDiff, invertChanges } from "./deepDiff";

describe("deepDiff — 원시값", () => {
  it("동일 원시값이면 빈 배열", () => {
    expect(deepDiff(1, 1)).toEqual([]);
    expect(deepDiff("hello", "hello")).toEqual([]);
    expect(deepDiff(null, null)).toEqual([]);
  });

  it("다른 원시값이면 (root) update", () => {
    const changes = deepDiff(1, 2);
    expect(changes).toEqual([{ type: "update", path: "(root)", oldValue: 1, newValue: 2 }]);
  });
});

describe("deepDiff — 평탄 객체", () => {
  it("변경 없으면 빈 배열", () => {
    expect(deepDiff({ a: 1, b: "x" }, { a: 1, b: "x" })).toEqual([]);
  });

  it("값 변경 감지", () => {
    const changes = deepDiff({ a: 1, b: 2 }, { a: 1, b: 9 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ type: "update", path: "b", oldValue: 2, newValue: 9 });
  });

  it("키 추가 감지", () => {
    const changes = deepDiff({ a: 1 }, { a: 1, b: 2 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ type: "add", path: "b", newValue: 2 });
  });

  it("키 삭제 감지", () => {
    const changes = deepDiff({ a: 1, b: 2 }, { a: 1 });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ type: "remove", path: "b", oldValue: 2 });
  });

  it("여러 변경 동시 감지", () => {
    const changes = deepDiff(
      { a: 1, b: 2, c: 3 },
      { a: 1, b: 9, d: 4 },
    );
    const types = Object.fromEntries(changes.map(c => [c.path, c.type]));
    expect(types).toMatchObject({ b: "update", c: "remove", d: "add" });
  });
});

describe("deepDiff — 중첩 객체", () => {
  it("중첩 경로로 변경 감지", () => {
    const changes = deepDiff(
      { user: { name: "Alice", age: 30 } },
      { user: { name: "Alice", age: 31 } },
    );
    expect(changes).toEqual([
      { type: "update", path: "user.age", oldValue: 30, newValue: 31 },
    ]);
  });

  it("깊이 3단계 이상 경로", () => {
    const changes = deepDiff(
      { a: { b: { c: { d: 1 } } } },
      { a: { b: { c: { d: 2 } } } },
    );
    expect(changes[0].path).toBe("a.b.c.d");
  });

  it("중첩 객체 내 키 추가/삭제", () => {
    const changes = deepDiff(
      { config: { host: "localhost", port: 5432 } },
      { config: { host: "prod.db", ssl: true } },
    );
    const byPath = Object.fromEntries(changes.map(c => [c.path, c]));
    expect(byPath["config.host"].type).toBe("update");
    expect(byPath["config.port"].type).toBe("remove");
    expect(byPath["config.ssl"].type).toBe("add");
  });

  it("한쪽이 객체이고 다른 쪽이 원시값이면 update", () => {
    const changes = deepDiff({ a: { b: 1 } }, { a: 42 });
    expect(changes[0]).toMatchObject({ type: "update", path: "a" });
  });
});

describe("deepDiff — 배열", () => {
  it("동일 배열이면 빈 배열", () => {
    expect(deepDiff([1, 2, 3], [1, 2, 3])).toEqual([]);
  });

  it("배열 요소 변경", () => {
    const changes = deepDiff([1, 2, 3], [1, 9, 3]);
    expect(changes).toEqual([
      { type: "update", path: "[1]", oldValue: 2, newValue: 9 },
    ]);
  });

  it("배열 요소 추가", () => {
    const changes = deepDiff(["a", "b"], ["a", "b", "c"]);
    expect(changes).toEqual([
      { type: "add", path: "[2]", newValue: "c" },
    ]);
  });

  it("배열 요소 삭제", () => {
    const changes = deepDiff(["a", "b", "c"], ["a", "b"]);
    expect(changes).toEqual([
      { type: "remove", path: "[2]", oldValue: "c" },
    ]);
  });

  it("배열 내 객체 변경", () => {
    const changes = deepDiff(
      [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      [{ id: 1, name: "Alice" }, { id: 2, name: "Bobby" }],
    );
    expect(changes).toEqual([
      { type: "update", path: "[1].name", oldValue: "Bob", newValue: "Bobby" },
    ]);
  });

  it("객체 내 배열 경로", () => {
    const changes = deepDiff(
      { user: { tags: ["ts", "js"] } },
      { user: { tags: ["ts", "js", "rust"] } },
    );
    expect(changes).toEqual([
      { type: "add", path: "user.tags[2]", newValue: "rust" },
    ]);
  });
});

describe("deepDiff — Date / 특수 타입", () => {
  it("동일 날짜는 변경 없음", () => {
    const d = new Date("2024-01-01");
    expect(deepDiff({ t: d }, { t: new Date("2024-01-01") })).toEqual([]);
  });

  it("다른 날짜는 update", () => {
    const changes = deepDiff(
      { t: new Date("2024-01-01") },
      { t: new Date("2024-06-01") },
    );
    expect(changes[0].type).toBe("update");
    expect(changes[0].path).toBe("t");
  });
});

describe("hasDeepDiff", () => {
  it("변경 없으면 false", () => {
    expect(hasDeepDiff({ a: 1 }, { a: 1 })).toBe(false);
  });

  it("변경 있으면 true", () => {
    expect(hasDeepDiff({ a: 1 }, { a: 2 })).toBe(true);
  });
});

describe("invertChanges", () => {
  it("add → remove", () => {
    const orig = [{ type: "add" as const, path: "x", newValue: 1 }];
    const inv = invertChanges(orig);
    expect(inv[0]).toEqual({ type: "remove", path: "x", oldValue: 1 });
  });

  it("remove → add", () => {
    const orig = [{ type: "remove" as const, path: "x", oldValue: 1 }];
    const inv = invertChanges(orig);
    expect(inv[0]).toEqual({ type: "add", path: "x", newValue: 1 });
  });

  it("update → update (방향 역전)", () => {
    const orig = [{ type: "update" as const, path: "x", oldValue: 1, newValue: 2 }];
    const inv = invertChanges(orig);
    expect(inv[0]).toEqual({ type: "update", path: "x", oldValue: 2, newValue: 1 });
  });
});

describe("deepPatch", () => {
  it("update 변경 적용", () => {
    const original = { user: { name: "Alice", age: 30 } };
    const changes = deepDiff(original, { user: { name: "Alice", age: 31 } });
    const result = deepPatch(original, changes);
    expect(result).toEqual({ user: { name: "Alice", age: 31 } });
  });

  it("add 변경 적용", () => {
    const original = { a: 1 };
    const changes = deepDiff(original, { a: 1, b: 2 });
    expect(deepPatch(original, changes)).toEqual({ a: 1, b: 2 });
  });

  it("remove 변경 적용", () => {
    const original = { a: 1, b: 2 };
    const changes = deepDiff(original, { a: 1 });
    const result = deepPatch(original, changes);
    expect(result).toEqual({ a: 1 });
    expect("b" in result).toBe(false);
  });

  it("원본 객체를 변경하지 않는다 (비파괴)", () => {
    const original = { user: { age: 30 } };
    const changes = deepDiff(original, { user: { age: 31 } });
    deepPatch(original, changes);
    expect(original.user.age).toBe(30);
  });

  it("배열 변경 적용", () => {
    const original = { tags: ["ts", "js"] };
    const changes = deepDiff(original, { tags: ["ts", "js", "rust"] });
    expect(deepPatch(original, changes)).toEqual({ tags: ["ts", "js", "rust"] });
  });

  it("빈 변경 목록이면 동일한 구조 반환", () => {
    const original = { a: 1 };
    expect(deepPatch(original, [])).toEqual({ a: 1 });
  });
});

describe("deepDiff + invertChanges + deepPatch — undo/redo", () => {
  it("변경 후 undo하면 원래 상태로 복원된다", () => {
    const original = {
      user: { name: "Alice", age: 30 },
      tags: ["ts"],
      active: true,
    };
    const updated = {
      user: { name: "Alice", age: 31 },
      tags: ["ts", "js"],
      active: true,
    };

    const changes = deepDiff(original, updated);
    const afterPatch = deepPatch(original, changes);
    expect(afterPatch).toEqual(updated);

    const undoChanges = invertChanges(changes);
    const restored = deepPatch(afterPatch, undoChanges);
    expect(restored).toEqual(original);
  });

  it("여러 단계 undo", () => {
    let state = { count: 0 };
    const history: ReturnType<typeof deepDiff>[] = [];

    function applyChange(next: typeof state) {
      history.push(deepDiff(state, next));
      state = deepPatch(state, history[history.length - 1]);
    }

    applyChange({ count: 1 });
    applyChange({ count: 2 });
    applyChange({ count: 3 });

    expect(state.count).toBe(3);

    // 두 단계 undo
    state = deepPatch(state, invertChanges(history.pop()!));
    expect(state.count).toBe(2);

    state = deepPatch(state, invertChanges(history.pop()!));
    expect(state.count).toBe(1);
  });
});

describe("실사용 시나리오", () => {
  it("폼 dirty 감지 — 중첩 필드 변경 추적", () => {
    const saved = {
      profile: { name: "Alice", bio: "Engineer" },
      settings: { theme: "dark", notifications: true },
    };
    const current = {
      profile: { name: "Alice", bio: "Senior Engineer" },
      settings: { theme: "dark", notifications: true },
    };

    const changes = deepDiff(saved, current);
    expect(hasDeepDiff(saved, current)).toBe(true);
    expect(changes).toHaveLength(1);
    expect(changes[0].path).toBe("profile.bio");
  });

  it("감사 로그 — 정확한 변경 경로 기록", () => {
    const before = { order: { status: "pending", items: [{ id: 1, qty: 2 }] } };
    const after  = { order: { status: "shipped", items: [{ id: 1, qty: 2 }] } };

    const log = deepDiff(before, after);
    expect(log[0]).toMatchObject({
      type: "update",
      path: "order.status",
      oldValue: "pending",
      newValue: "shipped",
    });
  });
});
