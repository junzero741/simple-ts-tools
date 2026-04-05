import { describe, it, expect } from "vitest";
import { diffArrays, diffChars, diffLines, hasDiff, applyDiff, diffStats } from "./diff";

describe("diffArrays", () => {
  it("동일한 배열이면 모두 equal", () => {
    const ops = diffArrays([1, 2, 3], [1, 2, 3]);
    expect(ops.every((op) => op.type === "equal")).toBe(true);
    expect(ops.map((op) => op.value)).toEqual([1, 2, 3]);
  });

  it("삽입을 감지한다", () => {
    const ops = diffArrays([1, 3], [1, 2, 3]);
    expect(ops).toEqual([
      { type: "equal", value: 1 },
      { type: "insert", value: 2 },
      { type: "equal", value: 3 },
    ]);
  });

  it("삭제를 감지한다", () => {
    const ops = diffArrays([1, 2, 3], [1, 3]);
    expect(ops).toEqual([
      { type: "equal", value: 1 },
      { type: "delete", value: 2 },
      { type: "equal", value: 3 },
    ]);
  });

  it("복합 변경", () => {
    const ops = diffArrays([1, 2, 3], [1, 3, 4]);
    expect(ops).toEqual([
      { type: "equal", value: 1 },
      { type: "delete", value: 2 },
      { type: "equal", value: 3 },
      { type: "insert", value: 4 },
    ]);
  });

  it("빈 배열 → 전부 insert", () => {
    const ops = diffArrays([], [1, 2]);
    expect(ops).toEqual([
      { type: "insert", value: 1 },
      { type: "insert", value: 2 },
    ]);
  });

  it("전부 삭제", () => {
    const ops = diffArrays([1, 2], []);
    expect(ops).toEqual([
      { type: "delete", value: 1 },
      { type: "delete", value: 2 },
    ]);
  });

  it("완전히 다른 배열", () => {
    const ops = diffArrays([1, 2], [3, 4]);
    expect(ops.filter((op) => op.type === "delete").length).toBe(2);
    expect(ops.filter((op) => op.type === "insert").length).toBe(2);
  });

  it("커스텀 equals", () => {
    const ops = diffArrays(
      [{ id: 1 }, { id: 2 }],
      [{ id: 1 }, { id: 3 }],
      (a, b) => a.id === b.id,
    );
    expect(ops[0]).toEqual({ type: "equal", value: { id: 1 } });
  });
});

describe("diffChars", () => {
  it("문자 단위 차이를 계산한다", () => {
    const ops = diffChars("abc", "adc");
    expect(ops).toEqual([
      { type: "equal", value: "a" },
      { type: "delete", value: "b" },
      { type: "insert", value: "d" },
      { type: "equal", value: "c" },
    ]);
  });

  it("동일한 문자열", () => {
    expect(diffChars("hello", "hello").every((op) => op.type === "equal")).toBe(true);
  });
});

describe("diffLines", () => {
  it("줄 단위 차이를 계산한다", () => {
    const old = "line1\nline2\nline3";
    const next = "line1\nmodified\nline3";

    const ops = diffLines(old, next);
    expect(ops).toContainEqual({ type: "equal", value: "line1" });
    expect(ops).toContainEqual({ type: "delete", value: "line2" });
    expect(ops).toContainEqual({ type: "insert", value: "modified" });
    expect(ops).toContainEqual({ type: "equal", value: "line3" });
  });
});

describe("hasDiff", () => {
  it("변경이 있으면 true", () => {
    expect(hasDiff(diffArrays([1, 2], [1, 3]))).toBe(true);
  });

  it("동일하면 false", () => {
    expect(hasDiff(diffArrays([1, 2], [1, 2]))).toBe(false);
  });
});

describe("applyDiff", () => {
  it("diff를 적용하면 new 배열이 된다", () => {
    const ops = diffArrays([1, 2, 3], [1, 3, 4]);
    expect(applyDiff(ops)).toEqual([1, 3, 4]);
  });

  it("삽입만", () => {
    expect(applyDiff(diffArrays([], [1, 2]))).toEqual([1, 2]);
  });

  it("삭제만", () => {
    expect(applyDiff(diffArrays([1, 2], []))).toEqual([]);
  });
});

describe("diffStats", () => {
  it("통계를 반환한다", () => {
    const ops = diffArrays([1, 2, 3, 4], [1, 3, 5]);
    const stats = diffStats(ops);

    expect(stats.equal).toBe(2);       // 1, 3
    expect(stats.deleted).toBe(2);     // 2, 4
    expect(stats.inserted).toBe(1);    // 5
  });
});
