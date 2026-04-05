import { describe, it, expect } from "vitest";
import { highlight, highlightAll, highlightWords, findMatchRanges } from "./highlight";

describe("highlight", () => {
  it("첫 번째 매치를 하이라이트한다", () => {
    expect(highlight("Hello World", "world")).toBe("Hello <mark>World</mark>");
  });

  it("대소문자 무시 (기본)", () => {
    expect(highlight("Hello WORLD", "world")).toBe("Hello <mark>WORLD</mark>");
  });

  it("대소문자 구분", () => {
    expect(highlight("Hello World", "world", { caseSensitive: true }))
      .toBe("Hello World");
  });

  it("매치 없으면 원본 (이스케이프)", () => {
    expect(highlight("no match", "xyz")).toBe("no match");
  });

  it("빈 쿼리면 원본", () => {
    expect(highlight("hello", "")).toBe("hello");
  });

  it("커스텀 태그", () => {
    expect(highlight("hello world", "world", { tag: "b" }))
      .toBe("hello <b>world</b>");
  });

  it("className 추가", () => {
    expect(highlight("hello world", "world", { className: "hl" }))
      .toBe('hello <mark class="hl">world</mark>');
  });

  it("HTML 특수문자를 이스케이프한다", () => {
    expect(highlight("<script>alert</script>", "alert"))
      .toBe("&lt;script&gt;<mark>alert</mark>&lt;/script&gt;");
  });

  it("정규식 특수문자를 안전하게 처리", () => {
    expect(highlight("price: $10.00", "$10.00"))
      .toBe("price: <mark>$10.00</mark>");
  });
});

describe("highlightAll", () => {
  it("모든 매치를 하이라이트한다", () => {
    expect(highlightAll("foo bar foo baz foo", "foo"))
      .toBe("<mark>foo</mark> bar <mark>foo</mark> baz <mark>foo</mark>");
  });

  it("매치 없으면 원본", () => {
    expect(highlightAll("hello", "xyz")).toBe("hello");
  });

  it("연속 매치", () => {
    expect(highlightAll("aaa", "a"))
      .toBe("<mark>a</mark><mark>a</mark><mark>a</mark>");
  });
});

describe("highlightWords", () => {
  it("여러 단어를 하이라이트한다", () => {
    const result = highlightWords("The quick brown fox jumps", ["quick", "fox"]);
    expect(result).toBe("The <mark>quick</mark> brown <mark>fox</mark> jumps");
  });

  it("빈 단어 배열이면 원본", () => {
    expect(highlightWords("hello", [])).toBe("hello");
  });

  it("중복 단어", () => {
    const result = highlightWords("a b a", ["a"]);
    expect(result).toBe("<mark>a</mark> b <mark>a</mark>");
  });
});

describe("findMatchRanges", () => {
  it("매치 위치를 반환한다", () => {
    const ranges = findMatchRanges("hello world hello", "hello");
    expect(ranges).toEqual([
      { start: 0, end: 5, text: "hello" },
      { start: 12, end: 17, text: "hello" },
    ]);
  });

  it("대소문자 무시 매치", () => {
    const ranges = findMatchRanges("Hello HELLO", "hello");
    expect(ranges.length).toBe(2);
    expect(ranges[0].text).toBe("Hello");
    expect(ranges[1].text).toBe("HELLO");
  });

  it("매치 없으면 빈 배열", () => {
    expect(findMatchRanges("abc", "xyz")).toEqual([]);
  });

  it("빈 쿼리면 빈 배열", () => {
    expect(findMatchRanges("abc", "")).toEqual([]);
  });
});
