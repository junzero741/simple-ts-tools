// 들여쓰기 정규화 (Dedent / Indent Utils).
//
// 템플릿 리터럴이나 코드 생성에서 공통 들여쓰기를 제거하고,
// 지정 레벨로 재들여쓰기한다.
//
// dedent(`
//     hello
//       world
// `) → "hello\n  world"
//
// indent("line1\nline2", 4) → "    line1\n    line2"

/**
 * 모든 줄의 공통 선행 공백을 제거한다.
 * 빈 줄은 공백 계산에서 제외한다.
 */
export function dedent(str: string): string {
  const lines = str.split("\n");

  // 첫 줄이 비어있으면 제거
  if (lines.length > 0 && lines[0].trim() === "") lines.shift();
  // 마지막 줄이 비어있으면 제거
  if (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

  if (lines.length === 0) return "";

  // 공통 들여쓰기 계산 (빈 줄 제외)
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });

  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;

  return lines.map((line) => line.slice(minIndent)).join("\n");
}

/**
 * 모든 줄에 지정된 수의 공백을 추가한다.
 */
export function indent(str: string, spaces: number, char: string = " "): string {
  const prefix = char.repeat(spaces);
  return str
    .split("\n")
    .map((line) => (line.length > 0 ? prefix + line : line))
    .join("\n");
}

/**
 * 들여쓰기를 특정 레벨로 재설정한다 (dedent → indent).
 */
export function reindent(str: string, spaces: number): string {
  return indent(dedent(str), spaces);
}

/**
 * 각 줄의 후행 공백을 제거한다.
 */
export function trimTrailingWhitespace(str: string): string {
  return str
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n");
}

/**
 * 연속된 빈 줄을 최대 n줄로 제한한다.
 */
export function collapseBlankLines(str: string, maxConsecutive: number = 1): string {
  const pattern = new RegExp(`(\\n\\s*){${maxConsecutive + 1},}`, "g");
  const replacement = "\n".repeat(maxConsecutive + 1);
  return str.replace(pattern, replacement);
}
