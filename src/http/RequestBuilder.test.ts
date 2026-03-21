import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestBuilder } from "./RequestBuilder";

describe("RequestBuilder", () => {
  describe("build()", () => {
    it("url과 method가 Request에 반영된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("POST")
        .build();

      expect(request.url).toBe("https://api.example.com/users");
      expect(request.method).toBe("POST");
    });

    it("params이 쿼리스트링으로 변환된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .param("page", "1")
        .param("limit", "20")
        .build();

      const url = new URL(request.url);
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.get("limit")).toBe("20");
    });

    it("params() 객체로 한번에 설정된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .params({ page: "1", limit: "20" })
        .build();

      const url = new URL(request.url);
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.get("limit")).toBe("20");
    });

    it("body가 있으면 JSON으로 직렬화된다", async () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("POST")
        .body({ name: "John", age: 30 })
        .build();

      expect(await request.text()).toBe(JSON.stringify({ name: "John", age: 30 }));
    });

    it("body가 있으면 Content-Type이 자동으로 application/json으로 설정된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("POST")
        .body({ name: "John" })
        .build();

      expect(request.headers.get("Content-Type")).toBe("application/json");
    });

    it("Content-Type이 이미 지정된 경우 덮어쓰지 않는다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("POST")
        .header("Content-Type", "text/plain")
        .body("hello")
        .build();

      expect(request.headers.get("Content-Type")).toBe("text/plain");
    });

    it("header()가 올바르게 설정된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .header("Authorization", "Bearer token")
        .header("X-Custom", "value")
        .build();

      expect(request.headers.get("Authorization")).toBe("Bearer token");
      expect(request.headers.get("X-Custom")).toBe("value");
    });

    it("headers() 객체로 한번에 설정된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .headers({ Authorization: "Bearer token", "X-Custom": "value" })
        .build();

      expect(request.headers.get("Authorization")).toBe("Bearer token");
      expect(request.headers.get("X-Custom")).toBe("value");
    });

    it("header()와 headers()를 혼용하면 병합된다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .header("Authorization", "Bearer token")
        .headers({ "X-Custom": "value" })
        .build();

      expect(request.headers.get("Authorization")).toBe("Bearer token");
      expect(request.headers.get("X-Custom")).toBe("value");
    });

    it("나중에 설정한 header가 이전 값을 덮어쓴다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .header("Authorization", "Bearer old")
        .header("Authorization", "Bearer new")
        .build();

      expect(request.headers.get("Authorization")).toBe("Bearer new");
    });

    it("body 없으면 Content-Type이 자동 설정되지 않는다", () => {
      const request = new RequestBuilder()
        .url("https://api.example.com/users")
        .method("GET")
        .build();

      expect(request.headers.get("Content-Type")).toBeNull();
    });
  });

  describe("send()", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    it("응답이 ok이면 JSON을 반환한다", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({ id: 1, name: "John" }), { status: 200 })
      );

      const result = await new RequestBuilder()
        .url("https://api.example.com/users/1")
        .method("GET")
        .send<{ id: number; name: string }>();

      expect(result).toEqual({ id: 1, name: "John" });
    });

    it("응답이 ok가 아니면 에러를 throw한다", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(null, { status: 404, statusText: "Not Found" })
      );

      await expect(
        new RequestBuilder()
          .url("https://api.example.com/users/999")
          .method("GET")
          .send()
      ).rejects.toThrow("HTTP 404: Not Found");
    });

    it("build()로 생성된 Request로 fetch를 호출한다", async () => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await new RequestBuilder()
        .method("DELETE")
        .header("Authorization", "Bearer token")
        .url("https://api.example.com/users")
        .send();

      const calledRequest = vi.mocked(fetch).mock.calls[0][0] as Request;
      expect(calledRequest.method).toBe("DELETE");
      expect(calledRequest.headers.get("Authorization")).toBe("Bearer token");
    });
  });

  describe("타입 안전성", () => {
    it("url만 설정하면 UrlBuilder를 반환한다 (build/send 없음)", () => {
      const builder = new RequestBuilder().url("https://api.example.com");
    



      // @ts-expect-error — method 없이 build 불가
      expect(builder.build).toBeUndefined();
    });

    it("method만 설정하면 MethodBuilder를 반환한다 (build/send 없음)", () => {
      const builder = new RequestBuilder().method("GET");
      // @ts-expect-error — url 없이 build 불가
      expect(builder.build).toBeUndefined();
    });

    it("url과 method 모두 설정하면 ReadyBuilder를 반환한다 (build/send 있음)", () => {
      const builder = new RequestBuilder()
        .url("https://api.example.com")
        .method("GET");

      expect(builder.build).toBeTypeOf("function");
      expect(builder.send).toBeTypeOf("function");
    });
  });
});
