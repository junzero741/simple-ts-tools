import { describe, expect, it } from "vitest";
import { unzip, zipWith } from "./unzip";

describe("unzip", () => {
  it("2-튜플 배열을 두 배열로 분리한다", () => {
    const [nums, strs] = unzip([[1, "a"], [2, "b"], [3, "c"]]);
    expect(nums).toEqual([1, 2, 3]);
    expect(strs).toEqual(["a", "b", "c"]);
  });

  it("3-튜플 배열을 세 배열로 분리한다", () => {
    const [a, b, c] = unzip([[1, "a", true], [2, "b", false]]);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual(["a", "b"]);
    expect(c).toEqual([true, false]);
  });

  it("zip의 역연산 — zip → unzip → 원본 복원", () => {
    const nums = [1, 2, 3];
    const strs = ["a", "b", "c"];

    // zip으로 묶고 unzip으로 다시 분리
    const zipped = [[1, "a"], [2, "b"], [3, "c"]] as [number, string][];
    const [restoredNums, restoredStrs] = unzip(zipped);

    expect(restoredNums).toEqual(nums);
    expect(restoredStrs).toEqual(strs);
  });

  it("매트릭스 전치 (transpose)", () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
    ];
    const transposed = unzip(matrix);
    expect(transposed).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });

  it("정방형 매트릭스 전치", () => {
    const matrix = [
      [1, 2],
      [3, 4],
    ];
    expect(unzip(matrix)).toEqual([[1, 3], [2, 4]]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(unzip([])).toEqual([]);
  });

  it("단일 튜플도 처리한다", () => {
    const [a, b] = unzip([[1, "a"]]);
    expect(a).toEqual([1]);
    expect(b).toEqual(["a"]);
  });

  it("실사용: Object.entries 키/값 분리", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const entries = Object.entries(obj) as [string, number][];
    const [keys, values] = unzip(entries);
    expect(keys).toEqual(["a", "b", "c"]);
    expect(values).toEqual([1, 2, 3]);
  });

  it("실사용: 좌표 배열을 x/y 배열로 분리", () => {
    const points = [[10, 20], [30, 40], [50, 60]] as [number, number][];
    const [xs, ys] = unzip(points);
    expect(xs).toEqual([10, 30, 50]);
    expect(ys).toEqual([20, 40, 60]);
  });
});

describe("zipWith", () => {
  describe("2개 배열", () => {
    it("결합 함수를 적용한 결과 배열을 반환한다", () => {
      expect(zipWith([1, 2, 3], [4, 5, 6], (a, b) => a + b)).toEqual([5, 7, 9]);
    });

    it("가장 짧은 배열 길이에 맞춘다", () => {
      expect(zipWith([1, 2, 3], [4, 5], (a, b) => a + b)).toEqual([5, 7]);
    });

    it("문자열 결합", () => {
      expect(
        zipWith(["Hello", "Good"], ["World", "Morning"], (a, b) => `${a} ${b}`)
      ).toEqual(["Hello World", "Good Morning"]);
    });

    it("빈 배열은 빈 배열을 반환한다", () => {
      expect(zipWith([], [1, 2, 3], (a: never, b: number) => a + b)).toEqual([]);
    });
  });

  describe("3개 배열", () => {
    it("세 배열을 결합 함수에 적용한다", () => {
      expect(
        zipWith([1, 2], [3, 4], [5, 6], (a, b, c) => a + b + c)
      ).toEqual([9, 12]);
    });
  });

  describe("실사용 시나리오", () => {
    it("요소별 연산 — 벡터 덧셈", () => {
      const v1 = [1, 2, 3];
      const v2 = [4, 5, 6];
      expect(zipWith(v1, v2, (a, b) => a + b)).toEqual([5, 7, 9]);
    });

    it("두 가격 배열의 차이 계산", () => {
      const prev = [100, 200, 300];
      const curr = [110, 190, 320];
      const changes = zipWith(prev, curr, (p, c) =>
        Math.round((c - p) / p * 100)
      );
      expect(changes).toEqual([10, -5, 7]);
    });

    it("이름 + 점수 결합으로 레이블 생성", () => {
      const names = ["Alice", "Bob", "Charlie"];
      const scores = [95, 80, 88];
      const labels = zipWith(names, scores, (name, score) => `${name}: ${score}`);
      expect(labels).toEqual(["Alice: 95", "Bob: 80", "Charlie: 88"]);
    });

    it("zip + map의 일괄 처리 (zip 없이 바로 결합)", () => {
      // zip([1,2,3], [4,5,6]).map(([a,b]) => a * b) 와 동일
      expect(zipWith([1, 2, 3], [4, 5, 6], (a, b) => a * b)).toEqual([4, 10, 18]);
    });
  });
});
