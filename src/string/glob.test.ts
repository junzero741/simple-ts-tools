import { describe, it, expect } from "vitest";
import { globMatch, createGlobMatcher } from "./glob";

describe("globMatch", () => {
  describe("* — 단일 세그먼트", () => {
    it("확장자 매칭", () => {
      expect(globMatch("*.ts", "index.ts")).toBe(true);
      expect(globMatch("*.ts", "app.js")).toBe(false);
      expect(globMatch("*.ts", "src/index.ts")).toBe(false);
    });

    it("접두사 매칭", () => {
      expect(globMatch("test_*", "test_utils")).toBe(true);
      expect(globMatch("test_*", "prod_utils")).toBe(false);
    });

    it("중간 와일드카드", () => {
      expect(globMatch("file_*.txt", "file_001.txt")).toBe(true);
      expect(globMatch("file_*.txt", "file_.txt")).toBe(true);
    });
  });

  describe("** — 다중 세그먼트", () => {
    it("디렉토리를 넘어 매칭", () => {
      expect(globMatch("src/**/*.ts", "src/index.ts")).toBe(true);
      expect(globMatch("src/**/*.ts", "src/utils/helper.ts")).toBe(true);
      expect(globMatch("src/**/*.ts", "src/a/b/c.ts")).toBe(true);
    });

    it("루트 파일도 매칭", () => {
      expect(globMatch("**/*.ts", "index.ts")).toBe(true);
      expect(globMatch("**/*.ts", "src/deep/file.ts")).toBe(true);
    });

    it("** 뒤에 패턴 없으면 모든 것", () => {
      expect(globMatch("src/**", "src/anything")).toBe(true);
      expect(globMatch("src/**", "src/a/b/c")).toBe(true);
    });
  });

  describe("? — 단일 문자", () => {
    it("정확히 한 문자 매칭", () => {
      expect(globMatch("file?.txt", "file1.txt")).toBe(true);
      expect(globMatch("file?.txt", "fileAB.txt")).toBe(false);
      expect(globMatch("file?.txt", "file/.txt")).toBe(false);
    });
  });

  describe("{a,b} — 대안", () => {
    it("여러 확장자 매칭", () => {
      expect(globMatch("*.{js,ts}", "app.ts")).toBe(true);
      expect(globMatch("*.{js,ts}", "app.js")).toBe(true);
      expect(globMatch("*.{js,ts}", "app.css")).toBe(false);
    });

    it("여러 디렉토리 매칭", () => {
      expect(globMatch("{src,lib}/*.ts", "src/index.ts")).toBe(true);
      expect(globMatch("{src,lib}/*.ts", "lib/utils.ts")).toBe(true);
      expect(globMatch("{src,lib}/*.ts", "test/app.ts")).toBe(false);
    });
  });

  describe("[abc] — 문자 클래스", () => {
    it("지정된 문자 중 하나", () => {
      expect(globMatch("[abc].txt", "a.txt")).toBe(true);
      expect(globMatch("[abc].txt", "d.txt")).toBe(false);
    });

    it("범위", () => {
      expect(globMatch("[0-9].txt", "5.txt")).toBe(true);
      expect(globMatch("[0-9].txt", "a.txt")).toBe(false);
    });
  });

  describe("정확한 매칭", () => {
    it("패턴 없으면 정확히 일치", () => {
      expect(globMatch("hello.txt", "hello.txt")).toBe(true);
      expect(globMatch("hello.txt", "hello.ts")).toBe(false);
    });
  });

  describe("특수 문자 이스케이프", () => {
    it("점이 리터럴로 처리", () => {
      expect(globMatch("file.txt", "filextxt")).toBe(false);
    });
  });
});

describe("createGlobMatcher", () => {
  it("포함 패턴으로 매칭한다", () => {
    const match = createGlobMatcher("*.ts", "*.js");

    expect(match("app.ts")).toBe(true);
    expect(match("app.js")).toBe(true);
    expect(match("app.css")).toBe(false);
  });

  it("제외 패턴 (! 접두사)", () => {
    const match = createGlobMatcher("src/**/*.ts", "!**/*.test.ts");

    expect(match("src/utils/helper.ts")).toBe(true);
    expect(match("src/utils/helper.test.ts")).toBe(false);
  });

  it("포함 + 제외 조합", () => {
    const match = createGlobMatcher(
      "**/*.ts",
      "!node_modules/**",
      "!**/*.d.ts",
    );

    expect(match("src/index.ts")).toBe(true);
    expect(match("node_modules/pkg/index.ts")).toBe(false);
    expect(match("src/types.d.ts")).toBe(false);
  });

  it("포함 패턴 없으면 항상 false", () => {
    const match = createGlobMatcher("!*.test.ts");
    expect(match("app.ts")).toBe(false);
  });
});
