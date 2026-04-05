import { describe, expect, it } from "vitest";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToBase64Url,
  decodeBase64,
  decodeBase64Url,
  encodeBase64,
  encodeBase64Url,
  isValidBase64,
} from "./base64";

// ─── encodeBase64 / decodeBase64 ─────────────────────────────────────────────

describe("encodeBase64", () => {
  it("ASCII 문자열을 인코딩한다", () => {
    expect(encodeBase64("Hello, World!")).toBe("SGVsbG8sIFdvcmxkIQ==");
  });

  it("빈 문자열을 인코딩하면 빈 문자열", () => {
    expect(encodeBase64("")).toBe("");
  });

  it("유니코드(한글)를 인코딩한다", () => {
    const encoded = encodeBase64("안녕하세요");
    expect(encoded).toBeTruthy();
    expect(encoded).not.toContain("안");
    // 디코딩 후 복원 가능한지 확인
    expect(decodeBase64(encoded)).toBe("안녕하세요");
  });

  it("이모지를 인코딩한다", () => {
    const encoded = encodeBase64("🎉🚀");
    expect(decodeBase64(encoded)).toBe("🎉🚀");
  });

  it("결과가 유효한 Base64 문자열이다", () => {
    const encoded = encodeBase64("test");
    expect(/^[A-Za-z0-9+/]+=*$/.test(encoded)).toBe(true);
  });
});

describe("decodeBase64", () => {
  it("표준 Base64를 디코딩한다", () => {
    expect(decodeBase64("SGVsbG8sIFdvcmxkIQ==")).toBe("Hello, World!");
  });

  it("패딩 없는 Base64URL도 처리한다", () => {
    // Base64URL 형식 (패딩 없음)
    const encoded = encodeBase64Url("test");
    expect(decodeBase64(encoded)).toBe("test");
  });

  it("빈 문자열을 디코딩하면 빈 문자열", () => {
    expect(decodeBase64("")).toBe("");
  });
});

describe("encodeBase64 ↔ decodeBase64 왕복 변환", () => {
  const cases = [
    "Hello, World!",
    "안녕하세요",
    "🎉🚀✨",
    "Special: <>\"'&",
    "Line1\nLine2\tTabbed",
    "Mixed 한글 and English",
    "123456789",
    " ".repeat(100),
  ];

  for (const input of cases) {
    it(`"${input.slice(0, 20)}" 왕복 변환`, () => {
      expect(decodeBase64(encodeBase64(input))).toBe(input);
    });
  }
});

// ─── encodeBase64Url / decodeBase64Url ───────────────────────────────────────

describe("encodeBase64Url", () => {
  it("패딩(=)이 없다", () => {
    const encoded = encodeBase64Url("Hello");
    expect(encoded).not.toContain("=");
  });

  it("URL-unsafe 문자(+, /)가 없다", () => {
    // 많은 데이터를 처리해 +와 /가 나올 가능성을 높임
    const encoded = encodeBase64Url("Hello+World/Test===padding");
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
  });

  it("URL-safe 문자만 포함한다 (-와 _)", () => {
    const encoded = encodeBase64Url("any string content for encoding");
    expect(/^[A-Za-z0-9\-_]*$/.test(encoded)).toBe(true);
  });

  it("유니코드를 인코딩한다", () => {
    const encoded = encodeBase64Url("안녕");
    expect(decodeBase64Url(encoded)).toBe("안녕");
  });
});

describe("decodeBase64Url", () => {
  it("Base64URL을 디코딩한다", () => {
    expect(decodeBase64Url(encodeBase64Url("Hello, World!"))).toBe("Hello, World!");
  });

  it("패딩 없는 문자열도 처리한다", () => {
    // JWT 페이로드 처럼 패딩 없는 경우
    const payload = { sub: "1234567890", name: "Alice" };
    const encoded = encodeBase64Url(JSON.stringify(payload));
    const decoded = JSON.parse(decodeBase64Url(encoded));
    expect(decoded).toEqual(payload);
  });
});

