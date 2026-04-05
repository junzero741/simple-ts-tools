/**
 * 암호학적으로 안전한 랜덤 ID를 생성한다.
 * `crypto.getRandomValues()`를 사용해 Math.random() 기반 구현보다 충돌 위험이 현저히 낮다.
 *
 * - 기본: 21자, URL-safe 문자셋 (`A-Za-z0-9_-`)
 * - 길이와 문자셋을 커스터마이징할 수 있다
 * - 브라우저 / Node.js (v15+) / Edge Runtime 모두 지원
 *
 * @example
 * createId()
 * // "V1StGXR8_Z5jdHi6B-myT"  (21자, URL-safe)
 *
 * createId({ length: 10 })
 * // "K7xQpL3mNw"
 *
 * createId({ length: 8, alphabet: "0123456789abcdef" })
 * // "3f9a1c2e"  (hex ID)
 *
 * createId({ length: 12, alphabet: "0123456789" })
 * // "847392016253"  (숫자만)
 *
 * @complexity Time: O(length) | Space: O(length)
 */

const URL_SAFE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

export interface CreateIdOptions {
  /** 생성할 ID 길이 (기본: 21) */
  length?: number;
  /**
   * 사용할 문자 집합 (기본: URL-safe 64자 `A-Za-z0-9_-`).
   * 길이는 1~256 사이여야 한다.
   */
  alphabet?: string;
}

export function createId(options: CreateIdOptions = {}): string {
  const { length = 21, alphabet = URL_SAFE_ALPHABET } = options;

  if (length < 1 || !Number.isInteger(length)) {
    throw new RangeError("length must be a positive integer");
  }
  if (alphabet.length < 1 || alphabet.length > 256) {
    throw new RangeError("alphabet length must be between 1 and 256");
  }

  // 균일 분포를 보장하기 위해 거부 샘플링(rejection sampling) 사용.
  // alphabetSize가 256의 약수가 아니면 단순 모듈로는 편향이 생긴다.
  const alphabetSize = alphabet.length;
  // 편향 없이 사용할 수 있는 바이트 범위의 최대값
  const mask = (1 << Math.ceil(Math.log2(alphabetSize))) - 1;

  const bytes = new Uint8Array(length * 2); // 넉넉히 할당 (거부 샘플링 여유분)
  let result = "";

  while (result.length < length) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const byte = bytes[i] & mask;
      if (byte < alphabetSize) {
        result += alphabet[byte];
      }
    }
  }

  return result;
}

/**
 * UUID v4 형식의 ID를 생성한다 (`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`).
 * 표준 UUID가 필요한 경우(DB primary key, 외부 API 연동 등)에 사용한다.
 *
 * @example
 * createUUID()
 * // "550e8400-e29b-41d4-a716-446655440000"
 *
 * @complexity Time: O(1) | Space: O(1)
 */
export function createUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // RFC 4122 §4.4: version 4 및 variant 비트 설정
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
