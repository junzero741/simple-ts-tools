// 자연 정렬 (Natural Sort / Human Sort).
//
// 사람이 기대하는 방식으로 문자열을 정렬한다.
// 기본 sort: ["file1", "file10", "file2"] (사전순)
// natural:  ["file1", "file2", "file10"] (숫자 인식)
//
// naturalCompare("file2", "file10")  → -1
// ["v1.9", "v1.10", "v1.2"].sort(naturalCompare) → ["v1.2", "v1.9", "v1.10"]
//
// naturalSort(["img12", "img2", "img1"]) → ["img1", "img2", "img12"]

const CHUNK_RE = /(\d+|\D+)/g;

/**
 * 자연 정렬 비교 함수. Array.prototype.sort()에 바로 전달 가능.
 */
export function naturalCompare(a: string, b: string): number {
  const chunksA = a.match(CHUNK_RE) ?? [];
  const chunksB = b.match(CHUNK_RE) ?? [];

  const len = Math.min(chunksA.length, chunksB.length);

  for (let i = 0; i < len; i++) {
    const ca = chunksA[i];
    const cb = chunksB[i];

    const na = /^\d+$/.test(ca) ? parseInt(ca, 10) : NaN;
    const nb = /^\d+$/.test(cb) ? parseInt(cb, 10) : NaN;

    if (!isNaN(na) && !isNaN(nb)) {
      if (na !== nb) return na - nb;
      // 같은 수치면 선행 0으로 구분 ("01" < "1")
      if (ca.length !== cb.length) return cb.length - ca.length;
    } else {
      const cmp = ca.localeCompare(cb);
      if (cmp !== 0) return cmp;
    }
  }

  return chunksA.length - chunksB.length;
}

/**
 * 대소문자 무시 자연 정렬 비교.
 */
export function naturalCompareInsensitive(a: string, b: string): number {
  return naturalCompare(a.toLowerCase(), b.toLowerCase());
}

/**
 * 배열을 자연 정렬한다 (새 배열 반환).
 */
export function naturalSort(arr: string[]): string[] {
  return [...arr].sort(naturalCompare);
}

/**
 * 객체 배열을 특정 키로 자연 정렬한다.
 */
export function naturalSortBy<T>(
  arr: T[],
  keyFn: (item: T) => string,
  insensitive: boolean = false,
): T[] {
  const cmp = insensitive ? naturalCompareInsensitive : naturalCompare;
  return [...arr].sort((a, b) => cmp(keyFn(a), keyFn(b)));
}
