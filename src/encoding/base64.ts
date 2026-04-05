/**
 * Unicode-safe Base64 / Base64URL 인코딩·디코딩.
 *
 * ## 기본 btoa/atob의 문제점
 * - ASCII 범위(0x00~0xFF) 밖 문자(한글, 이모지 등)를 전달하면 `InvalidCharacterError` 발생
 * - URL-safe 변형(Base64URL) 미지원 — JWT, 쿠키, URL 파라미터에 필요
 *
 * ## 이 모듈의 해결책
 * - `TextEncoder`/`TextDecoder`로 UTF-8 바이트 변환 후 인코딩 → 모든 유니코드 지원
 * - `base64url` 함수 제공: `+`→`-`, `/`→`_`, `=` 패딩 제거
 * - 브라우저, Node.js(v16+), Edge Runtime 모두 호환
 */

// ─── Base64 표준 ──────────────────────────────────────────────────────────────

/**
 * 문자열을 Base64로 인코딩한다. 유니코드(한글, 이모지 등)를 안전하게 처리한다.
 *
 * @example
 * encodeBase64("Hello, World!")  // "SGVsbG8sIFdvcmxkIQ=="
 * encodeBase64("안녕하세요")      // "7JWI64WV7ZWY7IS47JqU" (base64url) 아님
 * encodeBase64("🎉")             // "8J+OiQ=="
 */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  return bytesToBase64(bytes);
}

/**
 * Base64 문자열을 디코딩해 원본 문자열을 반환한다.
 * 표준 Base64와 Base64URL 형식을 모두 허용한다.
 *
 * @throws {Error} 유효하지 않은 Base64 문자열인 경우
 *
 * @example
 * decodeBase64("SGVsbG8sIFdvcmxkIQ==")  // "Hello, World!"
 * decodeBase64("7JWI64WV7ZWY7IS47JqU")  // "안녕하세요"
 */
export function decodeBase64(input: string): string {
  const bytes = base64ToBytes(normalizeBase64(input));
  return new TextDecoder().decode(bytes);
}

// ─── Base64URL ────────────────────────────────────────────────────────────────

/**
 * 문자열을 Base64URL로 인코딩한다.
 * Base64URL은 `+`→`-`, `/`→`_` 치환 후 `=` 패딩을 제거한 RFC 4648 §5 형식이다.
 * JWT 헤더/페이로드, URL 파라미터, 쿠키 값에 사용한다.
 *
 * @example
 * encodeBase64Url("Hello+World/Test=")  // 패딩·특수문자 없는 URL-safe 문자열
 * encodeBase64Url("안녕")               // "7JWI64WV"
 *
 * // JWT 페이로드 직접 인코딩
 * const payload = encodeBase64Url(JSON.stringify({ sub: "1234", exp: 9999 }));
 */
export function encodeBase64Url(input: string): string {
  return encodeBase64(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64URL 문자열을 디코딩해 원본 문자열을 반환한다.
 * 패딩(`=`)이 없어도 자동으로 복원해 처리한다.
 *
 * @throws {Error} 유효하지 않은 Base64URL 문자열인 경우
 *
 * @example
 * decodeBase64Url("SGVsbG8")     // "Hello"
 * decodeBase64Url("7JWI64WV")    // "안녕"
 *
 * // JWT 페이로드 디코딩
 * const payload = JSON.parse(decodeBase64Url(jwt.split(".")[1]));
 */
export function decodeBase64Url(input: string): string {
  return decodeBase64(
    input.replace(/-/g, "+").replace(/_/g, "/")
  );
}

// ─── 바이너리 (Uint8Array) 지원 ───────────────────────────────────────────────

/**
 * `Uint8Array` 바이트 배열을 Base64 문자열로 인코딩한다.
 * 이미지 업로드, 파일 전송, 암호화 결과 직렬화에 유용하다.
 *
 * @example
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
 * bytesToBase64(bytes)  // "SGVsbG8="
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 `Uint8Array` 바이트 배열로 디코딩한다.
 *
 * @throws {Error} 유효하지 않은 Base64 문자열인 경우
 *
 * @example
 * base64ToBytes("SGVsbG8=")
 * // Uint8Array [72, 101, 108, 108, 111]
 */
export function base64ToBytes(input: string): Uint8Array {
  const normalized = normalizeBase64(input);
  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new Error(`Invalid Base64 string: "${input.slice(0, 20)}..."`);
  }
}

/**
 * `Uint8Array`를 Base64URL 문자열로 인코딩한다.
 *
 * @example
 * const hash = await crypto.subtle.digest("SHA-256", data);
 * bytesToBase64Url(new Uint8Array(hash))  // URL-safe hash 문자열
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── 유효성 검사 ──────────────────────────────────────────────────────────────

/**
 * 문자열이 유효한 Base64인지 확인한다.
 * Base64URL 형식도 허용한다 (`-`, `_` 포함, 패딩 없음).
 *
 * @example
 * isValidBase64("SGVsbG8=")    // true
 * isValidBase64("SGVsbG8")     // true  (Base64URL — 패딩 없음)
 * isValidBase64("not-valid!")  // false
 */
export function isValidBase64(input: string): boolean {
  // Base64URL → 표준 Base64로 정규화 후 검사
  const normalized = input
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  // 패딩 추가
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return /^[A-Za-z0-9+/]*={0,2}$/.test(padded);
}

// ─── 내부 유틸 ─────────────────────────────────────────────────────────────────

/**
 * Base64URL을 표준 Base64로 정규화하고 누락된 패딩을 복원한다.
 */
function normalizeBase64(input: string): string {
  // Base64URL → Base64 치환
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  // 패딩 복원: 길이가 4의 배수가 되도록
  const pad = s.length % 4;
  if (pad === 2) s += "==";
  else if (pad === 3) s += "=";
  return s;
}
