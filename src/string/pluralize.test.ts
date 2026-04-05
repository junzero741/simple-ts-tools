import { describe, expect, it } from "vitest";
import { autoPlural, pluralize } from "./pluralize";

describe("pluralize", () => {
  describe("기본 동작", () => {
    it("count === 1이면 단수형을 반환한다", () => {
      expect(pluralize(1, "result")).toBe("1 result");
      expect(pluralize(1, "item")).toBe("1 item");
      expect(pluralize(1, "file")).toBe("1 file");
    });

    it("count !== 1이면 복수형을 반환한다", () => {
      expect(pluralize(0, "result")).toBe("0 results");
      expect(pluralize(2, "result")).toBe("2 results");
      expect(pluralize(100, "item")).toBe("100 items");
    });

    it("음수는 복수형으로 처리한다", () => {
      expect(pluralize(-1, "result")).toBe("-1 results");
      expect(pluralize(-5, "item")).toBe("-5 items");
    });
  });

  describe("명시적 복수형 지정", () => {
    it("plural 인자를 사용한다", () => {
      expect(pluralize(1, "person", "people")).toBe("1 person");
      expect(pluralize(2, "person", "people")).toBe("2 people");
      expect(pluralize(0, "person", "people")).toBe("0 people");
    });

    it("완전 불규칙형", () => {
      expect(pluralize(2, "child", "children")).toBe("2 children");
      expect(pluralize(2, "mouse", "mice")).toBe("2 mice");
      expect(pluralize(2, "foot", "feet")).toBe("2 feet");
      expect(pluralize(2, "tooth", "teeth")).toBe("2 teeth");
      expect(pluralize(2, "leaf", "leaves")).toBe("2 leaves");
      expect(pluralize(2, "ox", "oxen")).toBe("2 oxen");
    });
  });

  describe("showCount 옵션", () => {
    it("showCount: false이면 단어만 반환한다", () => {
      expect(pluralize(1, "result", undefined, { showCount: false })).toBe("result");
      expect(pluralize(2, "result", undefined, { showCount: false })).toBe("results");
    });

    it("showCount: true (기본값)이면 숫자와 단어를 함께 반환한다", () => {
      expect(pluralize(3, "file", undefined, { showCount: true })).toBe("3 files");
    });

    it("showCount + 명시적 복수형", () => {
      expect(pluralize(2, "person", "people", { showCount: false })).toBe("people");
    });
  });

  describe("실사용 시나리오", () => {
    it("검색 결과 카운트 표시", () => {
      const count = 42;
      expect(pluralize(count, "result")).toBe("42 results");
      expect(pluralize(1, "result")).toBe("1 result");
    });

    it("파일 선택 표시", () => {
      expect(pluralize(3, "file")).toBe("3 files");
      expect(pluralize(1, "file")).toBe("1 file");
    });

    it("페이지 타이틀에 사용 (showCount: false)", () => {
      const count = 5;
      const label = `${count} ${pluralize(count, "notification", undefined, { showCount: false })} pending`;
      expect(label).toBe("5 notifications pending");
    });
  });
});

describe("autoPlural", () => {
  it("+s — 일반 명사", () => {
    expect(autoPlural("file")).toBe("files");
    expect(autoPlural("item")).toBe("items");
    expect(autoPlural("user")).toBe("users");
    expect(autoPlural("error")).toBe("errors");
  });

  it("+es — s, x, z, ch, sh 로 끝나는 단어", () => {
    expect(autoPlural("bus")).toBe("buses");
    expect(autoPlural("box")).toBe("boxes");
    expect(autoPlural("buzz")).toBe("buzzes");
    expect(autoPlural("watch")).toBe("watches");
    expect(autoPlural("dish")).toBe("dishes");
    expect(autoPlural("class")).toBe("classes");
    expect(autoPlural("branch")).toBe("branches");
  });

  it("-y +ies — 자음+y 로 끝나는 단어", () => {
    expect(autoPlural("city")).toBe("cities");
    expect(autoPlural("baby")).toBe("babies");
    expect(autoPlural("category")).toBe("categories");
    expect(autoPlural("query")).toBe("queries");
    expect(autoPlural("directory")).toBe("directories");
  });

  it("+s — 모음+y 로 끝나는 단어 (변형 없음)", () => {
    expect(autoPlural("boy")).toBe("boys");
    expect(autoPlural("day")).toBe("days");
    expect(autoPlural("key")).toBe("keys");
    expect(autoPlural("monkey")).toBe("monkeys");
  });

  it("빈 문자열은 그대로 반환한다", () => {
    expect(autoPlural("")).toBe("");
  });

  it("대소문자 유지", () => {
    expect(autoPlural("Bus")).toBe("Buses");
    expect(autoPlural("CITY")).toBe("CITies");
  });
});
