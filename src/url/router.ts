/**
 * 경량 URL 라우터 (Router).
 *
 * Express 스타일 경로 패턴 매칭. 프레임워크 무관하게
 * URL 패턴을 핸들러에 매핑한다. SPA 클라이언트 라우팅,
 * 서버 요청 라우팅, CLI 커맨드 디스패치 등에 활용.
 *
 * @example
 * const router = createRouter<string>();
 *
 * router.add("GET", "/users", () => "user list");
 * router.add("GET", "/users/:id", ({ params }) => `user ${params.id}`);
 * router.add("POST", "/users", () => "create user");
 * router.add("GET", "/files/*", ({ params }) => `file: ${params["*"]}`);
 *
 * const result = router.match("GET", "/users/42");
 * // { handler: fn, params: { id: "42" }, path: "/users/:id" }
 *
 * result?.handler({ params: result.params });
 * // "user 42"
 *
 * @example
 * // 메서드 무관 매칭
 * router.add("ALL", "/health", () => "ok");
 *
 * @complexity Time: O(n) 라우트 수. Space: O(n).
 */

export interface RouteParams {
  [key: string]: string;
}

export interface RouteContext {
  params: RouteParams;
  path: string;
  method: string;
}

export type RouteHandler<T> = (ctx: RouteContext) => T;

export interface RouteMatch<T> {
  handler: RouteHandler<T>;
  params: RouteParams;
  path: string;
}

interface RouteEntry<T> {
  method: string;
  pattern: string;
  segments: string[];
  handler: RouteHandler<T>;
}

export interface Router<T> {
  /** 라우트를 등록한다. method는 "GET", "POST" 등 또는 "ALL". */
  add(method: string, pattern: string, handler: RouteHandler<T>): Router<T>;

  /** URL을 매칭한다. 매칭되는 라우트가 없으면 undefined. */
  match(method: string, path: string): RouteMatch<T> | undefined;

  /** 등록된 라우트 수. */
  readonly size: number;
}

function normalizePath(path: string): string {
  return "/" + path.split("/").filter(Boolean).join("/");
}

function matchRoute<T>(
  entry: RouteEntry<T>,
  method: string,
  pathSegments: string[],
): RouteParams | undefined {
  if (entry.method !== "ALL" && entry.method !== method) return undefined;

  const params: RouteParams = {};
  const { segments } = entry;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // 와일드카드 — 나머지 전부 매칭
    if (seg === "*") {
      params["*"] = pathSegments.slice(i).join("/");
      return params;
    }

    if (i >= pathSegments.length) return undefined;

    // 파라미터
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = pathSegments[i];
      continue;
    }

    // 정확한 매칭
    if (seg !== pathSegments[i]) return undefined;
  }

  // 길이가 다르면 불일치 (와일드카드 제외)
  if (segments.length !== pathSegments.length) return undefined;

  return params;
}

export function createRouter<T = unknown>(): Router<T> {
  const routes: RouteEntry<T>[] = [];

  const router: Router<T> = {
    add(method, pattern, handler) {
      const normalized = normalizePath(pattern);
      routes.push({
        method: method.toUpperCase(),
        pattern: normalized,
        segments: normalized.split("/").filter(Boolean),
        handler,
      });
      return router;
    },

    match(method, path) {
      const normalized = normalizePath(path);
      const pathSegments = normalized.split("/").filter(Boolean);
      const upperMethod = method.toUpperCase();

      for (const entry of routes) {
        const params = matchRoute(entry, upperMethod, pathSegments);
        if (params !== undefined) {
          return { handler: entry.handler, params, path: entry.pattern };
        }
      }

      return undefined;
    },

    get size() {
      return routes.length;
    },
  };

  return router;
}
