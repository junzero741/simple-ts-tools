import { describe, expect, it } from "vitest";
import { escapeHtml, unescapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("< > & \" ' 를 엔티티로 변환한다", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#x27;");
  });

  it("스크립트 태그를 무력화한다", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("일반 텍스트는 그대로 반환한다", () => {
    expect(escapeHtml("Hello, world!")).toBe("Hello, world!");
    expect(escapeHtml("안녕하세요")).toBe("안녕하세요");
  });

  it("빈 문자열을 처리한다", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("복합 케이스를 처리한다", () => {
    expect(escapeHtml('a & b < c > d "e" \'f\'')).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &#x27;f&#x27;"
    );
  });
});

describe("unescapeHtml", () => {
  it("엔티티를 원래 문자로 복원한다", () => {
    expect(unescapeHtml("&lt;")).toBe("<");
    expect(unescapeHtml("&gt;")).toBe(">");
    expect(unescapeHtml("&amp;")).toBe("&");
    expect(unescapeHtml("&quot;")).toBe('"');
    expect(unescapeHtml("&#x27;")).toBe("'");
  });

  it("HTML 태그를 복원한다", () => {
    expect(unescapeHtml("&lt;b&gt;hello&lt;/b&gt;")).toBe("<b>hello</b>");
  });

  it("일반 텍스트는 그대로 반환한다", () => {
    expect(unescapeHtml("Hello, world!")).toBe("Hello, world!");
  });

  it("빈 문자열을 처리한다", () => {
    expect(unescapeHtml("")).toBe("");
  });

  it("escapeHtml → unescapeHtml 왕복 가능하다", () => {
    const original = '<b>Hello & "World"!</b>';
    expect(unescapeHtml(escapeHtml(original))).toBe(original);
  });
});
