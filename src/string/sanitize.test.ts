import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  stripTags,
  removeControlChars,
  escapeRegExp,
  removeZeroWidth,
  limitLength,
  normalizeWhitespace,
  escapeSql,
} from "./sanitize";

describe("sanitizeFilename", () => {
  it("위험한 문자를 제거한다", () => {
    expect(sanitizeFilename('hello<world>.txt')).toBe("helloworld.txt");
    expect(sanitizeFilename('file"name')).toBe("filename");
  });

  it("디렉토리 순회를 방지한다", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("etcpasswd");
    expect(sanitizeFilename("..\\..\\windows")).toBe("windows");
  });

  it("선행 점을 제거한다", () => {
    expect(sanitizeFilename(".hidden")).toBe("hidden");
    expect(sanitizeFilename("...file")).toBe("file");
  });

  it("대체 문자를 지정한다", () => {
    expect(sanitizeFilename("a:b", "_")).toBe("a_b");
  });

  it("빈 결과면 unnamed", () => {
    expect(sanitizeFilename(":::")).toBe("unnamed");
  });

  it("정상 파일명은 그대로", () => {
    expect(sanitizeFilename("report_2024.pdf")).toBe("report_2024.pdf");
  });
});

describe("stripTags", () => {
  it("HTML 태그를 제거한다", () => {
    expect(stripTags("<b>bold</b>")).toBe("bold");
    expect(stripTags('<a href="url">link</a>')).toBe("link");
  });

  it("script 태그를 제거한다", () => {
    expect(stripTags("<script>alert(1)</script>safe")).toBe("alert(1)safe");
  });

  it("태그 없으면 그대로", () => {
    expect(stripTags("plain text")).toBe("plain text");
  });

  it("중첩 태그", () => {
    expect(stripTags("<div><p>hello</p></div>")).toBe("hello");
  });
});

describe("removeControlChars", () => {
  it("제어 문자를 제거한다", () => {
    expect(removeControlChars("hello\x00world\x01")).toBe("helloworld");
  });

  it("DEL(0x7F)을 제거한다", () => {
    expect(removeControlChars("abc\x7Fdef")).toBe("abcdef");
  });

  it("개행을 보존한다", () => {
    expect(removeControlChars("a\nb\rc", { preserveNewlines: true })).toBe("a\nb\rc");
  });

  it("탭을 보존한다", () => {
    expect(removeControlChars("a\tb", { preserveTabs: true })).toBe("a\tb");
  });

  it("일반 텍스트는 그대로", () => {
    expect(removeControlChars("hello world 123")).toBe("hello world 123");
  });
});

describe("escapeRegExp", () => {
  it("정규식 특수문자를 이스케이프한다", () => {
    expect(escapeRegExp("foo.bar[0]")).toBe("foo\\.bar\\[0\\]");
    expect(escapeRegExp("a+b*c?")).toBe("a\\+b\\*c\\?");
    expect(escapeRegExp("(a|b)")).toBe("\\(a\\|b\\)");
  });

  it("이스케이프된 문자열로 정규식이 동작한다", () => {
    const input = "price: $10.00";
    const pattern = escapeRegExp("$10.00");
    expect(new RegExp(pattern).test(input)).toBe(true);
  });

  it("일반 문자열은 그대로", () => {
    expect(escapeRegExp("hello")).toBe("hello");
  });
});

describe("removeZeroWidth", () => {
  it("제로 너비 문자를 제거한다", () => {
    expect(removeZeroWidth("hello\u200Bworld")).toBe("helloworld");
    expect(removeZeroWidth("\uFEFFtest")).toBe("test");
  });

  it("일반 텍스트는 그대로", () => {
    expect(removeZeroWidth("hello")).toBe("hello");
  });
});

describe("limitLength", () => {
  it("최대 길이로 자른다", () => {
    expect(limitLength("hello world", 5)).toBe("hello");
  });

  it("짧으면 그대로", () => {
    expect(limitLength("hi", 10)).toBe("hi");
  });

  it("정확히 같으면 그대로", () => {
    expect(limitLength("abc", 3)).toBe("abc");
  });
});

describe("normalizeWhitespace", () => {
  it("연속 공백을 하나로", () => {
    expect(normalizeWhitespace("hello   world")).toBe("hello world");
  });

  it("탭/개행도 공백으로", () => {
    expect(normalizeWhitespace("a\t\nb")).toBe("a b");
  });

  it("양끝 공백 제거", () => {
    expect(normalizeWhitespace("  hello  ")).toBe("hello");
  });
});

describe("escapeSql", () => {
  it("작은따옴표를 이스케이프한다", () => {
    expect(escapeSql("O'Brien")).toBe("O\\'Brien");
  });

  it("백슬래시를 이스케이프한다", () => {
    expect(escapeSql("path\\file")).toBe("path\\\\file");
  });

  it("일반 문자열은 그대로", () => {
    expect(escapeSql("hello")).toBe("hello");
  });
});
