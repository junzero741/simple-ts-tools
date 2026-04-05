import { describe, expect, it } from "vitest";
import {
  fuzzyMatch,
  fuzzySearch,
  levenshteinDistance,
  similarity,
} from "./fuzzy";

// ─── levenshteinDistance ──────────────────────────────────────────────────────

describe("levenshteinDistance", () => {
  describe("기본 케이스", () => {
    it("동일한 문자열은 0", () => {
      expect(levenshteinDistance("abc", "abc")).toBe(0);
      expect(levenshteinDistance("", "")).toBe(0);
    });

    it("빈 문자열과의 거리는 상대 문자열 길이", () => {
      expect(levenshteinDistance("", "abc")).toBe(3);
      expect(levenshteinDistance("abc", "")).toBe(3);
    });

    it("교과서 예제: kitten → sitting", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    });

    it("교과서 예제: saturday → sunday", () => {
      expect(levenshteinDistance("saturday", "sunday")).toBe(3);
    });

    it("단일 삽입", () => {
      expect(levenshteinDistance("abc", "abcd")).toBe(1);
    });

    it("단일 삭제", () => {
      expect(levenshteinDistance("abcd", "abc")).toBe(1);
    });

    it("단일 교체", () => {
      expect(levenshteinDistance("abc", "axc")).toBe(1);
    });

    it("완전히 다른 문자열", () => {
      expect(levenshteinDistance("abc", "xyz")).toBe(3);
    });
  });

  describe("대소문자 옵션", () => {
    it("기본: 대소문자 구별", () => {
      expect(levenshteinDistance("Hello", "hello")).toBe(1);
    });

    it("caseSensitive: false이면 대소문자 무시", () => {
      expect(levenshteinDistance("Hello", "hello", { caseSensitive: false })).toBe(0);
      expect(levenshteinDistance("ABC", "abc", { caseSensitive: false })).toBe(0);
    });
  });

  describe("대칭성", () => {
    it("distance(a,b) === distance(b,a)", () => {
      expect(levenshteinDistance("kitten", "sitting")).toBe(
        levenshteinDistance("sitting", "kitten")
      );
    });
  });

  describe("실사용 — 오타 교정", () => {
    it("전위(transposition)는 표준 Levenshtein 기준 2회 연산", () => {
      // 표준 Levenshtein은 삽입/삭제/교체만 지원 (Damerau 아님)
      // "teh" → "the": 'e' 삭제 후 마지막에 'e' 삽입 = 2
      expect(levenshteinDistance("teh", "the")).toBe(2);
      // "recieve" → "receive": 'i','e' 위치 교환 = 2
      expect(levenshteinDistance("recieve", "receive")).toBe(2);
    });

    it("단순 삽입 오타는 거리 1", () => {
      expect(levenshteinDistance("acess", "access")).toBe(1); // c 한 번 삽입
    });

    it("단순 삭제 오타는 거리 1", () => {
      expect(levenshteinDistance("occured", "occurred")).toBe(1); // r 삽입
    });
  });
});

// ─── similarity ───────────────────────────────────────────────────────────────

