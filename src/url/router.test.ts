import { describe, it, expect } from "vitest";
import { createRouter } from "./router";

describe("createRouter", () => {
  describe("정적 경로", () => {
    it("정확한 경로를 매칭한다", () => {
      const router = createRouter<string>();
      router.add("GET", "/users", () => "list");
      router.add("GET", "/about", () => "about");

      const match = router.match("GET", "/users");
      expect(match).toBeDefined();
      expect(match!.handler({ params: {}, path: "/users", method: "GET" })).toBe("list");
      expect(match!.params).toEqual({});
    });

    it("매칭되지 않으면 undefined", () => {
      const router = createRouter();
      router.add("GET", "/users", () => "list");

      expect(router.match("GET", "/posts")).toBeUndefined();
    });

    it("메서드가 다르면 매칭 안 됨", () => {
      const router = createRouter();
      router.add("GET", "/users", () => "get");
      router.add("POST", "/users", () => "post");

      const match = router.match("POST", "/users");
      expect(match!.handler({ params: {}, path: "/users", method: "POST" })).toBe("post");

      expect(router.match("DELETE", "/users")).toBeUndefined();
    });
  });

  describe("파라미터 경로", () => {
    it(":param을 추출한다", () => {
      const router = createRouter<string>();
      router.add("GET", "/users/:id", ({ params }) => params.id);

      const match = router.match("GET", "/users/42");
      expect(match!.params).toEqual({ id: "42" });
      expect(match!.handler({ params: match!.params, path: match!.path, method: "GET" })).toBe("42");
    });

    it("여러 파라미터를 추출한다", () => {
      const router = createRouter();
      router.add("GET", "/users/:userId/posts/:postId", () => null);

      const match = router.match("GET", "/users/1/posts/99");
      expect(match!.params).toEqual({ userId: "1", postId: "99" });
    });

    it("파라미터와 정적 세그먼트를 혼합한다", () => {
      const router = createRouter();
      router.add("GET", "/api/v1/users/:id/profile", () => null);

      const match = router.match("GET", "/api/v1/users/abc/profile");
      expect(match!.params).toEqual({ id: "abc" });
    });
  });

  describe("와일드카드", () => {
    it("*로 나머지를 매칭한다", () => {
      const router = createRouter();
      router.add("GET", "/files/*", () => null);

      const match = router.match("GET", "/files/docs/readme.md");
      expect(match!.params).toEqual({ "*": "docs/readme.md" });
    });

    it("와일드카드가 빈 경로를 매칭한다", () => {
      const router = createRouter();
      router.add("GET", "/static/*", () => null);

      const match = router.match("GET", "/static/");
      expect(match).toBeDefined();
      expect(match!.params["*"]).toBe("");
    });
  });

  describe("ALL 메서드", () => {
    it("모든 메서드를 매칭한다", () => {
      const router = createRouter();
      router.add("ALL", "/health", () => "ok");

      expect(router.match("GET", "/health")).toBeDefined();
      expect(router.match("POST", "/health")).toBeDefined();
      expect(router.match("DELETE", "/health")).toBeDefined();
    });
  });

  describe("우선순위", () => {
    it("먼저 등록된 라우트가 우선한다", () => {
      const router = createRouter<string>();
      router.add("GET", "/users/me", () => "me");
      router.add("GET", "/users/:id", () => "id");

      const match = router.match("GET", "/users/me");
      expect(match!.handler({ params: {}, path: "/users/me", method: "GET" })).toBe("me");
    });

    it("정적이 파라미터보다 우선한다 (등록 순서)", () => {
      const router = createRouter<string>();
      router.add("GET", "/users/:id", () => "param");
      router.add("GET", "/users/admin", () => "static");

      // 먼저 등록된 param이 매칭됨
      const match = router.match("GET", "/users/admin");
      expect(match!.handler({ params: match!.params, path: match!.path, method: "GET" })).toBe("param");
    });
  });

  describe("경로 정규화", () => {
    it("후행 슬래시를 무시한다", () => {
      const router = createRouter();
      router.add("GET", "/users/", () => "list");

      expect(router.match("GET", "/users")).toBeDefined();
      expect(router.match("GET", "/users/")).toBeDefined();
    });

    it("중복 슬래시를 무시한다", () => {
      const router = createRouter();
      router.add("GET", "/api//users", () => "list");

      expect(router.match("GET", "/api/users")).toBeDefined();
    });

    it("메서드 대소문자를 무시한다", () => {
      const router = createRouter();
      router.add("get", "/users", () => "list");

      expect(router.match("GET", "/users")).toBeDefined();
    });
  });

  describe("size", () => {
    it("등록된 라우트 수를 반환한다", () => {
      const router = createRouter();
      expect(router.size).toBe(0);

      router.add("GET", "/a", () => null);
      router.add("POST", "/b", () => null);
      expect(router.size).toBe(2);
    });
  });

  describe("체이닝", () => {
    it("add를 체이닝할 수 있다", () => {
      const router = createRouter<string>()
        .add("GET", "/a", () => "a")
        .add("GET", "/b", () => "b");

      expect(router.size).toBe(2);
      expect(router.match("GET", "/a")).toBeDefined();
    });
  });
});
