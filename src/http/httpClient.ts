/**
 * fetch 기반 HTTP 클라이언트.
 *
 * ## 주요 기능
 * - baseUrl + 기본 헤더 설정
 * - 요청/응답 인터셉터 (미들웨어 체인)
 * - 타임아웃 (AbortController)
 * - 상세 에러 타입 (`HttpError` — status, body, headers 포함)
 * - 자동 JSON 직렬화/역직렬화
 *
 * ## RequestBuilder와의 역할 분리
 * - `RequestBuilder` — 개별 요청의 컴파일 타임 안전 빌드
 * - `HttpClient` — 공통 설정을 공유하는 클라이언트 인스턴스 (interceptor, baseUrl)
 *
 * @example
 * const client = createHttpClient({
 *   baseUrl: "https://api.example.com",
 *   timeout: 5000,
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 *
 * // GET — 타입 추론 포함
 * const user = await client.get<User>("/users/123");
 *
 * // POST with body
 * const post = await client.post<Post>("/posts", { title: "Hello" });
 *
 * // 요청 인터셉터 — 모든 요청에 X-Request-ID 추가
 * client.interceptors.request.use(config => ({
 *   ...config,
 *   headers: { ...config.headers, "X-Request-ID": createId() },
 * }));
 *
 * // 응답 인터셉터 — 401 시 토큰 갱신 후 재시도
 * client.interceptors.response.use(null, async (error) => {
 *   if (error instanceof HttpError && error.status === 401) {
 *     await refreshToken();
 *     return client.request(error.config);
 *   }
 *   throw error;
 * });
 */

// ─── 요청 설정 ────────────────────────────────────────────────────────────────

export interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  /** URL 쿼리 파라미터 */
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** 요청 타임아웃 (ms). 초과 시 `TimeoutError`를 던진다. */
  timeout?: number;
  /** fetch에 직접 전달될 추가 옵션 */
  fetchOptions?: Omit<RequestInit, "method" | "headers" | "body" | "signal">;
}

// ─── 에러 타입 ────────────────────────────────────────────────────────────────

/**
 * HTTP 응답이 2xx가 아닐 때 던져지는 에러.
 * `status`, `body`, `headers`, 원본 `config`를 포함한다.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    public readonly headers: Headers,
    public readonly config: RequestConfig,
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = "HttpError";
  }
}

/**
 * 타임아웃 초과 시 던져지는 에러.
 */
export class TimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    public readonly config: RequestConfig,
  ) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

// ─── 인터셉터 ─────────────────────────────────────────────────────────────────

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseFulfilled<T> = (response: T) => T | Promise<T>;
type ResponseRejected = (error: unknown) => unknown;

export interface InterceptorManager<T> {
  /** 인터셉터를 등록하고 제거에 사용할 ID를 반환한다. */
  use(onFulfilled: ((value: T) => T | Promise<T>) | null, onRejected?: ResponseRejected): number;
  /** 등록된 인터셉터를 제거한다. */
  eject(id: number): void;
}

function createInterceptorManager<T>(): InterceptorManager<T> & {
  _handlers: Array<{ onFulfilled: ((v: T) => T | Promise<T>) | null; onRejected?: ResponseRejected } | null>;
} {
  const handlers: Array<{ onFulfilled: ((v: T) => T | Promise<T>) | null; onRejected?: ResponseRejected } | null> = [];

  return {
    _handlers: handlers,
    use(onFulfilled, onRejected?) {
      handlers.push({ onFulfilled, onRejected });
      return handlers.length - 1;
    },
    eject(id) {
      if (handlers[id]) handlers[id] = null;
    },
  };
}

// ─── 클라이언트 ───────────────────────────────────────────────────────────────

export interface HttpClientOptions {
  /** 모든 요청의 기본 URL. 상대 경로와 합쳐진다. */
  baseUrl?: string;
  /** 모든 요청에 기본으로 포함될 헤더. */
  headers?: Record<string, string>;
  /** 기본 타임아웃 (ms). 개별 요청에서 override 가능. */
  timeout?: number;
}

export interface HttpClient {
  /** 요청/응답 인터셉터 관리자 */
  interceptors: {
    request: InterceptorManager<RequestConfig>;
    response: InterceptorManager<Response>;
  };

  /** 범용 요청 메서드. 인터셉터가 모두 적용된다. */
  request<T = unknown>(config: Omit<RequestConfig, "headers"> & { headers?: Record<string, string> }): Promise<T>;

