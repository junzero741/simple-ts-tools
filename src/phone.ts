/**
 * 전화번호를 하이픈 포맷으로 변환한다.
 * @example formatPhoneNumber("01012345678") // "010-1234-5678"
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const midLen = digits.length === 11 ? 4 : 3;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + midLen)}-${digits.slice(3 + midLen)}`;
}