describe("encodeBase64Url ↔ decodeBase64Url 왕복 변환", () => {
  const cases = [
    "Hello",
    "안녕하세요",
    "🎉",
    '{"sub":"123","exp":9999}',
  ];

  for (const input of cases) {
    it(`"${input.slice(0, 20)}" 왕복 변환`, () => {
      expect(decodeBase64Url(encodeBase64Url(input))).toBe(input);
    });
  }
});

// ─── bytesToBase64 / base64ToBytes ────────────────────────────────────────────

describe("bytesToBase64 / base64ToBytes", () => {
  it("Uint8Array를 Base64로 인코딩한다", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(bytesToBase64(bytes)).toBe("SGVsbG8=");
  });

  it("Base64를 Uint8Array로 디코딩한다", () => {
    const bytes = base64ToBytes("SGVsbG8=");
    expect(bytes).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
  });

  it("빈 배열을 인코딩하면 빈 문자열", () => {
    expect(bytesToBase64(new Uint8Array([]))).toBe("");
  });

  it("빈 문자열을 디코딩하면 빈 배열", () => {
    expect(base64ToBytes("")).toEqual(new Uint8Array([]));
  });

  it("왕복 변환 — Uint8Array", () => {
    const original = new Uint8Array([0, 1, 127, 128, 255]);
    expect(base64ToBytes(bytesToBase64(original))).toEqual(original);
  });

  it("모든 바이트 값(0~255) 처리", () => {
    const all = new Uint8Array(256).map((_, i) => i);
    expect(base64ToBytes(bytesToBase64(all))).toEqual(all);
  });
});

describe("bytesToBase64Url", () => {
  it("URL-safe 문자만 포함한다", () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = bytesToBase64Url(bytes);
    expect(/^[A-Za-z0-9\-_]*$/.test(result)).toBe(true);
    expect(result).not.toContain("=");
  });
});

// ─── isValidBase64 ────────────────────────────────────────────────────────────

describe("isValidBase64", () => {
  it("유효한 Base64 문자열에 true를 반환한다", () => {
    expect(isValidBase64("SGVsbG8=")).toBe(true);
    expect(isValidBase64("SGVsbG8sIFdvcmxkIQ==")).toBe(true);
    expect(isValidBase64("")).toBe(true);
  });

  it("유효한 Base64URL 문자열에 true를 반환한다 (패딩 없음)", () => {
    expect(isValidBase64("SGVsbG8")).toBe(true);
    expect(isValidBase64("eyJzdWIiOiIxMjM0In0")).toBe(true);
  });

  it("유효하지 않은 문자열에 false를 반환한다", () => {
    expect(isValidBase64("not valid base64!")).toBe(false);
    expect(isValidBase64("SGVs$G8=")).toBe(false);
  });
});

// ─── 실사용 시나리오 ──────────────────────────────────────────────────────────

describe("실사용 시나리오", () => {
  it("JWT 페이로드 인코딩·디코딩", () => {
    const payload = {
      sub: "user_123",
      name: "Alice",
      iat: 1700000000,
      exp: 1700086400,
    };

    const encoded = encodeBase64Url(JSON.stringify(payload));
    const decoded = JSON.parse(decodeBase64Url(encoded));

    expect(decoded).toEqual(payload);
    // URL-safe: JWT는 URL 파라미터로 전달되므로 특수문자 없어야 함
    expect(/^[A-Za-z0-9\-_]+$/.test(encoded)).toBe(true);
  });

  it("Data URL 생성 — 바이너리 → Base64 이미지 인라인", () => {
    const fakeImageBytes = new Uint8Array([137, 80, 78, 71]); // PNG 헤더 일부
    const base64 = bytesToBase64(fakeImageBytes);
    const dataUrl = `data:image/png;base64,${base64}`;
    expect(dataUrl).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/);
  });

  it("한글 API 파라미터 Base64URL 인코딩", () => {
    const koreanQuery = "서울 카페 추천";
    const encoded = encodeBase64Url(koreanQuery);

    // URL-safe 확인
    expect(/^[A-Za-z0-9\-_]+$/.test(encoded)).toBe(true);
    // 복원 가능 확인
    expect(decodeBase64Url(encoded)).toBe(koreanQuery);
  });
});
