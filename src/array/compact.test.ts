import { describe, expect, it } from "vitest";
import { compact } from "./compact";

describe("compact", () => {
  it("falsy 값(false, null, undefined, 0, NaN, '')을 제거한다", () => {
    expect(compact([0, 1, false, 2, "", 3, null, undefined, NaN])).toEqual([
      1, 2, 3,
    ]);
  });

  it("모두 truthy이면 원본과 동일한 배열을 반환한다", () => {
    expect(compact([1, "hello", true, {}])).toEqual([1, "hello", true, {}]);
  });

  it("모두 falsy이면 빈 배열을 반환한다", () => {
    expect(compact([null, undefined, false, 0, ""])).toEqual([]);
  });

  it("빈 배열을 처리한다", () => {
    expect(compact([])).toEqual([]);
  });

  it("null / undefined만 필터링하는 패턴에서도 동작한다", () => {
    const arr: (string | null | undefined)[] = ["a", null, "b", undefined, "c"];
    const result: string[] = compact(arr);
    expect(result).toEqual(["a", "b", "c"]);
  });

  it("숫자 0은 제거하지만 양수는 유지한다", () => {
    expect(compact([0, 1, 0, 2, 0, 3])).toEqual([1, 2, 3]);
  });
});
