import { describe, expect, it } from "vitest";
import { truncateWords, wordCount, words } from "./words";

describe("wordCount", () => {
  it("단어 수를 반환한다", () => {
    expect(wordCount("Hello World")).toBe(2);
    expect(wordCount("one two three")).toBe(3);
    expect(wordCount("single")).toBe(1);
  });

  it("연속 공백을 하나로 처리한다", () => {
    expect(wordCount("  Hello   World  ")).toBe(2);
    expect(wordCount("\t탭\t탭\t")).toBe(2);
  });

  it("빈 문자열은 0을 반환한다", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("   ")).toBe(0);
  });

  it("한글·영문 혼합도 처리한다", () => {
    expect(wordCount("안녕 세상")).toBe(2);
    expect(wordCount("hello 세상 world")).toBe(3);
  });

  it("줄바꿈 포함", () => {
    expect(wordCount("line one\nline two")).toBe(4);
  });
});

describe("words", () => {
  it("단어 배열을 반환한다", () => {
    expect(words("Hello World")).toEqual(["Hello", "World"]);
  });

  it("연속 공백을 정리한다", () => {
    expect(words("  a   b   c  ")).toEqual(["a", "b", "c"]);
  });

  it("빈 문자열은 빈 배열을 반환한다", () => {
    expect(words("")).toEqual([]);
    expect(words("   ")).toEqual([]);
  });
});

describe("truncateWords", () => {
  it("maxWords 이하이면 원본 반환", () => {
    expect(truncateWords("Hello World", 5)).toBe("Hello World");
    expect(truncateWords("Hello World", 2)).toBe("Hello World");
  });

  it("maxWords 초과 시 잘라내고 suffix 붙인다", () => {
    expect(truncateWords("Hello World Foo Bar", 2)).toBe("Hello World…");
    expect(truncateWords("a b c d e", 3)).toBe("a b c…");
  });

  it("커스텀 suffix를 사용할 수 있다", () => {
    expect(truncateWords("Hello World Foo Bar", 2, " [더 보기]")).toBe("Hello World [더 보기]");
    expect(truncateWords("a b c", 1, "...")).toBe("a...");
  });

  it("빈 문자열을 처리한다", () => {
    expect(truncateWords("", 5)).toBe("");
  });

  it("maxWords = 0 이면 suffix만 반환된다", () => {
    expect(truncateWords("hello world", 0)).toBe("…");
  });

  it("단어 경계에서만 자른다 — 문자 중간에서 자르지 않는다", () => {
    const text = "React TypeScript Next.js Tailwind CSS";
    expect(truncateWords(text, 3)).toBe("React TypeScript Next.js…");
  });

  it("실사용: 블로그 카드 미리보기", () => {
    const body = "오늘은 날씨가 매우 좋아서 밖에 나가 산책을 했습니다.";
    expect(truncateWords(body, 5)).toBe("오늘은 날씨가 매우 좋아서 밖에…");
  });
});
