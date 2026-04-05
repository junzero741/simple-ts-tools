import { describe, it, expect } from "vitest";
import { url } from "./urlBuilder";

describe("url (URLBuilder)", () => {
  describe("path", () => {
    it("경로 세그먼트를 추가한다", () => {
      expect(url("https://api.example.com").path("users").toString())
        .toBe("https://api.example.com/users");
    });

    it("여러 세그먼트를 한 번에", () => {
      expect(url("https://api.example.com").path("users", 42, "posts").toString())
        .toBe("https://api.example.com/users/42/posts");
    });

    it("중복 슬래시를 제거한다", () => {
      expect(url("https://api.example.com/").path("/users/").toString())
        .toBe("https://api.example.com/users");
    });

    it("체이닝", () => {
      expect(
        url("https://api.example.com")
          .path("v1")
          .path("users")
          .path("me")
          .toString(),
      ).toBe("https://api.example.com/v1/users/me");
    });
  });

  describe("query", () => {
    it("쿼리 파라미터를 추가한다", () => {
      const result = url("https://api.example.com/users")
        .query({ page: 1, limit: 20 })
        .toString();

      expect(result).toContain("page=1");
      expect(result).toContain("limit=20");
      expect(result).toContain("?");
    });

    it("null/undefined 값은 무시한다", () => {
      const result = url("https://api.example.com")
        .query({ a: 1, b: null, c: undefined, d: "ok" })
        .toString();

      expect(result).toContain("a=1");
      expect(result).toContain("d=ok");
      expect(result).not.toContain("b=");
      expect(result).not.toContain("c=");
    });

    it("boolean 값", () => {
      const result = url("https://example.com").query({ active: true }).toString();
      expect(result).toContain("active=true");
    });

    it("특수문자를 인코딩한다", () => {
      const result = url("https://example.com").query({ q: "hello world" }).toString();
      expect(result).toContain("q=hello%20world");
    });
  });

  describe("param", () => {
    it("단일 파라미터를 추가한다", () => {
      const result = url("https://example.com")
        .param("key", "value")
        .toString();
      expect(result).toContain("key=value");
    });
  });

  describe("hash", () => {
    it("해시 프래그먼트를 설정한다", () => {
      expect(url("https://example.com").hash("section").toString())
        .toBe("https://example.com/#section");
    });
  });

  describe("params (플레이스홀더 치환)", () => {
    it(":param을 치환한다", () => {
      expect(
        url("https://api.example.com")
          .path("users/:userId/posts/:postId")
          .params({ userId: 42, postId: 99 })
          .toString(),
      ).toBe("https://api.example.com/users/42/posts/99");
    });
  });

  describe("복합", () => {
    it("path + query + hash 조합", () => {
      const result = url("https://api.example.com")
        .path("users", 42, "posts")
        .query({ page: 1, limit: 20, sort: "created" })
        .hash("comments")
        .toString();

      expect(result).toBe(
        "https://api.example.com/users/42/posts?page=1&limit=20&sort=created#comments",
      );
    });

    it("기존 쿼리가 있는 URL에 추가", () => {
      const result = url("https://example.com/search?q=test")
        .query({ page: 2 })
        .toString();

      expect(result).toContain("q=test");
      expect(result).toContain("page=2");
    });
  });

  describe("toURL", () => {
    it("URL 객체를 반환한다", () => {
      const u = url("https://example.com").path("test").toURL();
      expect(u).toBeInstanceOf(URL);
      expect(u.pathname).toBe("/test");
    });
  });

  describe("엣지 케이스", () => {
    it("base만", () => {
      expect(url("https://example.com").toString()).toBe("https://example.com/");
    });

    it("숫자 세그먼트", () => {
      expect(url("https://example.com").path(0).toString())
        .toBe("https://example.com/0");
    });
  });
});
