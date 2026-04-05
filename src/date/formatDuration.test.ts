import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  describe("기본 (한국어, 2단위)", () => {
    it("1초 미만은 '< 1초'를 반환한다", () => {
      expect(formatDuration(0)).toBe("< 1초");
      expect(formatDuration(500)).toBe("< 1초");
      expect(formatDuration(999)).toBe("< 1초");
    });

    it("초 단위", () => {
      expect(formatDuration(1_000)).toBe("1초");
      expect(formatDuration(30_000)).toBe("30초");
      expect(formatDuration(59_000)).toBe("59초");
    });

    it("분+초 단위 (2 parts)", () => {
      expect(formatDuration(90_000)).toBe("1분 30초");
      expect(formatDuration(60_000)).toBe("1분");
      expect(formatDuration(61_000)).toBe("1분 1초");
    });

    it("시간 단위 (2 parts → 시간+분만 표시)", () => {
      expect(formatDuration(3_600_000)).toBe("1시간");
      expect(formatDuration(3_661_000)).toBe("1시간 1분");
      expect(formatDuration(7_200_000)).toBe("2시간");
    });

    it("일 단위", () => {
      expect(formatDuration(86_400_000)).toBe("1일");
      expect(formatDuration(90_000_000)).toBe("1일 1시간");
    });

    it("음수는 절댓값으로 처리한다", () => {
      expect(formatDuration(-90_000)).toBe("1분 30초");
    });
  });

  describe("parts 옵션", () => {
    it("parts: 1 — 가장 큰 단위만 표시", () => {
      expect(formatDuration(3_661_000, { parts: 1 })).toBe("1시간");
      expect(formatDuration(90_000, { parts: 1 })).toBe("1분");
    });

    it("parts: 3 — 최대 3단위 표시", () => {
      expect(formatDuration(3_661_000, { parts: 3 })).toBe("1시간 1분 1초");
    });

    it("parts: 4 — 일·시간·분·초 모두 표시", () => {
      expect(formatDuration(90_061_000, { parts: 4 })).toBe("1일 1시간 1분 1초");
    });
  });

  describe("영어 locale", () => {
    it("1초 미만은 '< 1s'를 반환한다", () => {
      expect(formatDuration(500, { locale: "en" })).toBe("< 1s");
    });

    it("영어 단위로 출력한다", () => {
      expect(formatDuration(90_000, { locale: "en" })).toBe("1m 30s");
      expect(formatDuration(3_661_000, { locale: "en" })).toBe("1h 1m");
      expect(formatDuration(86_400_000, { locale: "en" })).toBe("1d");
    });

    it("parts 옵션과 조합", () => {
      expect(formatDuration(3_661_000, { locale: "en", parts: 3 })).toBe("1h 1m 1s");
    });
  });

  describe("실사용 시나리오", () => {
    it("동영상 길이 표시", () => {
      expect(formatDuration(5_400_000)).toBe("1시간 30분");       // 1:30
      expect(formatDuration(600_000)).toBe("10분");               // 0:10
      expect(formatDuration(45_000)).toBe("45초");                // 0:00:45
    });

    it("남은 시간(ETA) 표시", () => {
      const etaMs = 7_325_000; // 2시간 2분 5초
      expect(formatDuration(etaMs)).toBe("2시간 2분");
    });

    it("타이머 표시", () => {
      expect(formatDuration(3_000, { parts: 1 })).toBe("3초");
    });
  });
});
