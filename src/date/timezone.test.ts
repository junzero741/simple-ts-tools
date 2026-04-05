import { describe, it, expect } from "vitest";
import {
  toTimezone, getTimezoneOffset, timeDifference,
  nowIn, isDST, getTimezoneAbbr, worldClock,
} from "./timezone";

describe("toTimezone", () => {
  it("Date를 특정 타임존으로 포맷한다", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const seoul = toTimezone(date, "Asia/Seoul");

    // UTC+9이므로 21시
    expect(seoul).toContain("21");
    expect(seoul).toContain("2024");
  });

  it("다른 타임존", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const tokyo = toTimezone(date, "Asia/Tokyo");
    expect(tokyo).toContain("21"); // UTC+9
  });
});

describe("getTimezoneOffset", () => {
  it("타임존 오프셋을 분으로 반환한다", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    expect(getTimezoneOffset("Asia/Seoul", date)).toBe(540); // UTC+9
    expect(getTimezoneOffset("UTC", date)).toBe(0);
  });

  it("음수 오프셋", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const offset = getTimezoneOffset("America/New_York", date);
    expect(offset).toBeLessThan(0); // UTC-5 또는 UTC-4
  });
});

describe("timeDifference", () => {
  it("두 타임존 간 시간 차이를 반환한다", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const diff = timeDifference("Asia/Seoul", "UTC", date);
    expect(diff).toBe(9);
  });

  it("서울 - 뉴욕 = 13~14시간", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const diff = timeDifference("Asia/Seoul", "America/New_York", date);
    expect(diff).toBeGreaterThanOrEqual(13);
    expect(diff).toBeLessThanOrEqual(14);
  });
});

describe("nowIn", () => {
  it("특정 타임존의 현재 시각을 반환한다", () => {
    const seoulNow = nowIn("Asia/Seoul");
    expect(seoulNow).toBeInstanceOf(Date);
    // Date 객체가 유효한지만 확인
    expect(seoulNow.getTime()).not.toBeNaN();
  });
});

describe("isDST", () => {
  it("DST 없는 타임존은 항상 false", () => {
    // 한국/일본은 DST 없음
    expect(isDST("Asia/Seoul")).toBe(false);
    expect(isDST("Asia/Tokyo")).toBe(false);
  });

  it("미국 타임존은 여름에 DST", () => {
    const summer = new Date("2024-07-15T12:00:00Z");
    const winter = new Date("2024-01-15T12:00:00Z");

    expect(isDST("America/New_York", summer)).toBe(true);
    expect(isDST("America/New_York", winter)).toBe(false);
  });
});

describe("getTimezoneAbbr", () => {
  it("타임존 약어를 반환한다", () => {
    const winter = new Date("2024-01-15T12:00:00Z");
    const abbr = getTimezoneAbbr("America/New_York", winter);
    expect(abbr).toBe("EST");
  });

  it("여름에는 DST 약어", () => {
    const summer = new Date("2024-07-15T12:00:00Z");
    expect(getTimezoneAbbr("America/New_York", summer)).toBe("EDT");
  });
});

describe("worldClock", () => {
  it("여러 타임존의 시각을 반환한다", () => {
    const date = new Date("2024-06-15T12:00:00Z");
    const clocks = worldClock(
      ["Asia/Seoul", "America/New_York", "Europe/London"],
      date,
    );

    expect(clocks.length).toBe(3);
    expect(clocks[0].timezone).toBe("Asia/Seoul");
    expect(clocks[0].abbr).toBeTruthy();
    expect(clocks[0].time).toContain("2024");
    expect(typeof clocks[0].offset).toBe("number");
  });

  it("빈 배열이면 빈 결과", () => {
    expect(worldClock([])).toEqual([]);
  });
});
