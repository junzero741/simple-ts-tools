import { describe, expect, it } from "vitest";
import { pairwise, windows } from "./windows";

describe("windows", () => {
  describe("기본 동작 (step: 1)", () => {
    it("크기 3의 슬라이딩 윈도우를 생성한다", () => {
      expect(windows([1, 2, 3, 4, 5], 3)).toEqual([
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
      ]);
    });

    it("크기 2의 윈도우", () => {
      expect(windows([1, 2, 3, 4], 2)).toEqual([
        [1, 2],
        [2, 3],
        [3, 4],
      ]);
    });

    it("윈도우 크기 = 배열 길이이면 배열 전체 하나만 반환한다", () => {
      expect(windows([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    });

    it("윈도우 크기 = 1이면 단일 요소 배열들을 반환한다", () => {
      expect(windows([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });

    it("윈도우 크기 > 배열 길이이면 빈 배열을 반환한다", () => {
      expect(windows([1, 2], 3)).toEqual([]);
    });

    it("빈 배열은 빈 배열을 반환한다", () => {
      expect(windows([], 3)).toEqual([]);
    });

    it("원본 배열을 변경하지 않는다", () => {
      const arr = [1, 2, 3, 4, 5];
      windows(arr, 3);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe("step 옵션", () => {
    it("step: 2 — 2칸씩 이동", () => {
      expect(windows([1, 2, 3, 4, 5], 3, { step: 2 })).toEqual([
        [1, 2, 3],
        [3, 4, 5],
      ]);
    });

    it("step = size이면 chunk와 동일하다 (비겹침)", () => {
      expect(windows([1, 2, 3, 4, 5, 6], 2, { step: 2 })).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it("step > size이면 중간 요소를 건너뛴다", () => {
      expect(windows([1, 2, 3, 4, 5, 6, 7], 2, { step: 3 })).toEqual([
        [1, 2],
        [4, 5],
        [7, undefined], // 마지막 윈도우가 size를 채우지 못하면 포함하지 않음
      ].slice(0, 2));
      // 실제: i=0→[1,2], i=3→[4,5], i=6 → 6+2=8 > 7 이므로 제외
      expect(windows([1, 2, 3, 4, 5, 6, 7], 2, { step: 3 })).toEqual([
        [1, 2],
        [4, 5],
      ]);
    });

    it("마지막 윈도우가 size를 채우지 못하면 포함하지 않는다", () => {
      // [1,2,3,4,5], size=3, step=2
      // i=0 → [1,2,3] ✓ (0+3=3 ≤ 5)
      // i=2 → [3,4,5] ✓ (2+3=5 ≤ 5)
      // i=4 → [5, ?, ?] ✗ (4+3=7 > 5)
      expect(windows([1, 2, 3, 4, 5], 3, { step: 2 })).toEqual([
        [1, 2, 3],
        [3, 4, 5],
      ]);
    });
  });

  describe("에러 처리", () => {
    it("size <= 0이면 에러를 던진다", () => {
      expect(() => windows([1, 2, 3], 0)).toThrow("size must be >= 1");
      expect(() => windows([1, 2, 3], -1)).toThrow();
    });

    it("step <= 0이면 에러를 던진다", () => {
      expect(() => windows([1, 2, 3], 2, { step: 0 })).toThrow("step must be >= 1");
    });
  });

  describe("실사용 시나리오", () => {
    it("이동평균 (3-period MA) 계산", () => {
      const prices = [10, 12, 11, 14, 13, 15];
      const ma3 = windows(prices, 3).map(
        w => w.reduce((a, b) => a + b, 0) / w.length
      );
      expect(ma3).toEqual([11, 12.333333333333334, 12.666666666666666, 14]);
    });

    it("n-gram 생성 (bigram)", () => {
      const tokens = ["I", "love", "TypeScript", "so", "much"];
      const bigrams = windows(tokens, 2).map(pair => pair.join(" "));
      expect(bigrams).toEqual([
        "I love",
        "love TypeScript",
        "TypeScript so",
        "so much",
      ]);
    });

    it("이벤트 스트림에서 연속 패턴 감지", () => {
      const events = ["login", "view", "click", "view", "click", "purchase"];
      // 3개 연속 이벤트 중 purchase로 끝나는 것 찾기
      const conversionPaths = windows(events, 3).filter(w => w[2] === "purchase");
      expect(conversionPaths).toEqual([["view", "click", "purchase"]]);
    });
  });
});

describe("pairwise", () => {
  it("인접한 두 요소의 쌍을 반환한다", () => {
    expect(pairwise([1, 2, 3, 4])).toEqual([[1, 2], [2, 3], [3, 4]]);
  });

  it("요소가 2개이면 쌍 하나만 반환한다", () => {
    expect(pairwise([1, 2])).toEqual([[1, 2]]);
  });

  it("요소가 1개이면 빈 배열을 반환한다", () => {
    expect(pairwise([1])).toEqual([]);
  });

  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(pairwise([])).toEqual([]);
  });

  it("가격 변동률 계산", () => {
    const prices = [100, 110, 105, 120];
    const changes = pairwise(prices).map(
      ([prev, curr]) => Math.round((curr - prev) / prev * 100)
    );
    expect(changes).toEqual([10, -5, 14]);
  });

  it("연속 날짜 간격 계산", () => {
    // ms 단위 타임스탬프
    const timestamps = [0, 1000, 3000, 6000];
    const gaps = pairwise(timestamps).map(([a, b]) => b - a);
    expect(gaps).toEqual([1000, 2000, 3000]);
  });

  it("문자열 배열에 사용할 수 있다", () => {
    expect(pairwise(["a", "b", "c"])).toEqual([["a", "b"], ["b", "c"]]);
  });
});
