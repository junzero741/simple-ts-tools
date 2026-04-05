/**
 * 숫자에 영어 서수 접미사를 붙여 반환한다.
 *
 * - 11, 12, 13은 예외: "11th", "12th", "13th" (111, 112... 포함)
 * - 나머지는 끝자리 기준: 1→st, 2→nd, 3→rd, 나머지→th
 *
 * @example
 * toOrdinal(1)   // "1st"
 * toOrdinal(2)   // "2nd"
 * toOrdinal(3)   // "3rd"
 * toOrdinal(4)   // "4th"
 * toOrdinal(11)  // "11th"
 * toOrdinal(21)  // "21st"
 * toOrdinal(101) // "101st"
 * toOrdinal(112) // "112th"
 */
export function toOrdinal(n: number): string {
  const abs = Math.abs(Math.floor(n));
  const lastTwo = abs % 100;
  const lastOne = abs % 10;

  // 11, 12, 13 예외 처리 (112, 213... 포함)
  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${n}th`;
  }

  switch (lastOne) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
