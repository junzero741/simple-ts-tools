const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/**
 * 바이트 수를 사람이 읽기 좋은 문자열로 변환한다.
 *
 * @param bytes    변환할 바이트 수 (음수 불가)
 * @param decimals 소수 자릿수 (기본: 2)
 *
 * @example formatBytes(0)              // "0 B"
 * @example formatBytes(1024)           // "1 KB"
 * @example formatBytes(1536)           // "1.5 KB"
 * @example formatBytes(1048576)        // "1 MB"
 * @example formatBytes(1234567, 1)     // "1.2 MB"
 * @complexity Time: O(1) | Space: O(1)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes < 0) throw new Error("bytes must be >= 0");
  if (bytes === 0) return "0 B";

  const k = 1024;
  const d = Math.max(0, decimals);
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    UNITS.length - 1
  );

  const value = bytes / Math.pow(k, i);
  return `${parseFloat(value.toFixed(d))} ${UNITS[i]}`;
}
