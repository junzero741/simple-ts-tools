import { describe, expect, it } from "vitest";
import { scan } from "./scan";

describe("scan", () => {
  it("누적 합을 반환한다", () => {
    expect(scan([1, 2, 3, 4], 0, (acc, x) => acc + x)).toEqual([1, 3, 6, 10]);
  });

  it("누적 곱을 반환한다", () => {
    expect(scan([1, 2, 3, 4], 1, (acc, x) => acc * x)).toEqual([1, 2, 6, 24]);
  });

  it("초기값은 결과에 포함되지 않는다", () => {
    const result = scan([10, 20, 30], 0, (acc, x) => acc + x);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe(10); // not 0
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(scan([], 0, (acc, x: number) => acc + x)).toEqual([]);
  });

  it("단일 요소는 fn(initial, item)을 반환한다", () => {
    expect(scan([5], 10, (acc, x) => acc + x)).toEqual([15]);
  });

  it("인덱스를 세 번째 인자로 제공한다", () => {
    const indices: number[] = [];
    scan([10, 20, 30], 0, (acc, x, i) => {
      indices.push(i);
      return acc + x;
    });
    expect(indices).toEqual([0, 1, 2]);
  });

  it("다른 타입으로 누적 (T → U)", () => {
    const result = scan(
      ["a", "b", "c"],
      "",
      (acc, s) => acc + s
    );
    expect(result).toEqual(["a", "ab", "abc"]);
  });

  describe("실사용 시나리오", () => {
    it("잔액 추적 — 입출금 내역", () => {
      const transactions = [100, -10, 20, -5, 50];
      const balances = scan(transactions, 0, (acc, x) => acc + x);
      expect(balances).toEqual([100, 90, 110, 105, 155]);
    });

    it("누적 진행률 — 각 작업의 누적 비율", () => {
      const weights = [10, 30, 60]; // 총합 100
      const cumulative = scan(weights, 0, (acc, w) => acc + w);
      expect(cumulative).toEqual([10, 40, 100]);
    });

    it("프리픽스 합 — 범위 합 O(1) 조회를 위한 전처리", () => {
      const arr = [3, 1, 4, 1, 5, 9];
      const prefix = [0, ...scan(arr, 0, (acc, x) => acc + x)];
      // prefix: [0, 3, 4, 8, 9, 14, 23]
      // 인덱스 [2,4] (inclusive): arr[2]+arr[3]+arr[4] = 4+1+5=10 = prefix[5]-prefix[2]
      expect(prefix[5] - prefix[2]).toBe(10);
    });

    it("최대 연속 부분합의 각 단계 추적 (prefix max 패턴)", () => {
      const scores = [1, -2, 3, 4, -1];
      const running = scan(scores, 0, (acc, x) => acc + x);
      expect(running).toEqual([1, -1, 2, 6, 5]);
      expect(Math.max(...running)).toBe(6);
    });
  });
});
