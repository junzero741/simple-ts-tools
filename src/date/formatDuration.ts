export interface FormatDurationOptions {
  /** 출력 로케일. 기본: "ko" */
  locale?: "ko" | "en";
  /**
   * 표시할 최대 단위 수. 기본: 2
   * (예: 3661초 → parts:2이면 "1시간 1분", parts:3이면 "1시간 1분 1초")
   */
  parts?: number;
  /**
   * 0인 단위를 표시할지 여부. 기본: false
   * (예: 3600초, showZero:false → "1시간", showZero:true → "1시간 0분 0초")
   */
  showZero?: boolean;
}

interface UnitDef {
  ms: number;
  ko: string;
  en: string;
}

const UNITS: UnitDef[] = [
  { ms: 24 * 60 * 60 * 1000, ko: "일",  en: "d"  },
  { ms: 60 * 60 * 1000,       ko: "시간", en: "h"  },
  { ms: 60 * 1000,            ko: "분",  en: "m"  },
  { ms: 1000,                 ko: "초",  en: "s"  },
];

/**
 * 밀리초를 사람이 읽기 좋은 시간 문자열로 변환한다.
 *
 * - 기본 2 단위까지 표시 (parts 옵션으로 조정)
 * - 음수는 절댓값으로 처리
 * - 1초 미만은 "< 1초" / "< 1s" 반환
 *
 * @example
 * formatDuration(90_000)               // "1분 30초"
 * formatDuration(3_661_000)            // "1시간 1분"
 * formatDuration(3_661_000, { parts: 3 }) // "1시간 1분 1초"
 * formatDuration(86_400_000)           // "1일"
 * formatDuration(500)                  // "< 1초"
 * formatDuration(90_000, { locale: "en" })  // "1m 30s"
 */
export function formatDuration(ms: number, options: FormatDurationOptions = {}): string {
  const { locale = "ko", parts = 2, showZero = false } = options;
  const absMs = Math.abs(ms);

  if (absMs < 1000) {
    return locale === "en" ? "< 1s" : "< 1초";
  }

  const segments: string[] = [];

  let remaining = absMs;
  for (const unit of UNITS) {
    const value = Math.floor(remaining / unit.ms);
    remaining %= unit.ms;

    if (value > 0 || (showZero && segments.length > 0)) {
      const label = locale === "en" ? unit.en : unit.ko;
      segments.push(locale === "en" ? `${value}${label}` : `${value}${label}`);
    }

    if (segments.length >= parts) break;
  }

  if (segments.length === 0) {
    return locale === "en" ? "< 1s" : "< 1초";
  }

  return segments.join(locale === "en" ? " " : " ");
}
