import { describe, expect, it } from "vitest";
import { difference } from "./difference";

describe("difference", () => {
  it("첫 번째에만 있는 요소를 반환한다", () => {
    expect(difference([1, 2, 3], [2, 3])).toEqual([1]);
  });

  it("두 번째 배열에 없는 요소가 없으면 빈 배열을 반환한다", () => {
    expect(difference([1, 2], [1, 2, 3])).toEqual([]);
  });

  it("두 번째 배열이 비어 있으면 첫 번째 배열 전체를 반환한다", () => {
    expect(difference([1, 2, 3], [])).toEqual([1, 2, 3]);
  });

  it("중복 요소는 한 번만 포함한다", () => {
    expect(difference([1, 1, 2, 2, 3], [3])).toEqual([1, 2]);
  });

  it("keyFn으로 객체 배열의 차집합을 구한다", () => {
    const prev = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const next = [{ id: 2 }, { id: 3 }];
    // id:1 이 삭제됨
    expect(difference(prev, next, u => u.id)).toEqual([{ id: 1 }]);
  });

  it("변경 감지 패턴: 추가/삭제된 항목 분리", () => {
    const prev = [1, 2, 3];
    const next = [2, 3, 4];
    const removed = difference(prev, next); // [1]
    const added   = difference(next, prev); // [4]
    expect(removed).toEqual([1]);
    expect(added).toEqual([4]);
  });
});
