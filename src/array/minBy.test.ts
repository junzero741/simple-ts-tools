import { describe, expect, it } from "vitest";
import { maxBy, minBy } from "./minBy";

describe("minBy", () => {
  it("가장 작은 값을 가진 요소를 반환한다", () => {
    const items = [{ price: 30 }, { price: 10 }, { price: 20 }];
    expect(minBy(items, (i) => i.price)).toEqual({ price: 10 });
  });

  it("단일 요소 배열이면 그 요소를 반환한다", () => {
    expect(minBy([{ v: 5 }], (i) => i.v)).toEqual({ v: 5 });
  });

  it("빈 배열이면 undefined를 반환한다", () => {
    expect(minBy([], (i: { v: number }) => i.v)).toBeUndefined();
  });

  it("음수 값도 처리한다", () => {
    const arr = [{ n: -1 }, { n: -5 }, { n: 3 }];
    expect(minBy(arr, (i) => i.n)).toEqual({ n: -5 });
  });

  it("중복 최솟값이면 첫 번째를 반환한다", () => {
    const arr = [{ v: 1, id: "a" }, { v: 1, id: "b" }, { v: 2, id: "c" }];
    expect(minBy(arr, (i) => i.v)?.id).toBe("a");
  });

  it("날짜를 timestamp로 비교한다", () => {
    const events = [
      { name: "C", at: new Date("2025-03-01").getTime() },
      { name: "A", at: new Date("2025-01-01").getTime() },
      { name: "B", at: new Date("2025-02-01").getTime() },
    ];
    expect(minBy(events, (e) => e.at)?.name).toBe("A");
  });
});

describe("maxBy", () => {
  it("가장 큰 값을 가진 요소를 반환한다", () => {
    const items = [{ score: 70 }, { score: 95 }, { score: 85 }];
    expect(maxBy(items, (i) => i.score)).toEqual({ score: 95 });
  });

  it("단일 요소 배열이면 그 요소를 반환한다", () => {
    expect(maxBy([{ v: 5 }], (i) => i.v)).toEqual({ v: 5 });
  });

  it("빈 배열이면 undefined를 반환한다", () => {
    expect(maxBy([], (i: { v: number }) => i.v)).toBeUndefined();
  });

  it("음수 값도 처리한다", () => {
    const arr = [{ n: -1 }, { n: -5 }, { n: 3 }];
    expect(maxBy(arr, (i) => i.n)).toEqual({ n: 3 });
  });

  it("중복 최댓값이면 첫 번째를 반환한다", () => {
    const arr = [{ v: 5, id: "a" }, { v: 5, id: "b" }, { v: 1, id: "c" }];
    expect(maxBy(arr, (i) => i.v)?.id).toBe("a");
  });

  it("가장 최근 날짜를 찾는다", () => {
    const events = [
      { name: "A", at: new Date("2025-01-01").getTime() },
      { name: "C", at: new Date("2025-03-01").getTime() },
      { name: "B", at: new Date("2025-02-01").getTime() },
    ];
    expect(maxBy(events, (e) => e.at)?.name).toBe("C");
  });
});
