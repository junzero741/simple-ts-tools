// ─── 타입 ─────────────────────────────────────────────────────────────────────

export interface ParseOptions {
  /**
   * 첫 번째 행을 헤더로 사용할지 여부 (기본: true).
   * true이면 `Record<string, string>[]` 반환,
   * false이면 `string[][]` 반환.
   */
  header?: boolean;
  /** 필드 구분자 (기본: ",") */
  delimiter?: string;
  /** 각 필드의 앞뒤 공백 제거 여부 (기본: true) */
  trim?: boolean;
  /** 빈 행 건너뛰기 여부 (기본: true) */
  skipEmptyLines?: boolean;
}

export interface FormatOptions {
  /** 필드 구분자 (기본: ",") */
  delimiter?: string;
  /**
   * 헤더 행 포함 여부 (기본: true).
   * `Record<string, unknown>[]`를 전달할 때는 항상 포함된다.
   */
  header?: boolean;
  /** 줄 끝 문자 (기본: "\n") */
  lineBreak?: "\n" | "\r\n";
}

// ─── 파싱 ─────────────────────────────────────────────────────────────────────

/**
 * CSV 문자열을 파싱해 레코드 배열로 반환한다 (header: true, 기본값).
 *
 * - RFC 4180 기반: 쌍따옴표로 묶인 필드 안의 쉼표·줄바꿈·이스케이프 따옴표(`""`) 처리
 * - 커스텀 구분자(탭, 세미콜론 등) 지원
 *
 * @example
 * parseCSV(`name,age\nAlice,30\nBob,25`)
 * // [{ name: "Alice", age: "30" }, { name: "Bob", age: "25" }]
 *
 * parseCSV(`a;b\n1;2`, { delimiter: ";" })
 * // [{ a: "1", b: "2" }]
 */
export function parseCSV(
  input: string,
  options: ParseOptions & { header: false }
): string[][];
export function parseCSV(
  input: string,
  options?: ParseOptions & { header?: true }
): Record<string, string>[];
export function parseCSV(
  input: string,
  options?: ParseOptions
): Record<string, string>[] | string[][] {
  const {
    header = true,
    delimiter = ",",
    trim = true,
    skipEmptyLines = true,
  } = options ?? {};

  const rows = parseRows(input, delimiter);

  const processedRows = rows
    .map(row => (trim ? row.map(cell => cell.trim()) : row));

  const filteredRows = skipEmptyLines
    ? processedRows.filter(row => !(row.length === 1 && row[0] === ""))
    : processedRows;

  if (!header) return filteredRows;

  if (filteredRows.length === 0) return [];

  const [headerRow, ...dataRows] = filteredRows;
  return dataRows.map(row =>
    Object.fromEntries(headerRow.map((key, i) => [key, row[i] ?? ""]))
  );
}

/**
 * 레코드 배열 또는 2차원 배열을 CSV 문자열로 변환한다.
 *
 * - 필드에 구분자·줄바꿈·쌍따옴표가 포함되면 자동으로 인용 처리
 * - `Record<string, unknown>[]`를 전달하면 키가 헤더 행이 된다
 *
 * @example
 * formatCSV([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }])
 * // "name,age\nAlice,30\nBob,25"
 *
 * formatCSV([["a", "b"], ["1", "2"]], { header: false })
 * // "a,b\n1,2"
 */
export function formatCSV(
  data: Record<string, unknown>[],
  options?: FormatOptions
): string;
export function formatCSV(
  data: string[][],
  options?: FormatOptions
): string;
export function formatCSV(
  data: Record<string, unknown>[] | string[][],
  options?: FormatOptions
): string {
  const { delimiter = ",", header = true, lineBreak = "\n" } = options ?? {};

  if (data.length === 0) return "";

  const rows: string[][] = [];

  if (isRecordArray(data)) {
    const keys = Object.keys(data[0]);
    if (header) rows.push(keys);
    for (const record of data) {
      rows.push(keys.map(k => String(record[k] ?? "")));
    }
  } else {
    for (const row of data) {
      rows.push(row.map(String));
    }
  }

  return rows
    .map(row => row.map(cell => escapeField(cell, delimiter)).join(delimiter))
    .join(lineBreak);
}

// ─── 내부 유틸 ─────────────────────────────────────────────────────────────────

/** RFC 4180 CSV 행 파서 (quoted field 완전 지원) */
function parseRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  // 줄바꿈 정규화: \r\n → \n
  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // 이스케이프 따옴표 ("") 또는 닫는 따옴표
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (text.slice(i, i + delimiter.length) === delimiter) {
        row.push(field);
        field = "";
        i += delimiter.length;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // 마지막 필드 / 행 처리
  row.push(field);
  if (row.length > 0) rows.push(row);

  return rows;
}

function escapeField(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");
  if (!needsQuoting) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function isRecordArray(
  data: Record<string, unknown>[] | string[][]
): data is Record<string, unknown>[] {
  return data.length > 0 && !Array.isArray(data[0]);
}
