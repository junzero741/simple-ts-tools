// 선언적 API 클라이언트 빌더 (Declarative API Client).
//
// === 예상 사용처 ===
// - REST API SDK 생성 (GitHub, Stripe, Slack API 래퍼)
// - BFF에서 다운스트림 서비스 호출 (인증 헤더 자동 주입)
// - 프론트엔드 API 계층 (baseURL + 공통 에러 처리 + 토큰 갱신)
// - 마이크로서비스 간 내부 통신 (서비스 디스커버리 + retry)
// - 테스트에서 API 호출 mock (인터셉터로 응답 교체)
// - API 버전 관리 (/v1, /v2 prefix 자동 부착)
//
// const api = createApiClient({
//   baseURL: "https://api.example.com/v1",
//   headers: { "Authorization": "Bearer token" },
//   timeout: 10_000,
//   onError: (err) => refreshTokenAndRetry(err),
// });
//
// const users = await api.get<User[]>("/users", { params: { page: 1 } });
// await api.post<User>("/users", { body: { name: "Alice" } });
// await api.put("/users/1", { body: { name: "Bob" } });
// await api.delete("/users/1");

export interface ApiClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
  onResponse?: (response: ApiResponse<unknown>) => void | Promise<void>;
  onError?: (error: ApiError) => void | Promise<void>;
}

export interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data: unknown,
    public readonly headers: Headers,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  patch<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  request<T = unknown>(config: Partial<RequestConfig> & { url: string; method: string }): Promise<ApiResponse<T>>;
}

function buildURL(base: string, path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
  if (!params) return url;

  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  return qs ? `${url}?${qs}` : url;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseURL, headers: defaultHeaders = {}, timeout: defaultTimeout, onRequest, onResponse, onError } = options;

  async function execute<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    let finalConfig = config;
    if (onRequest) {
      finalConfig = await onRequest(config);
    }

    const controller = new AbortController();
    const signal = finalConfig.signal ?? controller.signal;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const effectiveTimeout = finalConfig.timeout ?? defaultTimeout;
    if (effectiveTimeout && !finalConfig.signal) {
      timer = setTimeout(() => controller.abort(), effectiveTimeout);
    }

    try {
      const fetchOptions: RequestInit = {
        method: finalConfig.method,
        headers: finalConfig.headers,
        signal,
      };

      if (finalConfig.body !== undefined && finalConfig.method !== "GET") {
        fetchOptions.body = JSON.stringify(finalConfig.body);
      }

      const res = await fetch(finalConfig.url, fetchOptions);

      let data: T;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = await res.json() as T;
      } else {
        data = await res.text() as unknown as T;
      }

      const response: ApiResponse<T> = {
        data,
        status: res.status,
        headers: res.headers,
        ok: res.ok,
      };

      if (!res.ok) {
        const error = new ApiError(
          `${finalConfig.method} ${finalConfig.url} failed with ${res.status}`,
          res.status,
          data,
          res.headers,
        );
        if (onError) await onError(error);
        throw error;
      }

      if (onResponse) await onResponse(response);
      return response;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if ((err as Error).name === "AbortError") {
        const apiErr = new ApiError("Request timeout", 0, null, new Headers());
        if (onError) await onError(apiErr);
        throw apiErr;
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function makeRequest<T>(method: string, path: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
    const config: RequestConfig = {
      url: buildURL(baseURL, path, opts.params),
      method,
      headers: {
        "Content-Type": "application/json",
        ...defaultHeaders,
        ...opts.headers,
      },
      body: opts.body,
      timeout: opts.timeout,
      signal: opts.signal,
    };

    return execute<T>(config);
  }

  return {
    get: <T>(path: string, opts?: RequestOptions) => makeRequest<T>("GET", path, opts),
    post: <T>(path: string, opts?: RequestOptions) => makeRequest<T>("POST", path, opts),
    put: <T>(path: string, opts?: RequestOptions) => makeRequest<T>("PUT", path, opts),
    patch: <T>(path: string, opts?: RequestOptions) => makeRequest<T>("PATCH", path, opts),
    delete: <T>(path: string, opts?: RequestOptions) => makeRequest<T>("DELETE", path, opts),
    request: <T>(config: Partial<RequestConfig> & { url: string; method: string }) =>
      execute<T>({
        headers: { "Content-Type": "application/json", ...defaultHeaders },
        ...config,
      } as RequestConfig),
  };
}