  get<T = unknown>(url: string, options?: Partial<Omit<RequestConfig, "url" | "method" | "body">>): Promise<T>;
  post<T = unknown>(url: string, body?: unknown, options?: Partial<Omit<RequestConfig, "url" | "method" | "body">>): Promise<T>;
  put<T = unknown>(url: string, body?: unknown, options?: Partial<Omit<RequestConfig, "url" | "method" | "body">>): Promise<T>;
  patch<T = unknown>(url: string, body?: unknown, options?: Partial<Omit<RequestConfig, "url" | "method" | "body">>): Promise<T>;
  delete<T = unknown>(url: string, options?: Partial<Omit<RequestConfig, "url" | "method" | "body">>): Promise<T>;
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const { baseUrl = "", headers: defaultHeaders = {}, timeout: defaultTimeout } = options;

  const requestInterceptors = createInterceptorManager<RequestConfig>();
  const responseInterceptors = createInterceptorManager<Response>();

  function buildUrl(url: string, params?: RequestConfig["params"]): string {
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    if (!params || Object.keys(params).length === 0) return fullUrl;

    const parsed = new URL(fullUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        parsed.searchParams.set(key, String(value));
      }
    }
    return parsed.toString();
  }

  async function dispatchRequest<T>(config: RequestConfig): Promise<T> {
    const { url, method, headers, params, body, timeout, fetchOptions } = config;

    const fullUrl = buildUrl(url, params);
    const mergedHeaders: Record<string, string> = { ...headers };

    if (body !== undefined && !mergedHeaders["Content-Type"] && !mergedHeaders["content-type"]) {
      mergedHeaders["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeoutMs = timeout ?? defaultTimeout;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs !== undefined) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        ...fetchOptions,
        method,
        headers: mergedHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) {
        throw new TimeoutError(timeoutMs!, config);
      }
      throw err;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }

    // 응답 인터셉터 체인 적용
    let finalResponse: Response = response;
    for (const handler of responseInterceptors._handlers) {
      if (!handler) continue;
      try {
        if (handler.onFulfilled) {
          finalResponse = await handler.onFulfilled(finalResponse);
        }
      } catch (err) {
        if (handler.onRejected) {
          finalResponse = await (handler.onRejected(err) as Promise<Response>);
        } else {
          throw err;
        }
      }
    }

    if (!finalResponse.ok) {
      const errorContentType = finalResponse.headers.get("Content-Type") ?? "";
      let body: unknown;
      if (errorContentType.includes("application/json")) {
        try { body = await finalResponse.json(); } catch { body = undefined; }
      } else {
        body = await finalResponse.text();
      }
      throw new HttpError(finalResponse.status, finalResponse.statusText, body, finalResponse.headers, config);
    }

    // 응답 본문이 없으면 undefined 반환
    const contentType = finalResponse.headers.get("Content-Type") ?? "";
    if (finalResponse.status === 204 || !contentType.includes("application/json")) {
      return undefined as T;
    }

    return finalResponse.json() as Promise<T>;
  }

  const client: HttpClient = {
    interceptors: {
      request: requestInterceptors,
      response: responseInterceptors,
    },

    async request<T>(partialConfig: Omit<RequestConfig, "headers"> & { headers?: Record<string, string> }): Promise<T> {
      // 기본 헤더와 병합
      let config: RequestConfig = {
        ...partialConfig,
        headers: { ...defaultHeaders, ...partialConfig.headers },
      };

      // 요청 인터셉터 체인 적용
      for (const handler of requestInterceptors._handlers) {
        if (!handler) continue;
        try {
          if (handler.onFulfilled) {
            config = await handler.onFulfilled(config);
          }
        } catch (err) {
          if (handler.onRejected) {
            config = await (handler.onRejected(err) as Promise<RequestConfig>);
          } else {
            throw err;
          }
        }
      }

      return dispatchRequest<T>(config);
    },

    get<T>(url, options = {}) {
      return client.request<T>({ ...options, url, method: "GET" });
    },
    post<T>(url, body?, options = {}) {
      return client.request<T>({ ...options, url, method: "POST", body });
    },
    put<T>(url, body?, options = {}) {
      return client.request<T>({ ...options, url, method: "PUT", body });
    },
    patch<T>(url, body?, options = {}) {
      return client.request<T>({ ...options, url, method: "PATCH", body });
    },
    delete<T>(url, options = {}) {
      return client.request<T>({ ...options, url, method: "DELETE" });
    },
  };

  return client;
}
