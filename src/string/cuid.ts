// 충돌 없는 정렬 가능 ID 생성 (CUID2 스타일).
//
// UUID보다 짧고, 시간순 정렬 가능하며, 충돌 확률이 극히 낮다.
// DB 기본키, URL slug, 추적 ID 등에 활용.
//
// createCuid()       → "clx9a3f0h0001..."  (24자)
// createCuid(12)     → "clx9a3f0h001"      (12자)
// createNanoId()     → "V1StGXR8_Z5jdHi"   (21자, URL 안전)
// createPrefixedId("usr") → "usr_clx9a3f0h..."

const URL_SAFE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";

function randomChars(length: number, alphabet: string = URL_SAFE): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

let counter = 0;

/**
 * 시간순 정렬 가능한 고유 ID를 생성한다.
 * @param length ID 길이 (기본: 24, 최소: 8)
 */
export function createCuid(length: number = 24): string {
  if (length < 8) throw new Error("length must be at least 8");

  const timestamp = Date.now().toString(36);
  const count = (counter++).toString(36);
  const random = randomChars(length - timestamp.length - count.length, "0123456789abcdefghijklmnopqrstuvwxyz");

  return (timestamp + count + random).slice(0, length);
}

/**
 * URL 안전한 랜덤 ID를 생성한다 (nanoid 호환).
 * @param length ID 길이 (기본: 21)
 */
export function createNanoId(length: number = 21): string {
  return randomChars(length, URL_SAFE);
}

/**
 * 접두사가 붙은 ID를 생성한다.
 * createPrefixedId("usr") → "usr_clx9a3f0h..."
 */
export function createPrefixedId(prefix: string, length: number = 16): string {
  return `${prefix}_${createCuid(length)}`;
}

/**
 * 시간 기반 순차 ID. 같은 밀리초 내에서도 순서 보장.
 * DB insert 순서와 ID 정렬 순서가 일치.
 */
export function createSortableId(): string {
  const time = Date.now().toString(36).padStart(9, "0");
  const seq = (counter++).toString(36).padStart(4, "0");
  const rand = randomChars(4, "0123456789abcdefghijklmnopqrstuvwxyz");
  return `${time}${seq}${rand}`;
}

/**
 * 사람이 읽기 쉬운 짧은 코드를 생성한다 (초대 코드, 인증 코드 등).
 * 혼동 문자(0/O, 1/l/I)를 제외.
 */
export function createHumanCode(length: number = 6): string {
  return randomChars(length, "23456789ABCDEFGHJKLMNPQRSTUVWXYZ");
}
