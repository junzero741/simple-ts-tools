/**
 * 영어 명사의 복수형을 반환한다.
 *
 * @param count    수량
 * @param singular 단수형
 * @param plural   복수형 (생략 시 자동 규칙 적용)
 * @param options  showCount: 숫자를 앞에 붙일지 여부 (기본: true)
 *
 * 자동 복수형 규칙 (plural 미지정 시):
 * 1. s·x·z·ch·sh 로 끝나는 단어 → +es  (bus→buses, watch→watches)
 * 2. 자음+y 로 끝나는 단어      → -y+ies (baby→babies, city→cities)
 *    단, 모음+y 는 그냥 +s       (boy→boys, day→days)
 * 3. 그 외                       → +s
 *
 * 불규칙형(person→people, leaf→leaves 등)은 plural 인자로 직접 지정한다.
 *
 * @example
 * pluralize(1, "result")               // "1 result"
 * pluralize(2, "result")               // "2 results"
 * pluralize(0, "item")                 // "0 items"
 * pluralize(1, "person", "people")     // "1 person"
 * pluralize(2, "person", "people")     // "2 people"
 * pluralize(1, "bus")                  // "1 bus"
 * pluralize(2, "bus")                  // "2 buses"
 * pluralize(2, "city")                 // "2 cities"
 * pluralize(2, "boy")                  // "2 boys"
 * pluralize(2, "result", undefined, { showCount: false }) // "results"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string,
  options: { showCount?: boolean } = {}
): string {
  const { showCount = true } = options;

  const word = count === 1 ? singular : (plural ?? autoPlural(singular));
  return showCount ? `${count} ${word}` : word;
}

/**
 * 영어 자동 복수형 규칙.
 * 불규칙형은 pluralize()의 plural 인자로 직접 전달한다.
 */
export function autoPlural(word: string): string {
  if (word.length === 0) return word;

  // s, x, z, ch, sh → +es
  if (/(?:s|x|z|ch|sh)$/i.test(word)) {
    return word + "es";
  }

  // 자음 + y → -y + ies (baby→babies, city→cities)
  // 모음 + y 는 그냥 +s (boy→boys, day→days)
  if (/[^aeiou]y$/i.test(word)) {
    return word.slice(0, -1) + "ies";
  }

  return word + "s";
}
