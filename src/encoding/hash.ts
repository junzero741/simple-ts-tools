/**
 * Web Crypto 기반 해시/HMAC 유틸.
 *
 * 브라우저와 Node.js 모두에서 동작하는 암호학적 해시 함수.
 * SHA-256/384/512 해시, HMAC 서명, 타이밍 안전 비교를 제공한다.
 *
 * @example
 * await sha256("hello");
 * // "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
 *
 * await hmacSha256("secret-key", "message");
 * // HMAC-SHA256 hex digest
 *
 * @example
 * // 비밀번호 해싱이 아닌, 데이터 무결성 검증/서명용
 * const checksum = await sha256(JSON.stringify(payload));
 *
 * @complexity Time: O(n) 입력 크기. Space: O(1).
 */

const encoder = new TextEncoder();

async function digest(algorithm: string, data: string | Uint8Array): Promise<ArrayBuffer> {
  const input = typeof data === "string" ? encoder.encode(data) : data;
  return crypto.subtle.digest(algorithm, input);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export type HashEncoding = "hex" | "base64";

/** SHA-256 해시. */
export async function sha256(
  data: string | Uint8Array,
  encoding: HashEncoding = "hex",
): Promise<string> {
  const buffer = await digest("SHA-256", data);
  return encoding === "hex" ? bufferToHex(buffer) : bufferToBase64(buffer);
}

/** SHA-384 해시. */
export async function sha384(
  data: string | Uint8Array,
  encoding: HashEncoding = "hex",
): Promise<string> {
  const buffer = await digest("SHA-384", data);
  return encoding === "hex" ? bufferToHex(buffer) : bufferToBase64(buffer);
}

/** SHA-512 해시. */
export async function sha512(
  data: string | Uint8Array,
  encoding: HashEncoding = "hex",
): Promise<string> {
  const buffer = await digest("SHA-512", data);
  return encoding === "hex" ? bufferToHex(buffer) : bufferToBase64(buffer);
}

/** HMAC-SHA256 서명. */
export async function hmacSha256(
  key: string | Uint8Array,
  data: string | Uint8Array,
  encoding: HashEncoding = "hex",
): Promise<string> {
  const keyData = typeof key === "string" ? encoder.encode(key) : key;
  const msgData = typeof data === "string" ? encoder.encode(data) : data;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const buffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  return encoding === "hex" ? bufferToHex(buffer) : bufferToBase64(buffer);
}

/** 암호학적으로 안전한 랜덤 바이트를 생성한다. */
export function randomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

/** 랜덤 바이트를 hex 문자열로 반환한다. */
export function randomHex(length: number): string {
  return bufferToHex(randomBytes(length).buffer);
}

/**
 * 타이밍 안전 문자열 비교.
 * 길이가 다르면 즉시 false를 반환하지만,
 * 같은 길이면 모든 바이트를 비교하여 타이밍 공격을 방지한다.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
