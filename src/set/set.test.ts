import { describe, expect, it } from "vitest";
import {
  isDisjoint,
  isSubset,
  isSuperset,
  setDifference,
  setEquals,
  setIntersection,
  setIntersectionAll,
  setSymmetricDifference,
  setUnion,
  setUnionAll,
} from "./set";

// ─── setUnion ─────────────────────────────────────────────────────────────────

describe("setUnion", () => {
  it("두 Set의 합집합을 반환한다", () => {
    expect(setUnion(new Set([1, 2, 3]), new Set([2, 3, 4]))).toEqual(
      new Set([1, 2, 3, 4])
    );
  });

  it("공집합과의 합집합은 원본", () => {
    const s = new Set([1, 2, 3]);
    expect(setUnion(s, new Set())).toEqual(s);
    expect(setUnion(new Set(), s)).toEqual(s);
  });

  it("두 공집합의 합집합은 공집합", () => {
    expect(setUnion(new Set(), new Set())).toEqual(new Set());
  });

  it("원본 Set을 수정하지 않는다 (불변)", () => {
    const a = new Set([1, 2]);
    const b = new Set([3, 4]);
    setUnion(a, b);
    expect(a).toEqual(new Set([1, 2]));
    expect(b).toEqual(new Set([3, 4]));
  });

  it("문자열 Set도 처리한다", () => {
    expect(setUnion(new Set(["a", "b"]), new Set(["b", "c"]))).toEqual(
      new Set(["a", "b", "c"])
    );
  });
});

// ─── setIntersection ──────────────────────────────────────────────────────────

describe("setIntersection", () => {
  it("두 Set의 교집합을 반환한다", () => {
    expect(setIntersection(new Set([1, 2, 3]), new Set([2, 3, 4]))).toEqual(
      new Set([2, 3])
    );
  });

  it("공통 원소가 없으면 공집합", () => {
    expect(setIntersection(new Set([1, 2]), new Set([3, 4]))).toEqual(new Set());
  });

  it("한쪽이 공집합이면 공집합", () => {
    expect(setIntersection(new Set([1, 2, 3]), new Set())).toEqual(new Set());
  });

  it("완전히 같은 Set이면 동일한 Set", () => {
    expect(setIntersection(new Set([1, 2, 3]), new Set([1, 2, 3]))).toEqual(
      new Set([1, 2, 3])
    );
  });

  it("작은 Set을 기준으로 순회한다 (교환 법칙 성립)", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([2, 3, 4, 5, 6]);
    expect(setIntersection(a, b)).toEqual(setIntersection(b, a));
  });
});

// ─── setDifference ────────────────────────────────────────────────────────────

describe("setDifference", () => {
  it("a에만 있는 원소를 반환한다", () => {
    expect(setDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))).toEqual(
      new Set([1])
    );
  });

  it("b가 공집합이면 a 전체", () => {
    expect(setDifference(new Set([1, 2, 3]), new Set())).toEqual(
      new Set([1, 2, 3])
    );
  });

  it("b가 a를 포함하면 공집합", () => {
    expect(setDifference(new Set([1, 2]), new Set([1, 2, 3]))).toEqual(new Set());
  });

  it("교환 비대칭 — a-b ≠ b-a", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([2, 3, 4]);
    expect(setDifference(a, b)).toEqual(new Set([1]));
    expect(setDifference(b, a)).toEqual(new Set([4]));
  });
});

// ─── setSymmetricDifference ───────────────────────────────────────────────────

describe("setSymmetricDifference", () => {
  it("한 쪽에만 있는 원소를 반환한다", () => {
    expect(
      setSymmetricDifference(new Set([1, 2, 3]), new Set([2, 3, 4]))
    ).toEqual(new Set([1, 4]));
  });

  it("교환 법칙 성립", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([2, 3, 4]);
    expect(setSymmetricDifference(a, b)).toEqual(setSymmetricDifference(b, a));
  });

  it("같은 Set의 대칭 차집합은 공집합", () => {
    const s = new Set([1, 2, 3]);
    expect(setSymmetricDifference(s, s)).toEqual(new Set());
  });

  it("공집합과의 대칭 차집합은 원본", () => {
    const s = new Set([1, 2, 3]);
    expect(setSymmetricDifference(s, new Set())).toEqual(s);
  });
});

// ─── isSubset / isSuperset ────────────────────────────────────────────────────

describe("isSubset", () => {
  it("a의 모든 원소가 b에 있으면 true", () => {
    expect(isSubset(new Set([1, 2]), new Set([1, 2, 3]))).toBe(true);
  });

  it("a에만 있는 원소가 있으면 false", () => {
    expect(isSubset(new Set([1, 2, 4]), new Set([1, 2, 3]))).toBe(false);
  });

  it("공집합은 모든 집합의 부분집합", () => {
    expect(isSubset(new Set(), new Set([1, 2, 3]))).toBe(true);
    expect(isSubset(new Set(), new Set())).toBe(true);
  });

  it("동일한 Set은 서로의 부분집합", () => {
    const s = new Set([1, 2, 3]);
    expect(isSubset(s, s)).toBe(true);
  });

  it("크기가 더 크면 바로 false", () => {
    expect(isSubset(new Set([1, 2, 3, 4]), new Set([1, 2, 3]))).toBe(false);
  });
});

