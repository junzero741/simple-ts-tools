import { describe, it, expect } from "vitest";
import { dedent, indent, reindent, trimTrailingWhitespace, collapseBlankLines } from "./dedent";

describe("dedent", () => {
  it("공통 들여쓰기를 제거한다", () => {
    const input = `
      hello
        world
    `;
    expect(dedent(input)).toBe("hello\n  world");
  });

  it("들여쓰기가 없으면 그대로", () => {
    expect(dedent("hello\nworld")).toBe("hello\nworld");
  });

  it("빈 줄은 공백 계산에서 제외", () => {
    const input = `
      line1

      line2
    `;
    expect(dedent(input)).toBe("line1\n\nline2");
  });

  it("단일 줄", () => {
    expect(dedent("    hello")).toBe("hello");
  });

  it("빈 문자열", () => {
    expect(dedent("")).toBe("");
  });

  it("탭 들여쓰기", () => {
    expect(dedent("\t\thello\n\t\t\tworld")).toBe("hello\n\tworld");
  });
});

describe("indent", () => {
  it("모든 줄에 공백을 추가한다", () => {
    expect(indent("a\nb\nc", 2)).toBe("  a\n  b\n  c");
  });

  it("빈 줄은 들여쓰기하지 않는다", () => {
    expect(indent("a\n\nb", 4)).toBe("    a\n\n    b");
  });

  it("커스텀 문자 (탭)", () => {
    expect(indent("hello", 1, "\t")).toBe("\thello");
  });

  it("0칸이면 그대로", () => {
    expect(indent("hello", 0)).toBe("hello");
  });
});

describe("reindent", () => {
  it("들여쓰기를 재설정한다", () => {
    const input = "    hello\n      world";
    expect(reindent(input, 2)).toBe("  hello\n    world");
  });
});

describe("trimTrailingWhitespace", () => {
  it("각 줄의 후행 공백을 제거한다", () => {
    expect(trimTrailingWhitespace("hello   \nworld  ")).toBe("hello\nworld");
  });

  it("탭도 제거한다", () => {
    expect(trimTrailingWhitespace("hello\t\t")).toBe("hello");
  });

  it("선행 공백은 유지한다", () => {
    expect(trimTrailingWhitespace("  hello  ")).toBe("  hello");
  });
});

describe("collapseBlankLines", () => {
  it("연속 빈 줄을 1줄로 제한한다", () => {
    expect(collapseBlankLines("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("maxConsecutive=2이면 2줄까지 허용", () => {
    expect(collapseBlankLines("a\n\n\n\n\nb", 2)).toBe("a\n\n\nb");
  });

  it("빈 줄이 없으면 그대로", () => {
    expect(collapseBlankLines("a\nb")).toBe("a\nb");
  });
});
