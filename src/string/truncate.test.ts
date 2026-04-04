import { describe, expect, it } from "vitest";
import { truncate } from "./truncate";

describe("truncate", () => {
  it("maxLength 이하면 그대로 반환한다", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("maxLength 초과 시 suffix(…)를 포함해 잘라낸다", () => {
    expect(truncate("Hello, World!", 8)).toBe("Hello, …");
  });

  it("커스텀 suffix를 사용할 수 있다", () => {
    expect(truncate("Hello, World!", 8, "...")).toBe("Hello...");
  });

  it("suffix 길이만큼만 남길 수 있다", () => {
    expect(truncate("Hello", 1, "…")).toBe("…");
  });

  it("maxLength가 suffix보다 짧으면 에러를 던진다", () => {
    expect(() => truncate("Hello", 0, "…")).toThrow();
  });

  it("빈 문자열은 그대로 반환한다", () => {
    expect(truncate("", 5)).toBe("");
  });
});