describe("isSuperset", () => {
  it("b의 모든 원소가 a에 있으면 true", () => {
    expect(isSuperset(new Set([1, 2, 3]), new Set([1, 2]))).toBe(true);
  });

  it("b에만 있는 원소가 있으면 false", () => {
    expect(isSuperset(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  it("isSuperset(a, b) === isSubset(b, a)", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([1, 2]);
    expect(isSuperset(a, b)).toBe(isSubset(b, a));
  });
});

// ─── isDisjoint ───────────────────────────────────────────────────────────────

describe("isDisjoint", () => {
  it("공통 원소가 없으면 true", () => {
    expect(isDisjoint(new Set([1, 2]), new Set([3, 4]))).toBe(true);
  });

  it("공통 원소가 있으면 false", () => {
    expect(isDisjoint(new Set([1, 2, 3]), new Set([3, 4, 5]))).toBe(false);
  });

  it("두 공집합은 서로소", () => {
    expect(isDisjoint(new Set(), new Set())).toBe(true);
  });

  it("교환 법칙 성립", () => {
    const a = new Set([1, 2]);
    const b = new Set([3, 4]);
    expect(isDisjoint(a, b)).toBe(isDisjoint(b, a));
  });
});

// ─── setEquals ────────────────────────────────────────────────────────────────

describe("setEquals", () => {
  it("같은 원소를 가지면 true (순서 무관)", () => {
    expect(setEquals(new Set([1, 2, 3]), new Set([3, 1, 2]))).toBe(true);
  });

  it("크기가 다르면 false", () => {
    expect(setEquals(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  it("원소가 다르면 false", () => {
    expect(setEquals(new Set([1, 2, 3]), new Set([1, 2, 4]))).toBe(false);
  });

  it("두 공집합은 같다", () => {
    expect(setEquals(new Set(), new Set())).toBe(true);
  });
});

// ─── setUnionAll / setIntersectionAll ─────────────────────────────────────────

describe("setUnionAll", () => {
  it("여러 Set의 합집합을 반환한다", () => {
    expect(
      setUnionAll([new Set([1, 2]), new Set([2, 3]), new Set([3, 4])])
    ).toEqual(new Set([1, 2, 3, 4]));
  });

  it("빈 배열은 공집합을 반환한다", () => {
    expect(setUnionAll([])).toEqual(new Set());
  });

  it("하나의 Set이면 그 Set을 반환한다", () => {
    expect(setUnionAll([new Set([1, 2, 3])])).toEqual(new Set([1, 2, 3]));
  });
});

describe("setIntersectionAll", () => {
  it("여러 Set의 교집합을 반환한다", () => {
    expect(
      setIntersectionAll([
        new Set([1, 2, 3]),
        new Set([2, 3, 4]),
        new Set([3, 4, 5]),
      ])
    ).toEqual(new Set([3]));
  });

  it("빈 배열은 공집합을 반환한다", () => {
    expect(setIntersectionAll([])).toEqual(new Set());
  });

  it("하나의 Set이면 그 Set을 반환한다", () => {
    expect(setIntersectionAll([new Set([1, 2, 3])])).toEqual(new Set([1, 2, 3]));
  });

  it("공통 원소가 없으면 공집합", () => {
    expect(
      setIntersectionAll([new Set([1, 2]), new Set([3, 4]), new Set([5, 6])])
    ).toEqual(new Set());
  });
});

// ─── 실사용 시나리오 ──────────────────────────────────────────────────────────

describe("실사용 시나리오", () => {
  it("권한 검사 — 요청 권한이 허용 목록에 모두 포함되는지", () => {
    const required = new Set(["read", "write"]);
    const granted  = new Set(["read", "write", "delete"]);
    const denied   = new Set(["read"]);

    expect(isSubset(required, granted)).toBe(true);   // 허용
    expect(isSubset(required, denied)).toBe(false);   // 거부
  });

  it("태그 필터링 — 선택 태그와 교집합이 있는 포스트 찾기", () => {
    const posts = [
      { title: "A", tags: new Set(["react", "typescript"]) },
      { title: "B", tags: new Set(["vue", "javascript"]) },
      { title: "C", tags: new Set(["react", "javascript"]) },
    ];
    const filter = new Set(["react"]);
    const filtered = posts.filter(p => !isDisjoint(p.tags, filter));
    expect(filtered.map(p => p.title)).toEqual(["A", "C"]);
  });

  it("변경 감지 — 추가된 항목과 제거된 항목 계산", () => {
    const before = new Set(["alice", "bob", "charlie"]);
    const after  = new Set(["bob", "charlie", "dave"]);

    const added   = setDifference(after, before);   // 새로 추가
    const removed = setDifference(before, after);   // 제거된

    expect(added).toEqual(new Set(["dave"]));
    expect(removed).toEqual(new Set(["alice"]));
  });

  it("중복 없는 합치기 — 여러 소스의 ID를 모으기", () => {
    const source1 = new Set([1, 2, 3]);
    const source2 = new Set([2, 3, 4]);
    const source3 = new Set([3, 4, 5]);

    expect(setUnionAll([source1, source2, source3])).toEqual(
      new Set([1, 2, 3, 4, 5])
    );
  });
});
