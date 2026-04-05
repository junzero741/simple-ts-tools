import { describe, it, expect, vi, beforeEach } from "vitest";
import { createApiClient, ApiError } from "./apiClient";

// fetch mock
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("createApiClient", () => {
  const api = createApiClient({
    baseURL: "https://api.example.com/v1",
    headers: { "Authorization": "Bearer test-token" },
  });

  describe("GET", () => {
    it("GET 요청을 보낸다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1 }]));

      const res = await api.get("/users");
      expect(res.data).toEqual([{ id: 1 }]);
      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.example.com/v1/users");
      expect(init.method).toBe("GET");
      expect(init.headers.Authorization).toBe("Bearer test-token");
    });

    it("쿼리 파라미터를 추가한다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await api.get("/users", { params: { page: 1, limit: 20, q: undefined } });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("page=1");
      expect(url).toContain("limit=20");
      expect(url).not.toContain("q=");
    });
  });

  describe("POST", () => {
    it("POST body를 보낸다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, name: "Alice" }, 201));

      const res = await api.post("/users", { body: { name: "Alice" } });
      expect(res.data).toEqual({ id: 1, name: "Alice" });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ name: "Alice" });
    });
  });

  describe("PUT / PATCH / DELETE", () => {
    it("PUT", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await api.put("/users/1", { body: { name: "Bob" } });
      expect(mockFetch.mock.calls[0][1].method).toBe("PUT");
    });

    it("PATCH", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await api.patch("/users/1", { body: { name: "Bob" } });
      expect(mockFetch.mock.calls[0][1].method).toBe("PATCH");
    });

    it("DELETE", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await api.delete("/users/1");
      expect(mockFetch.mock.calls[0][1].method).toBe("DELETE");
    });
  });

  describe("에러 처리", () => {
    it("4xx/5xx 응답 시 ApiError를 던진다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Not Found" }, 404));

      try {
        await api.get("/missing");
        expect.fail("should throw");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(404);
        expect((err as ApiError).data).toEqual({ error: "Not Found" });
      }
    });
  });

  describe("커스텀 헤더", () => {
    it("요청별 헤더를 추가한다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await api.get("/test", { headers: { "X-Custom": "value" } });
      expect(mockFetch.mock.calls[0][1].headers["X-Custom"]).toBe("value");
    });
  });

  describe("baseURL 결합", () => {
    it("슬래시를 올바르게 결합한다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const api2 = createApiClient({ baseURL: "https://api.example.com/" });
      await api2.get("/test");
      expect(mockFetch.mock.calls[0][0]).toBe("https://api.example.com/test");
    });
  });

  describe("인터셉터", () => {
    it("onRequest — 요청 전 수정", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      const api2 = createApiClient({
        baseURL: "https://api.example.com",
        onRequest: (config) => ({
          ...config,
          headers: { ...config.headers, "X-Injected": "yes" },
        }),
      });

      await api2.get("/test");
      expect(mockFetch.mock.calls[0][1].headers["X-Injected"]).toBe("yes");
    });

    it("onResponse — 응답 후 콜백", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
      const onResponse = vi.fn();

      const api2 = createApiClient({
        baseURL: "https://api.example.com",
        onResponse,
      });

      await api2.get("/test");
      expect(onResponse).toHaveBeenCalledOnce();
    });

    it("onError — 에러 시 콜백", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 500));
      const onError = vi.fn();

      const api2 = createApiClient({
        baseURL: "https://api.example.com",
        onError,
      });

      await api2.get("/test").catch(() => {});
      expect(onError).toHaveBeenCalledOnce();
    });
  });

  describe("request — 저수준 API", () => {
    it("커스텀 요청을 보낸다", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));

      await api.request({
        url: "https://other.api.com/data",
        method: "OPTIONS",
      });

      expect(mockFetch.mock.calls[0][0]).toBe("https://other.api.com/data");
      expect(mockFetch.mock.calls[0][1].method).toBe("OPTIONS");
    });
  });
});
