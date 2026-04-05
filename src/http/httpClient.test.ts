import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient, HttpError, TimeoutError } from "./httpClient";

// fetch 모킹 헬퍼
function mockFetch(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const contentType = typeof body === "string" ? "text/plain" : "application/json";
  const responseBody = typeof body === "string" ? body : JSON.stringify(body);

  return vi.fn().mockResolvedValue(
    new Response(responseBody, {
      status,
      headers: { "Content-Type": contentType, ...headers },
    }),
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("기본 HTTP 메서드", () => {
  it("get() — 응답 JSON을 반환한다", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { id: 1, name: "Alice" }));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const result = await client.get<{ id: number; name: string }>("/users/1");

    expect(result).toEqual({ id: 1, name: "Alice" });
  });

  it("post() — body를 JSON으로 직렬화해서 전송한다", async () => {
    const spy = mockFetch(201, { id: 99 });
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await client.post("/posts", { title: "Hello" });

    const [, init] = spy.mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ title: "Hello" }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("put() / patch() / delete() 메서드가 올바른 method를 사용한다", async () => {
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const makeSpy = () =>
      vi.fn().mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } }))
      );

    let spy = makeSpy();
    vi.stubGlobal("fetch", spy);
    await client.put("/res/1", {});
    expect(spy.mock.calls[0][1].method).toBe("PUT");

    spy = makeSpy();
    vi.stubGlobal("fetch", spy);
    await client.patch("/res/1", {});
    expect(spy.mock.calls[0][1].method).toBe("PATCH");

    spy = makeSpy();
    vi.stubGlobal("fetch", spy);
    await client.delete("/res/1");
    expect(spy.mock.calls[0][1].method).toBe("DELETE");
  });

  it("204 응답은 undefined를 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const result = await client.delete("/res/1");
    expect(result).toBeUndefined();
  });
});

describe("baseUrl & URL 조합", () => {
  it("baseUrl + 상대 경로가 조합된다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await client.get("/users/1");

    const url = spy.mock.calls[0][0];
    expect(url).toBe("https://api.example.com/users/1");
  });

  it("절대 URL은 baseUrl을 무시한다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await client.get("https://other.example.com/data");

    const url = spy.mock.calls[0][0];
    expect(url).toBe("https://other.example.com/data");
  });

  it("params가 URL 쿼리스트링으로 추가된다", async () => {
    const spy = mockFetch(200, []);
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await client.get("/users", { params: { page: 2, limit: 10 } });

    const url = new URL(spy.mock.calls[0][0]);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  it("params의 undefined/null 값은 제외된다", async () => {
    const spy = mockFetch(200, []);
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await client.get("/users", { params: { page: 1, filter: null, sort: undefined } });

    const url = new URL(spy.mock.calls[0][0]);
    expect(url.searchParams.has("filter")).toBe(false);
    expect(url.searchParams.has("sort")).toBe(false);
    expect(url.searchParams.get("page")).toBe("1");
  });
});

describe("기본 헤더", () => {
  it("options.headers가 모든 요청에 포함된다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      headers: { Authorization: "Bearer token123" },
    });

    await client.get("/me");

    const { headers } = spy.mock.calls[0][1];
    expect((headers as Record<string, string>)["Authorization"]).toBe("Bearer token123");
  });

  it("요청별 헤더가 기본 헤더보다 우선한다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      headers: { "X-Version": "1" },
    });

    await client.get("/me", { headers: { "X-Version": "2" } });

    const { headers } = spy.mock.calls[0][1];
    expect((headers as Record<string, string>)["X-Version"]).toBe("2");
  });
});

describe("HttpError", () => {
  it("4xx 응답은 HttpError를 던진다", async () => {
    vi.stubGlobal("fetch", mockFetch(404, { message: "Not Found" }));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    await expect(client.get("/missing")).rejects.toBeInstanceOf(HttpError);
  });

  it("HttpError는 status, body, config를 포함한다", async () => {
    vi.stubGlobal("fetch", mockFetch(422, { errors: ["invalid"] }));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    try {
      await client.post("/validate", { data: "bad" });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      const err = e as HttpError;
      expect(err.status).toBe(422);
      expect(err.body).toEqual({ errors: ["invalid"] });
      expect(err.config.method).toBe("POST");
    }
  });

  it("5xx 응답도 HttpError를 던진다", async () => {
    vi.stubGlobal("fetch", mockFetch(500, "Internal Server Error", { "Content-Type": "text/plain" }));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const error = await client.get("/crash").catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(500);
  });
});

describe("타임아웃", () => {
  it("타임아웃 초과 시 TimeoutError를 던진다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError"))
            );
          }),
      ),
    );

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      timeout: 100,
    });

    await expect(client.get("/slow")).rejects.toBeInstanceOf(TimeoutError);
  });

  it("요청별 타임아웃이 클라이언트 기본값을 override한다", async () => {
    let abortedAfterMs = 0;
    const start = Date.now();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => {
            init.signal?.addEventListener("abort", () => {
              abortedAfterMs = Date.now() - start;
              reject(new DOMException("Aborted", "AbortError"));
            });
          }),
      ),
    );

    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      timeout: 5000,
    });

    await expect(client.get("/slow", { timeout: 50 })).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("요청 인터셉터", () => {
  it("인터셉터가 config를 수정할 수 있다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    client.interceptors.request.use((config) => ({
      ...config,
      headers: { ...config.headers, "X-Request-ID": "test-id" },
    }));

    await client.get("/data");

    const { headers } = spy.mock.calls[0][1];
    expect((headers as Record<string, string>)["X-Request-ID"]).toBe("test-id");
  });

  it("여러 인터셉터가 순서대로 실행된다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    const order: number[] = [];
    client.interceptors.request.use((config) => { order.push(1); return config; });
    client.interceptors.request.use((config) => { order.push(2); return config; });

    await client.get("/data");
    expect(order).toEqual([1, 2]);
  });

  it("eject()로 인터셉터를 제거할 수 있다", async () => {
    const spy = mockFetch(200, {});
    vi.stubGlobal("fetch", spy);
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    let called = false;
    const id = client.interceptors.request.use((config) => { called = true; return config; });
    client.interceptors.request.eject(id);

    await client.get("/data");
    expect(called).toBe(false);
  });
});

describe("응답 인터셉터", () => {
  it("onFulfilled 인터셉터가 응답을 받는다", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { value: 42 }));
    const client = createHttpClient({ baseUrl: "https://api.example.com" });

    let interceptedStatus: number | undefined;
    client.interceptors.response.use((response) => {
      interceptedStatus = response.status;
      return response;
    });

    await client.get("/data");
    expect(interceptedStatus).toBe(200);
  });
});
