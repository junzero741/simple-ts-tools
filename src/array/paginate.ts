export interface PaginationResult<T> {
  /** 현재 페이지의 데이터 */
  data: T[];
  /** 전체 항목 수 */
  total: number;
  /** 현재 페이지 번호 (1-indexed) */
  page: number;
  /** 페이지당 항목 수 */
  pageSize: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 다음 페이지가 있는지 */
  hasNext: boolean;
  /** 이전 페이지가 있는지 */
  hasPrev: boolean;
}

/**
 * 배열을 페이지네이션한다.
 *
 * - page는 1-indexed
 * - page가 범위를 벗어나면 빈 data 반환 (throw 없음)
 * - pageSize ≤ 0 이면 pageSize = 1로 처리
 *
 * @example
 * const result = paginate([1,2,3,4,5,6,7,8,9,10], 2, 3);
 * // { data: [4,5,6], total: 10, page: 2, pageSize: 3, totalPages: 4, hasNext: true, hasPrev: true }
 */
export function paginate<T>(
  arr: T[],
  page: number,
  pageSize: number
): PaginationResult<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const total = arr.length;
  const totalPages = Math.ceil(total / size) || 1;
  const currentPage = Math.max(1, Math.floor(page));

  const start = (currentPage - 1) * size;
  const data = start >= total ? [] : arr.slice(start, start + size);

  return {
    data,
    total,
    page: currentPage,
    pageSize: size,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}
