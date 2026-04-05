import { describe, expect, it } from "vitest";
import { toOrdinal } from "./toOrdinal";

describe("toOrdinal", () => {
  describe("기본 서수", () => {
    it("1 → 1st", () => expect(toOrdinal(1)).toBe("1st"));
    it("2 → 2nd", () => expect(toOrdinal(2)).toBe("2nd"));
    it("3 → 3rd", () => expect(toOrdinal(3)).toBe("3rd"));
    it("4 → 4th", () => expect(toOrdinal(4)).toBe("4th"));
    it("0 → 0th", () => expect(toOrdinal(0)).toBe("0th"));
  });

  describe("10대 예외 (11, 12, 13 → th)", () => {
    it("11 → 11th", () => expect(toOrdinal(11)).toBe("11th"));
    it("12 → 12th", () => expect(toOrdinal(12)).toBe("12th"));
    it("13 → 13th", () => expect(toOrdinal(13)).toBe("13th"));
    it("14 → 14th", () => expect(toOrdinal(14)).toBe("14th"));
  });

  describe("20대 이후", () => {
    it("21 → 21st", () => expect(toOrdinal(21)).toBe("21st"));
    it("22 → 22nd", () => expect(toOrdinal(22)).toBe("22nd"));
    it("23 → 23rd", () => expect(toOrdinal(23)).toBe("23rd"));
    it("24 → 24th", () => expect(toOrdinal(24)).toBe("24th"));
  });

  describe("100대 이상 — 11/12/13 패턴 포함", () => {
    it("101 → 101st", () => expect(toOrdinal(101)).toBe("101st"));
    it("111 → 111th (예외)", () => expect(toOrdinal(111)).toBe("111th"));
    it("112 → 112th (예외)", () => expect(toOrdinal(112)).toBe("112th"));
    it("113 → 113th (예외)", () => expect(toOrdinal(113)).toBe("113th"));
    it("121 → 121st", () => expect(toOrdinal(121)).toBe("121st"));
  });

  describe("큰 수", () => {
    it("1000 → 1000th", () => expect(toOrdinal(1000)).toBe("1000th"));
    it("1001 → 1001st", () => expect(toOrdinal(1001)).toBe("1001st"));
    it("1011 → 1011th", () => expect(toOrdinal(1011)).toBe("1011th"));
  });
});
