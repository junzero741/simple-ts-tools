export interface SlugifyOptions {
  /** 단어 구분자 (기본: "-") */
  separator?: string;
  /** 소문자 변환 여부 (기본: true) */
  lowercase?: boolean;
}

/**
 * 문자열을 URL-safe 슬러그로 변환한다.
 *
 * - 유니코드 발음 기호(악센트) 제거: é → e, ü → u
 * - 공백·밑줄·하이픈 → separator
 * - 특수 문자 제거
 * - 앞뒤 separator trim
 */
export function slugify(str: string, options: SlugifyOptions = {}): string {
  const { separator = "-", lowercase = true } = options;

  let result = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // 결합 발음 기호 제거 (e + ́ → e)
    .replace(/[^\w\s-]/g, " ")         // 단어 문자·공백·하이픈 외 제거
    .trim()
    .replace(/[\s_-]+/g, separator)    // 공백·밑줄·하이픈을 separator로 통합
    .replace(new RegExp(`^${escapeRegex(separator)}|${escapeRegex(separator)}$`, "g"), ""); // 앞뒤 trim

  return lowercase ? result.toLowerCase() : result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
