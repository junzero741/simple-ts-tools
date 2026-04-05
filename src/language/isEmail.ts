/**
 * 문자열이 유효한 이메일 형식인지 확인한다.
 *
 * RFC 5322 전체를 구현하지 않고, 실무에서 충분히 통하는 패턴을 사용한다.
 * - 로컬 파트: 영문자·숫자·. _ + - 허용
 * - @ 기호 1개
 * - 도메인: 최소 1개 점 포함, TLD 2자 이상
 *
 * @example isEmail("user@example.com")   // true
 * @example isEmail("user+tag@co.kr")     // true
 * @example isEmail("user@")              // false
 * @example isEmail("@example.com")       // false
 */
export function isEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value);
}
