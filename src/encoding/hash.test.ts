import { describe, it, expect } from "vitest";
import {
  sha256,
  sha384,
  sha512,
  hmacSha256,
  randomBytes,
  randomHex,
  timingSafeEqual,
} from "./hash";

describe("hash", () => {
  describe("sha256", () => {
    it("문자열을 해싱한다", async () => {
      const hash = await sha256("hello");
      expect(hash).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    });

    it("빈 문자열을 해싱한다", async () => {
      const hash = await sha256("");
      expect(hash).toBe(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      );
    });

    it("base64 인코딩", async () => {
      const hash = await sha256("hello", "base64");
      // base64로 인코딩된 SHA-256
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/);
      // hex와 다른 결과
      const hex = await sha256("hello", "hex");
      expect(hash).not.toBe(hex);
    });

    it("Uint8Array 입력", async () => {
      const data = new TextEncoder().encode("hello");
      const hash = await sha256(data);
      expect(hash).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    });

    it("다른 입력은 다른 해시", async () => {
      const a = await sha256("hello");
      const b = await sha256("world");
      expect(a).not.toBe(b);
    });
  });

  describe("sha384", () => {
    it("문자열을 해싱한다", async () => {
      const hash = await sha384("hello");
      expect(hash.length).toBe(96); // 384 / 4
    });
  });

  describe("sha512", () => {
    it("문자열을 해싱한다", async () => {
      const hash = await sha512("hello");
      expect(hash.length).toBe(128); // 512 / 4
    });
  });

  describe("hmacSha256", () => {
    it("HMAC 서명을 생성한다", async () => {
      const sig = await hmacSha256("secret", "message");
      expect(sig.length).toBe(64); // 256 / 4
    });

    it("같은 키와 메시지는 같은 서명", async () => {
      const a = await hmacSha256("key", "data");
      const b = await hmacSha256("key", "data");
      expect(a).toBe(b);
    });

    it("다른 키는 다른 서명", async () => {
      const a = await hmacSha256("key1", "data");
      const b = await hmacSha256("key2", "data");
      expect(a).not.toBe(b);
    });

    it("base64 인코딩", async () => {
      const sig = await hmacSha256("key", "data", "base64");
      expect(sig.length).toBeGreaterThan(0);
      // base64는 [A-Za-z0-9+/=]
      expect(sig).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe("randomBytes", () => {
    it("지정 길이의 바이트를 생성한다", () => {
      const bytes = randomBytes(16);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
    });

    it("호출마다 다른 값을 반환한다", () => {
      const a = randomBytes(16);
      const b = randomBytes(16);
      expect(a).not.toEqual(b);
    });
  });

  describe("randomHex", () => {
    it("hex 문자열을 반환한다", () => {
      const hex = randomHex(16);
      expect(hex.length).toBe(32); // 16 bytes = 32 hex chars
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("timingSafeEqual", () => {
    it("같은 문자열은 true", () => {
      expect(timingSafeEqual("abc", "abc")).toBe(true);
    });

    it("다른 문자열은 false", () => {
      expect(timingSafeEqual("abc", "abd")).toBe(false);
    });

    it("길이가 다르면 false", () => {
      expect(timingSafeEqual("abc", "abcd")).toBe(false);
    });

    it("빈 문자열끼리 true", () => {
      expect(timingSafeEqual("", "")).toBe(true);
    });
  });
});
