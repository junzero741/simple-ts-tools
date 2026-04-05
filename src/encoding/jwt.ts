// JWT 유틸 (JSON Web Token — decode only).
//
// === 예상 사용처 ===
// - 프론트엔드에서 JWT 토큰 디코딩 (사용자 정보 표시, 만료 확인)
// - API 미들웨어에서 토큰 페이로드 추출 (라우트 가드, 권한 확인)
// - 토큰 만료 시간 체크 후 자동 갱신 (refresh token 로직)
// - 디버깅/로깅에서 토큰 내용 확인 (jwt.io 대체)
// - 테스트에서 mock JWT 생성
//
// 주의: 서명 검증은 포함하지 않음 (서버에서만 해야 함).
// 이 유틸은 Base64 디코딩만 수행한다.
//
// decodeJwt(token)
// → { header: { alg: "HS256", typ: "JWT" },
//     payload: { sub: "1234", name: "Alice", iat: 1234567890 },
//     signature: "..." }
//
// isJwtExpired(token)          → true/false
// getJwtExpiration(token)      → Date
// createMockJwt({ sub: "1" }) → "eyJ..." (테스트용, 서명 없음)

export interface JwtHeader {
  alg: string;
  typ?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface DecodedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const withPad = pad ? padded + "=".repeat(4 - pad) : padded;
  return atob(withPad);
}

/**
 * JWT 토큰을 디코딩한다 (서명 검증 없음).
 * 프론트엔드에서 페이로드 확인용.
 */
export function decodeJwt(token: string): DecodedJwt {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 parts separated by dots");
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
    return { header, payload, signature: parts[2] };
  } catch {
    throw new Error("Invalid JWT: failed to decode");
  }
}

/**
 * JWT가 만료되었는지 확인한다.
 * exp 클레임이 없으면 false (만료 없음).
 * @param clockSkew 허용 오차 초 (기본: 0)
 */
export function isJwtExpired(token: string, clockSkew: number = 0): boolean {
  const { payload } = decodeJwt(token);
  if (payload.exp === undefined) return false;
  return Date.now() >= (payload.exp + clockSkew) * 1000;
}

/**
 * JWT의 만료 시각을 Date로 반환한다. exp가 없으면 undefined.
 */
export function getJwtExpiration(token: string): Date | undefined {
  const { payload } = decodeJwt(token);
  if (payload.exp === undefined) return undefined;
  return new Date(payload.exp * 1000);
}

/**
 * JWT 만료까지 남은 시간(ms)을 반환한다.
 * 이미 만료면 음수. exp가 없으면 Infinity.
 */
export function getJwtTimeRemaining(token: string): number {
  const { payload } = decodeJwt(token);
  if (payload.exp === undefined) return Infinity;
  return payload.exp * 1000 - Date.now();
}

/**
 * JWT 페이로드에서 특정 클레임을 추출한다.
 */
export function getJwtClaim<T = unknown>(token: string, claim: string): T | undefined {
  const { payload } = decodeJwt(token);
  return payload[claim] as T | undefined;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * 테스트용 mock JWT를 생성한다.
 * 서명은 "mock"으로 고정. 프로덕션에서 사용 금지.
 */
export function createMockJwt(
  payload: JwtPayload,
  header: Partial<JwtHeader> = {},
): string {
  const h = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT", ...header }));
  const p = base64UrlEncode(JSON.stringify(payload));
  return `${h}.${p}.mock`;
}
