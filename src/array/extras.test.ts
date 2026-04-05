import { describe, expect, it } from "vitest";
import { first, last, move, toggle } from "./extras";

describe("first", () => {
  it("배열의 첫 번째 요소를 반환한다", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(first(["a", "b"])).toBe("a");
  });

  it("빈 배열은 undefined를 반환한다", () => {
    expect(first([])).toBeUndefined();
  });

  it("요소가 하나인 배열", () => {
    expect(first([42])).toBe(42);
  });
});

describe("last", () => {
  it("배열의 마지막 요소를 반환한다", () => {
    expect(last([1, 2, 3])).toBe(3);
    expect(last(["a", "b", "c"])).toBe("c");
  });

  it("빈 배열은 undefined를 반환한다", () => {
    expect(last([])).toBeUndefined();
  });

  it("요소가 하나인 배열", () => {
    expect(last([99])).toBe(99);
  });
});

describe("move", () => {
  it("앞에서 뒤로 이동한다", () => {
    expect(move([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
  });

  it("뒤에서 앞으로 이동한다", () => {
    expect(move([1, 2, 3, 4], 3, 0)).toEqual([4, 1, 2, 3]);
  });

  it("인접 요소 교환", () => {
    expect(move([1, 2, 3], 1, 2)).toEqual([1, 3, 2]);
    expect(move([1, 2, 3], 2, 1)).toEqual([1, 3, 2]);
  });

  it("from === to이면 동일한 배열 반환", () => {
    expect(move([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
  });

  it("원본 배열을 변경하지 않는다 (비파괴)", () => {
    const arr = [1, 2, 3];
    move(arr, 0, 2);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("빈 배열을 처리한다", () => {
    expect(move([], 0, 0)).toEqual([]);
  });

  it("인덱스 범위 초과는 clamp된다", () => {
    expect(move([1, 2, 3], -1, 10)).toEqual([2, 3, 1]); // 0 → 2
  });

  it("실사용: drag-and-drop 순서 변경", () => {
    const items = ["Task A", "Task B", "Task C", "Task D"];
    // 세 번째("Task C")를 맨 앞으로
    expect(move(items, 2, 0)).toEqual(["Task C", "Task A", "Task B", "Task D"]);
  });
});

describe("toggle", () => {
  it("없는 요소를 추가한다", () => {
    expect(toggle([1, 2, 3], 4)).toEqual([1, 2, 3, 4]);
  });

  it("있는 요소를 제거한다", () => {
    expect(toggle([1, 2, 3], 2)).toEqual([1, 3]);
  });

  it("빈 배열에 추가한다", () => {
    expect(toggle([], 5)).toEqual([5]);
  });

  it("마지막 요소 제거 시 빈 배열 반환", () => {
    expect(toggle([1], 1)).toEqual([]);
  });

  it("원본 배열을 변경하지 않는다 (비파괴)", () => {
    const arr = [1, 2, 3];
    toggle(arr, 2);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("keyFn으로 객체 배열 토글 (id 기준)", () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const removed = toggle(items, { id: 2 }, (x) => x.id);
    expect(removed).toEqual([{ id: 1 }, { id: 3 }]);

    const added = toggle(items, { id: 4 }, (x) => x.id);
    expect(added).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });

  it("실사용: 멀티셀렉트 태그 선택/해제", () => {
    const selected = ["react", "typescript"];
    expect(toggle(selected, "vue")).toEqual(["react", "typescript", "vue"]);
    expect(toggle(selected, "react")).toEqual(["typescript"]);
  });
});
