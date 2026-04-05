import { describe, expect, it } from "vitest";
import { paginate } from "./paginate";

const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe("paginate", () => {
  it("첫 번째 페이지를 반환한다", () => {
    const result = paginate(arr, 1, 3);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(3);
    expect(result.total).toBe(10);
    expect(result.totalPages).toBe(4);
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it("중간 페이지를 반환한다", () => {
    const result = paginate(arr, 2, 3);
    expect(result.data).toEqual([4, 5, 6]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it("마지막 페이지 — 남은 항목만 반환한다", () => {
    const result = paginate(arr, 4, 3);
    expect(result.data).toEqual([10]); // 10번째 항목 하나만
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it("pageSize가 배열 크기보다 크면 전체 반환", () => {
    const result = paginate(arr, 1, 100);
    expect(result.data).toEqual(arr);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it("빈 배열을 처리한다", () => {
    const result = paginate([], 1, 10);
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });

  it("범위를 벗어난 페이지는 빈 data 반환", () => {
    const result = paginate(arr, 99, 3);
    expect(result.data).toEqual([]);
    expect(result.page).toBe(99);
  });

  it("pageSize ≤ 0 이면 1로 처리", () => {
    const result = paginate([1, 2, 3], 1, 0);
    expect(result.data).toEqual([1]);
    expect(result.pageSize).toBe(1);
  });

  it("정확한 totalPages 계산", () => {
    expect(paginate(arr, 1, 5).totalPages).toBe(2);   // 10/5=2
    expect(paginate(arr, 1, 4).totalPages).toBe(3);   // ceil(10/4)=3
    expect(paginate(arr, 1, 10).totalPages).toBe(1);  // 10/10=1
    expect(paginate(arr, 1, 11).totalPages).toBe(1);  // ceil(10/11)=1
  });

  it("실사용: 게시물 목록 페이지네이션", () => {
    const posts = Array.from({ length: 53 }, (_, i) => ({ id: i + 1 }));
    const page3 = paginate(posts, 3, 10);
    expect(page3.data).toHaveLength(10);
    expect(page3.data[0]).toEqual({ id: 21 });
    expect(page3.totalPages).toBe(6); // ceil(53/10)=6
    expect(page3.hasNext).toBe(true);
    expect(page3.hasPrev).toBe(true);

    const lastPage = paginate(posts, 6, 10);
    expect(lastPage.data).toHaveLength(3); // 51,52,53
    expect(lastPage.hasNext).toBe(false);
  });
});