describe("similarity", () => {
  it("동일한 문자열은 1", () => {
    expect(similarity("hello", "hello")).toBe(1);
  });

  it("두 빈 문자열은 1", () => {
    expect(similarity("", "")).toBe(1);
  });

  it("완전히 다른 문자열은 0", () => {
    expect(similarity("abc", "xyz")).toBe(0);
  });

  it("한 글자 차이면 length에 따라 점수가 달라진다", () => {
    // "helo" vs "hello": 거리 1, max 5 → 1 - 1/5 = 0.8
    expect(similarity("helo", "hello")).toBeCloseTo(0.8, 2);
  });

  it("0~1 범위를 벗어나지 않는다", () => {
    for (const [a, b] of [["", "x"], ["x", ""], ["abc", "abcdef"], ["xyz", "abc"]]) {
      const s = similarity(a, b);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });

  it("caseSensitive: false이면 대소문자 무시", () => {
    expect(similarity("Hello", "hello", { caseSensitive: false })).toBe(1);
  });

  describe("실사용 — 유사도 임계값", () => {
    it("오타 하나: 60% 이상 유사", () => {
      expect(similarity("accesss", "access")).toBeGreaterThan(0.6);
    });

    it("전혀 다른 단어: 낮은 유사도", () => {
      expect(similarity("apple", "orange")).toBeLessThan(0.5);
    });
  });
});

// ─── fuzzyMatch ───────────────────────────────────────────────────────────────

describe("fuzzyMatch", () => {
  describe("기본 동작", () => {
    it("패턴의 모든 문자가 순서대로 존재하면 true", () => {
      expect(fuzzyMatch("hello world", "hw")).toBe(true);
      expect(fuzzyMatch("components/Button.tsx", "btn")).toBe(true);
      expect(fuzzyMatch("RequestBuilder.ts", "rb")).toBe(true);
    });

    it("패턴 문자가 없으면 false", () => {
      expect(fuzzyMatch("hello", "hxllo")).toBe(false);
      expect(fuzzyMatch("abc", "xyz")).toBe(false);
    });

    it("빈 패턴은 항상 true", () => {
      expect(fuzzyMatch("anything", "")).toBe(true);
      expect(fuzzyMatch("", "")).toBe(true);
    });

    it("패턴이 텍스트보다 길면 false", () => {
      expect(fuzzyMatch("ab", "abc")).toBe(false);
    });

    it("정확히 일치해도 true", () => {
      expect(fuzzyMatch("hello", "hello")).toBe(true);
    });
  });

  describe("대소문자 처리", () => {
    it("기본: 대소문자 무시 (caseSensitive: false)", () => {
      expect(fuzzyMatch("Button", "btn")).toBe(true);
      expect(fuzzyMatch("RequestBuilder", "RB")).toBe(true);
    });

    it("caseSensitive: true이면 대소문자 구별", () => {
      expect(fuzzyMatch("Button", "btn", { caseSensitive: true })).toBe(false);
      expect(fuzzyMatch("Button", "Btn", { caseSensitive: true })).toBe(true);
    });
  });

  describe("실사용 — 파일 탐색", () => {
    it("짧은 약어로 긴 파일명 매칭", () => {
      const files = [
        "RequestBuilder.ts",   // R...B... → rb 포함
        "ResponseHandler.ts",  // R...H... → rh (b 없음)
        "index.ts",
        "utils.ts",
      ];
      const matched = files.filter(f => fuzzyMatch(f, "rb"));
      expect(matched).toContain("RequestBuilder.ts");
      expect(matched).not.toContain("ResponseHandler.ts"); // 'b' 없음
      expect(matched).not.toContain("index.ts");
    });

    it("'rh'는 ResponseHandler.ts를 매칭한다", () => {
      expect(fuzzyMatch("ResponseHandler.ts", "rh")).toBe(true);
    });
  });
});

// ─── fuzzySearch ─────────────────────────────────────────────────────────────

describe("fuzzySearch", () => {
  describe("문자열 배열 검색", () => {
    it("매칭되는 항목만 반환한다", () => {
      const result = fuzzySearch(["apple", "application", "banana", "apricot"], "app");
      const items = result.map(r => r.item);
      expect(items).toContain("apple");
      expect(items).toContain("application");
      expect(items).not.toContain("banana");
    });

    it("점수 내림차순으로 정렬된다 (기본)", () => {
      const result = fuzzySearch(["application", "apple", "ap"], "ap");
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
      expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
    });

    it("빈 쿼리이면 모든 항목을 score=1로 반환한다", () => {
      const items = ["a", "b", "c"];
      const result = fuzzySearch(items, "");
      expect(result).toHaveLength(3);
      expect(result.every(r => r.score === 1)).toBe(true);
    });

    it("매칭 항목이 없으면 빈 배열을 반환한다", () => {
      expect(fuzzySearch(["apple", "banana"], "xyz")).toEqual([]);
    });
  });

  describe("객체 배열 + keyFn", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Alan" },
      { id: 4, name: "Charlie" },
    ];

    it("keyFn으로 검색 키를 지정한다", () => {
      const result = fuzzySearch(users, "al", { keyFn: u => u.name });
      const names = result.map(r => r.item.name);
      expect(names).toContain("Alice");
      expect(names).toContain("Alan");
      expect(names).not.toContain("Bob");
    });

    it("결과에 item이 포함된다", () => {
      const result = fuzzySearch(users, "bob", { keyFn: u => u.name });
      expect(result[0].item).toEqual({ id: 2, name: "Bob" });
    });
  });

  describe("threshold 옵션", () => {
    it("threshold 미만 점수의 항목을 제외한다", () => {
      const result = fuzzySearch(
        ["ab", "abcde", "abcdefghij"],
        "ab",
        { threshold: 0.7 }
      );
      // "ab"는 score=1, "abcde"는 더 낮음, "abcdefghij"는 더 낮음
      expect(result.every(r => r.score >= 0.7)).toBe(true);
    });
  });

  describe("limit 옵션", () => {
    it("최대 반환 수를 제한한다", () => {
      const items = ["a1", "a2", "a3", "a4", "a5"];
      const result = fuzzySearch(items, "a", { limit: 3 });
      expect(result).toHaveLength(3);
    });
  });

  describe("sort 옵션", () => {
    it('sort: "none"이면 원래 순서를 유지한다', () => {
      const items = ["application", "apple", "ap"];
      const result = fuzzySearch(items, "ap", { sort: "none" });
      expect(result.map(r => r.item)).toEqual(["application", "apple", "ap"]);
    });
  });

  describe("결과 구조", () => {
    it("score와 matched 필드를 포함한다", () => {
      const result = fuzzySearch(["hello"], "hlo");
      expect(result[0]).toHaveProperty("item");
      expect(result[0]).toHaveProperty("score");
      expect(result[0]).toHaveProperty("matched");
      expect(result[0].matched).toBe(true);
    });
  });

  describe("실사용 — 자동완성 / 검색 UI", () => {
    it("커맨드 팔레트 스타일 파일 검색", () => {
      const files = [
        "src/components/Button.tsx",
        "src/components/Input.tsx",
        "src/utils/formatDate.ts",
        "src/utils/formatNumber.ts",
        "src/hooks/useDebounce.ts",
      ];

      const result = fuzzySearch(files, "fmtd", {
        keyFn: f => f.split("/").pop()!,
        limit: 3,
      });
      expect(result[0].item).toBe("src/utils/formatDate.ts");
    });

    it("사용자 이름 검색 — 오타 허용 (threshold 낮게)", () => {
      const users = ["Alice", "Bob", "Charlie", "David", "Eve"];
      const result = fuzzySearch(users, "alic", { threshold: 0.4 });
      expect(result[0].item).toBe("Alice");
    });
  });
});
