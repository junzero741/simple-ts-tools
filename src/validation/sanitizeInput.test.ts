import { describe, it, expect } from "vitest";
import { stringSanitizer, numberSanitizer } from "./sanitizeInput";

describe("stringSanitizer", () => {
  describe("기본 변환", () => {
    it("trim", () => {
      expect(stringSanitizer().trim().run("  hello  ")).toBe("hello");
    });

    it("lowercase", () => {
      expect(stringSanitizer().lowercase().run("HELLO")).toBe("hello");
    });

    it("uppercase", () => {
      expect(stringSanitizer().uppercase().run("hello")).toBe("HELLO");
    });

    it("replace", () => {
      expect(stringSanitizer().replace(/\d/g, "").run("abc123")).toBe("abc");
    });

    it("removeWhitespace", () => {
      expect(stringSanitizer().removeWhitespace().run("h e l l o")).toBe("hello");
    });

    it("collapseSpaces", () => {
      expect(stringSanitizer().collapseSpaces().run("  a   b  c  ")).toBe("a b c");
    });

    it("truncate", () => {
      expect(stringSanitizer().truncate(5).run("hello world")).toBe("hello");
      expect(stringSanitizer().truncate(100).run("short")).toBe("short");
    });

    it("stripHtml", () => {
      expect(stringSanitizer().stripHtml().run("<b>bold</b> text")).toBe("bold text");
    });

    it("digitsOnly", () => {
      expect(stringSanitizer().digitsOnly().run("010-1234-5678")).toBe("01012345678");
    });

    it("alphanumericOnly", () => {
      expect(stringSanitizer().alphanumericOnly().run("hello@world.com")).toBe("helloworldcom");
    });
  });

  describe("체이닝", () => {
    it("이메일 정규화", () => {
      const clean = stringSanitizer().trim().lowercase().removeWhitespace();
      expect(clean.run("  Alice@Example.COM  ")).toBe("alice@example.com");
    });

    it("검색어 정규화", () => {
      const clean = stringSanitizer().trim().collapseSpaces().lowercase().truncate(100);
      expect(clean.run("  Hello   WORLD  ")).toBe("hello world");
    });

    it("전화번호 정규화", () => {
      const clean = stringSanitizer().digitsOnly();
      expect(clean.run("+82 10-1234-5678")).toBe("821012345678");
    });
  });

  describe("default", () => {
    it("빈 문자열에 기본값 적용", () => {
      expect(stringSanitizer().trim().default("anonymous").run("   ")).toBe("anonymous");
    });

    it("값이 있으면 그대로", () => {
      expect(stringSanitizer().default("x").run("hello")).toBe("hello");
    });
  });

  describe("ensure", () => {
    it("조건 통과", () => {
      const s = stringSanitizer().ensure((v) => v.length > 0, "empty");
      expect(s.run("ok")).toBe("ok");
    });

    it("조건 실패 시 에러", () => {
      const s = stringSanitizer().trim().ensure((v) => v.includes("@"), "need @");
      expect(() => s.run("no-at")).toThrow("need @");
    });
  });

  describe("transform", () => {
    it("커스텀 변환", () => {
      const s = stringSanitizer().transform((v) => v.split("").reverse().join(""));
      expect(s.run("abc")).toBe("cba");
    });
  });

  describe("runOr", () => {
    it("실패 시 fallback 반환", () => {
      const s = stringSanitizer().ensure(() => false, "fail");
      expect(s.runOr("x", "default")).toBe("default");
    });
  });

  describe("runSafe", () => {
    it("성공 시 ok: true", () => {
      const result = stringSanitizer().trim().runSafe("  hi  ");
      expect(result).toEqual({ ok: true, value: "hi" });
    });

    it("실패 시 ok: false", () => {
      const s = stringSanitizer().ensure(() => false, "bad");
      const result = s.runSafe("x");
      expect(result).toEqual({ ok: false, error: "bad" });
    });
  });
});

describe("numberSanitizer", () => {
  it("clamp", () => {
    expect(numberSanitizer().clamp(0, 100).run(150)).toBe(100);
    expect(numberSanitizer().clamp(0, 100).run(-5)).toBe(0);
    expect(numberSanitizer().clamp(0, 100).run(50)).toBe(50);
  });

  it("round", () => {
    expect(numberSanitizer().round(2).run(3.14159)).toBe(3.14);
  });

  it("floor / ceil", () => {
    expect(numberSanitizer().floor().run(3.9)).toBe(3);
    expect(numberSanitizer().ceil().run(3.1)).toBe(4);
  });

  it("abs", () => {
    expect(numberSanitizer().abs().run(-42)).toBe(42);
  });

  it("default — NaN 대체", () => {
    expect(numberSanitizer().default(0).run(NaN)).toBe(0);
    expect(numberSanitizer().default(0).run(5)).toBe(5);
  });

  it("ensure", () => {
    const s = numberSanitizer().ensure((n) => n > 0, "must be positive");
    expect(s.run(5)).toBe(5);
    expect(() => s.run(-1)).toThrow("must be positive");
  });

  it("체이닝 — 가격 정규화", () => {
    const price = numberSanitizer().abs().round(2).clamp(0, 99999);
    expect(price.run(-123.456)).toBe(123.46);
    expect(price.run(999999)).toBe(99999);
  });
});
