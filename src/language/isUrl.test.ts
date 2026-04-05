import { describe, expect, it } from "vitest";
import { isUrl } from "./isUrl";

describe("isUrl", () => {
  it("유효한 http/https URL을 true로 판별한다", () => {
    expect(isUrl("https://example.com")).toBe(true);
    expect(isUrl("http://example.com")).toBe(true);
    expect(isUrl("https://sub.domain.example.com/path?q=1#hash")).toBe(true);
    expect(isUrl("https://example.com:8080/api")).toBe(true);
  });

  it("유효하지 않은 문자열을 false로 판별한다", () => {
    expect(isUrl("not a url")).toBe(false);
    expect(isUrl("example.com")).toBe(false);      // 프로토콜 없음
    expect(isUrl("")).toBe(false);
    expect(isUrl("://missing-protocol.com")).toBe(false);
  });

  it("기본 허용 프로토콜은 http/https만 허용한다", () => {
    expect(isUrl("ftp://files.example.com")).toBe(false);
    expect(isUrl("javascript:alert(1)")).toBe(false);
    expect(isUrl("file:///local/file")).toBe(false);
  });

  it("allowedProtocols로 허용 프로토콜을 지정할 수 있다", () => {
    expect(isUrl("ftp://files.example.com", ["ftp:"])).toBe(true);
    expect(isUrl("https://example.com", ["ftp:"])).toBe(false);
    expect(isUrl("ws://localhost:3000", ["ws:", "wss:"])).toBe(true);
  });

  it("localhost URL을 허용한다", () => {
    expect(isUrl("http://localhost:3000")).toBe(true);
    expect(isUrl("https://localhost")).toBe(true);
  });
});
