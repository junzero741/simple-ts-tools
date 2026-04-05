import { describe, it, expect } from "vitest";
import {
  naturalCompare, naturalCompareInsensitive,
  naturalSort, naturalSortBy,
} from "./naturalSort";

describe("naturalCompare", () => {
  it("숫자를 값으로 비교한다", () => {
    expect(naturalCompare("file2", "file10")).toBeLessThan(0);
    expect(naturalCompare("file10", "file2")).toBeGreaterThan(0);
    expect(naturalCompare("file2", "file2")).toBe(0);
  });

  it("문자열 부분은 사전순", () => {
    expect(naturalCompare("abc", "abd")).toBeLessThan(0);
    expect(naturalCompare("abc", "abc")).toBe(0);
  });

  it("혼합 비교", () => {
    expect(naturalCompare("a1b", "a2b")).toBeLessThan(0);
    expect(naturalCompare("a10b", "a2b")).toBeGreaterThan(0);
  });

  it("빈 문자열", () => {
    expect(naturalCompare("", "a")).toBeLessThan(0);
    expect(naturalCompare("a", "")).toBeGreaterThan(0);
    expect(naturalCompare("", "")).toBe(0);
  });
});

describe("naturalSort", () => {
  it("파일명을 자연 정렬한다", () => {
    expect(naturalSort(["file1", "file10", "file2", "file20", "file3"]))
      .toEqual(["file1", "file2", "file3", "file10", "file20"]);
  });

  it("버전 번호를 정렬한다", () => {
    expect(naturalSort(["v1.10", "v1.9", "v1.2", "v1.1"]))
      .toEqual(["v1.1", "v1.2", "v1.9", "v1.10"]);
  });

  it("이미지 파일 정렬", () => {
    expect(naturalSort(["img12", "img2", "img1", "img20", "img3"]))
      .toEqual(["img1", "img2", "img3", "img12", "img20"]);
  });

  it("숫자만", () => {
    expect(naturalSort(["10", "9", "1", "100", "2"]))
      .toEqual(["1", "2", "9", "10", "100"]);
  });

  it("문자만 (사전순과 동일)", () => {
    expect(naturalSort(["banana", "apple", "cherry"]))
      .toEqual(["apple", "banana", "cherry"]);
  });

  it("빈 배열", () => {
    expect(naturalSort([])).toEqual([]);
  });

  it("선행 0 처리", () => {
    const sorted = naturalSort(["item01", "item1", "item001"]);
    // 같은 수치 → 선행0 적은 것이 뒤
    expect(sorted[0]).not.toBe(sorted[1]);
  });

  it("복잡한 혼합", () => {
    expect(naturalSort(["a1", "a20", "a2", "b1", "a10"]))
      .toEqual(["a1", "a2", "a10", "a20", "b1"]);
  });
});

describe("naturalCompareInsensitive", () => {
  it("대소문자를 무시한다", () => {
    expect(naturalCompareInsensitive("File2", "file10")).toBeLessThan(0);
    expect(naturalCompareInsensitive("ABC", "abc")).toBe(0);
  });
});

describe("naturalSortBy", () => {
  it("객체 배열을 키로 자연 정렬한다", () => {
    const files = [
      { name: "doc10.pdf" },
      { name: "doc2.pdf" },
      { name: "doc1.pdf" },
    ];

    const sorted = naturalSortBy(files, (f) => f.name);
    expect(sorted.map((f) => f.name)).toEqual(["doc1.pdf", "doc2.pdf", "doc10.pdf"]);
  });

  it("대소문자 무시 옵션", () => {
    const items = [
      { label: "Beta2" },
      { label: "alpha10" },
      { label: "alpha1" },
    ];

    const sorted = naturalSortBy(items, (i) => i.label, true);
    expect(sorted.map((i) => i.label)).toEqual(["alpha1", "alpha10", "Beta2"]);
  });

  it("원본 불변", () => {
    const original = [{ n: "b" }, { n: "a" }];
    naturalSortBy(original, (x) => x.n);
    expect(original[0].n).toBe("b");
  });
});
