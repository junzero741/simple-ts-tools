/**
 * 문자열 유사도 측정 및 퍼지 검색 유틸리티.
 *
 * levenshteinDistance → similarity → fuzzySearch 순으로 구성된다.
 */

// ─── levenshteinDistance ──────────────────────────────────────────────────────

/**
 * 두 문자열의 레벤슈타인 편집 거리(삽입·삭제·교체 최솟값)를 반환한다.
 *
 * - 대소문자 구별: 기본적으로 구별함 (옵션으로 변경 가능)
 * - 공간 최적화: O(min(a,b)) 메모리 사용 (전체 행렬 대신 두 행만 유지)
 *
 * @example
 * levenshteinDistance("kitten", "sitting")  // 3
 * levenshteinDistance("saturday", "sunday") // 3
 * levenshteinDistance("abc", "abc")         // 0
 * levenshteinDistance("", "abc")            // 3
 *
 * @complexity Time: O(n·m) | Space: O(min(n,m))
 */
export function levenshteinDistance(
  a: string,
  b: string,
  options: { caseSensitive?: boolean } = {}
): number {
  const { caseSensitive = true } = options;
  const s1 = caseSensitive ? a : a.toLowerCase();
  const s2 = caseSensitive ? b : b.toLowerCase();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  // s2가 더 짧도록 정렬해 공간 사용 최소화
  const [longer, shorter] = s1.length >= s2.length ? [s1, s2] : [s2, s1];
  const m = longer.length;
  const n = shorter.length;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = longer[i - 1] === shorter[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,       // 삽입
        prev[j] + 1,           // 삭제
        prev[j - 1] + cost     // 교체
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[n];
}

// ─── similarity ───────────────────────────────────────────────────────────────

/**
 * 두 문자열의 유사도를 0~1 사이 값으로 반환한다.
 * 1에 가까울수록 유사하고, 0이면 완전히 다르다.
 *
 * 내부적으로 levenshteinDistance를 max(a.length, b.length)로 정규화한다.
 * 두 문자열이 모두 비어 있으면 1(동일)을 반환한다.
 *
 * @example
 * similarity("hello", "hello")   // 1
 * similarity("hello", "helo")    // 0.8
 * similarity("abc", "xyz")       // 0
 * similarity("", "")             // 1
 *
 * // 추천: similarity >= 0.6 이면 "관련 있음"으로 판단
 */
export function similarity(
  a: string,
  b: string,
  options: { caseSensitive?: boolean } = {}
): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b, options);
  return Math.round((1 - dist / maxLen) * 1000) / 1000;
}

// ─── fuzzyMatch ───────────────────────────────────────────────────────────────

/**
 * 패턴의 모든 문자가 텍스트에 **순서대로** 존재하는지 검사한다 (subsequence 포함 여부).
 * VS Code 파일 탐색기 스타일의 퍼지 매칭.
 *
 * @example
 * fuzzyMatch("components/Button.tsx", "btn")  // true  (B·t·n이 순서대로 존재)
 * fuzzyMatch("components/Button.tsx", "cbtn") // true
 * fuzzyMatch("hello world", "hw")             // true
 * fuzzyMatch("hello", "hxllo")               // false  ('x'가 없음)
 *
 * // 파일 탐색 — "rb"로 "RequestBuilder.ts"를 찾는 경우
 * fuzzyMatch("RequestBuilder.ts", "rb")  // true
 */
export function fuzzyMatch(
  text: string,
  pattern: string,
  options: { caseSensitive?: boolean } = {}
): boolean {
  if (pattern.length === 0) return true;
  if (pattern.length > text.length) return false;

  const { caseSensitive = false } = options;
  const t = caseSensitive ? text : text.toLowerCase();
  const p = caseSensitive ? pattern : pattern.toLowerCase();

  let pi = 0;
  for (let ti = 0; ti < t.length && pi < p.length; ti++) {
    if (t[ti] === p[pi]) pi++;
  }
  return pi === p.length;
}

// ─── fuzzySearch ──────────────────────────────────────────────────────────────

export interface FuzzyResult<T> {
  item: T;
  /** similarity() 기준 유사도 점수 (0–1) */
  score: number;
  /** fuzzyMatch() 결과 — subsequence로 패턴 포함 여부 */
  matched: boolean;
}

export interface FuzzySearchOptions<T> {
  /**
   * 항목에서 검색 대상 문자열을 추출하는 함수.
   * 미지정 시 항목 자체를 문자열로 사용.
   */
  keyFn?: (item: T) => string;
  /**
   * 결과에 포함할 최소 유사도 점수 (0–1, 기본: 0).
   * 0이면 fuzzyMatch를 통과한 모든 항목 포함.
   * 0.6 이상이면 "충분히 유사한" 항목만 포함.
   */
  threshold?: number;
  /** 최대 반환 항목 수 (기본: 무제한) */
  limit?: number;
  /**
   * 정렬 기준 (기본: "score").
   * - "score": 유사도 높은 순
   * - "none": 원래 배열 순서 유지
   */
  sort?: "score" | "none";
  /** 대소문자 구별 여부 (기본: false) */
  caseSensitive?: boolean;
}

/**
 * 배열에서 쿼리와 유사한 항목을 검색한다.
 * fuzzyMatch(subsequence 포함)를 1차 필터로 사용하고,
 * similarity(레벤슈타인 거리)로 점수를 계산해 정렬한다.
 *
 * @example
 * // 기본 문자열 검색
 * fuzzySearch(["apple", "application", "banana"], "app")
 * // [{ item: "apple", score: 0.6, matched: true },
 * //  { item: "application", score: 0.364, matched: true }]
 *
 * // 객체 배열 검색
 * fuzzySearch(users, "ali", { keyFn: u => u.name, threshold: 0.3 })
 *
 * // 파일 탐색기 스타일
 * fuzzySearch(files, "rbts", { keyFn: f => f.name })
 * // RequestBuilder.ts 등 매칭
 *
 * @complexity Time: O(n·k·m) — n: 항목 수, k: 키 길이, m: 쿼리 길이
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  options: FuzzySearchOptions<T> = {}
): FuzzyResult<T>[] {
  const {
    keyFn,
    threshold = 0,
    limit,
    sort = "score",
    caseSensitive = false,
  } = options;

  if (query.length === 0) {
    return items.map(item => ({ item, score: 1, matched: true }));
  }

  const getText = keyFn ?? ((item: T) => String(item));

  const results: FuzzyResult<T>[] = [];

  for (const item of items) {
    const text = getText(item);
    const matched = fuzzyMatch(text, query, { caseSensitive });
    if (!matched) continue;

    const score = similarity(text, query, { caseSensitive });
    if (score < threshold) continue;

    results.push({ item, score, matched });
  }

  if (sort === "score") {
    results.sort((a, b) => b.score - a.score);
  }

  return limit !== undefined ? results.slice(0, limit) : results;
}
