/**
 * 문자열의 일부를 마스킹 문자로 대체한다.
 *
 * @param str 원본 문자열
 * @param start 마스킹 시작 인덱스 (포함, 기본: 0)
 * @param end 마스킹 끝 인덱스 (미포함, 기본: str.length)
 * @param char 마스킹에 사용할 문자 (기본: "*")
 *
 * @example
 * mask("1234567890", 0, 6)          // "******7890"
 * mask("1234567890", 4, 8)          // "1234****90"
 * mask("1234567890", 0, 6, "#")     // "######7890"
 */
export function mask(str: string, start = 0, end = str.length, char = "*"): string {
  if (!str) return str;
  const s = Math.max(0, Math.min(start, str.length));
  const e = Math.max(s, Math.min(end, str.length));
  return str.slice(0, s) + char.repeat(e - s) + str.slice(e);
}

/**
 * 이메일 주소를 마스킹한다.
 * local 파트의 앞 2자만 보여주고 나머지를 마스킹한다.
 *
 * @example
 * maskEmail("alice@example.com")   // "al***@example.com"
 * maskEmail("ab@test.com")         // "ab@test.com"   — 2자 이하면 그대로
 * maskEmail("a@test.com")          // "a@test.com"
 */
export function maskEmail(email: string): string {
  const atIdx = email.indexOf("@");
  if (atIdx <= 0) return email;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  if (local.length <= 2) return email;
  return local.slice(0, 2) + "*".repeat(local.length - 2) + domain;
}

/**
 * 카드 번호를 마스킹한다. 숫자만 추출 후 앞 12자리를 마스킹하고 마지막 4자리를 보여준다.
 * 4자리씩 하이픈으로 구분해 반환한다.
 *
 * @example
 * maskCard("1234567890123456")      // "****-****-****-3456"
 * maskCard("1234-5678-9012-3456")   // "****-****-****-3456"
 */
export function maskCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return cardNumber;
  const visible = digits.slice(-4);
  const masked = "*".repeat(digits.length - 4) + visible;
  // 4자리씩 그룹화
  return masked.replace(/(.{4})/g, "$1-").replace(/-$/, "");
}

/**
 * 전화번호를 마스킹한다. 숫자만 추출 후 중간 자리를 마스킹한다.
 *
 * - 11자리 (휴대폰): 010-****-1234
 * - 10자리 (지역번호 3자리): 02X-****-1234
 * - 9~10자리 (지역번호 2자리): 02-****-1234
 *
 * @example
 * maskPhone("01012345678")          // "010-****-5678"
 * maskPhone("010-1234-5678")        // "010-****-5678"
 * maskPhone("0212345678")           // "02-****-5678"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    // 010-****-5678
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    // 02-****-5678
    return `02-****-${digits.slice(-4)}`;
  }
  if (digits.length === 10) {
    // 0XX-****-5678
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    // 02-***-5678
    return `02-***-${digits.slice(-4)}`;
  }
  // fallback: 마지막 4자리 제외 마스킹
  return "*".repeat(digits.length - 4) + digits.slice(-4);
}
