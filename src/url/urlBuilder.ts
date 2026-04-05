// URL 빌더 (URL Builder).
//
// === 예상 사용처 ===
// - API 클라이언트에서 엔드포인트 URL 조립 (REST API 호출)
// - OAuth redirect URL 생성 (state, nonce 등 쿼리 파라미터 조합)
// - 페이지네이션 링크 생성 (page, limit, sort 쿼리)
// - CDN/이미지 서비스 URL 조립 (width, height, format 쿼리)
// - 딥링크 / 앱스킴 URL 생성 (모바일 앱 연동)
// - SEO canonical URL 생성
//
// url("https://api.example.com")
//   .path("users", userId, "posts")
//   .query({ page: 1, limit: 20, sort: "created" })
//   .hash("comments")
//   .toString()
// → "https://api.example.com/users/42/posts?page=1&limit=20&sort=created#comments"

export interface URLBuilder {
  /** 경로 세그먼트를 추가한다. 자동으로 / 처리. */
  path(...segments: (string | number)[]): URLBuilder;

  /** 쿼리 파라미터를 추가한다. null/undefined 값은 무시. */
  query(params: Record<string, string | number | boolean | null | undefined>): URLBuilder;

  /** 단일 쿼리 파라미터를 추가한다. */
  param(key: string, value: string | number | boolean): URLBuilder;

  /** 해시(fragment)를 설정한다. */
  hash(fragment: string): URLBuilder;

  /** 경로 내 :param 플레이스홀더를 치환한다. */
  params(values: Record<string, string | number>): URLBuilder;

  /** URL 문자열로 변환한다. */
  toString(): string;

  /** URL 객체로 변환한다. */
  toURL(): URL;
}

export function url(base: string): URLBuilder {
  let pathname = "";
  const queryPairs: [string, string][] = [];
  let fragment = "";

  // base에서 기존 path/query/hash 추출
  let origin: string;
  try {
    const parsed = new URL(base);
    origin = parsed.origin;
    pathname = parsed.pathname === "/" ? "" : parsed.pathname;
    parsed.searchParams.forEach((v, k) => queryPairs.push([k, v]));
    fragment = parsed.hash ? parsed.hash.slice(1) : "";
  } catch {
    // 상대 URL이면 그대로
    origin = "";
    pathname = base;
  }

  const builder: URLBuilder = {
    path(...segments) {
      for (const seg of segments) {
        const s = String(seg).replace(/^\/+|\/+$/g, "");
        if (s) pathname += "/" + s;
      }
      return builder;
    },

    query(params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) continue;
        queryPairs.push([key, String(value)]);
      }
      return builder;
    },

    param(key, value) {
      queryPairs.push([key, String(value)]);
      return builder;
    },

    hash(frag) {
      fragment = frag;
      return builder;
    },

    params(values) {
      for (const [key, value] of Object.entries(values)) {
        pathname = pathname.replace(`:${key}`, encodeURIComponent(String(value)));
      }
      return builder;
    },

    toString() {
      let result = origin + (pathname || "/");

      if (queryPairs.length > 0) {
        const qs = queryPairs
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&");
        result += "?" + qs;
      }

      if (fragment) {
        result += "#" + fragment;
      }

      return result;
    },

    toURL() {
      return new URL(builder.toString());
    },
  };

  return builder;
}
