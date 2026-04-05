import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

const now = new Date("2024-06-07T12:00:00Z");
const sec = 1000;
const min = 60 * sec;
const hour = 60 * min;
const day = 24 * hour;

describe("formatRelativeTime (ko)", () => {
  it("45초 미만은 '방금 전'으로 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 10 * sec), now)).toBe("방금 전");
    expect(formatRelativeTime(new Date(now.getTime() - 44 * sec), now)).toBe("방금 전");
  });

  it("분 단위 과거 시간을 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * min), now)).toBe("3분 전");
    expect(formatRelativeTime(new Date(now.getTime() - 45 * min), now)).toBe("45분 전");
  });

  it("시간 단위를 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 2 * hour), now)).toBe("2시간 전");
    expect(formatRelativeTime(new Date(now.getTime() - 20 * hour), now)).toBe("20시간 전");
  });

  it("일 단위를 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 2 * day), now)).toBe("2일 전");
    expect(formatRelativeTime(new Date(now.getTime() - 15 * day), now)).toBe("15일 전");
  });

  it("개월 단위를 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 60 * day), now)).toBe("2개월 전");
  });

  it("년 단위를 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 400 * day), now)).toBe("1년 전");
    expect(formatRelativeTime(new Date(now.getTime() - 800 * day), now)).toBe("2년 전");
  });

  it("미래 시간은 '후'로 표시한다", () => {
    expect(formatRelativeTime(new Date(now.getTime() + 3 * min), now)).toBe("3분 후");
    expect(formatRelativeTime(new Date(now.getTime() + 2 * day), now)).toBe("2일 후");
  });
});

describe("formatRelativeTime (en)", () => {
  it("past times use 'ago'", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 3 * min), now, "en")).toBe("3 minutes ago");
    expect(formatRelativeTime(new Date(now.getTime() - 1 * hour), now, "en")).toBe("1 hour ago");
    expect(formatRelativeTime(new Date(now.getTime() - 2 * day), now, "en")).toBe("2 days ago");
  });

  it("future times use 'in'", () => {
    expect(formatRelativeTime(new Date(now.getTime() + 5 * min), now, "en")).toBe("in 5 minutes");
    expect(formatRelativeTime(new Date(now.getTime() + 1 * day), now, "en")).toBe("in 1 day");
  });

  it("near present is 'just now'", () => {
    expect(formatRelativeTime(new Date(now.getTime() - 5 * sec), now, "en")).toBe("just now");
  });
});
