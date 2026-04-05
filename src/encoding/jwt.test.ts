import { describe, it, expect } from "vitest";
import {
  decodeJwt, isJwtExpired, getJwtExpiration,
  getJwtTimeRemaining, getJwtClaim, createMockJwt,
} from "./jwt";

// 테스트용 JWT 생성 헬퍼
function makeTestToken(payload: Record<string, unknown>): string {
  return createMockJwt(payload);
}

describe("decodeJwt", () => {
  it("JWT를 디코딩한다", () => {
    const token = makeTestToken({ sub: "1234", name: "Alice", iat: 1000000 });
    const decoded = decodeJwt(token);

    expect(decoded.header.alg).toBe("none");
    expect(decoded.header.typ).toBe("JWT");
    expect(decoded.payload.sub).toBe("1234");
    expect(decoded.payload.name).toBe("Alice");
    expect(decoded.signature).toBe("mock");
  });

  it("파트가 3개가 아니면 에러", () => {
    expect(() => decodeJwt("invalid")).toThrow("Invalid JWT");
    expect(() => decodeJwt("a.b")).toThrow("Invalid JWT");
    expect(() => decodeJwt("a.b.c.d")).toThrow("Invalid JWT");
  });

  it("유효하지 않은 Base64면 에러", () => {
    expect(() => decodeJwt("!!!.!!!.!!!")).toThrow();
  });
});

describe("isJwtExpired", () => {
  it("만료되지 않은 토큰", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1시간 후
    const token = makeTestToken({ exp: futureExp });
    expect(isJwtExpired(token)).toBe(false);
  });

  it("만료된 토큰", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1시간 전
    const token = makeTestToken({ exp: pastExp });
    expect(isJwtExpired(token)).toBe(true);
  });

  it("exp가 없으면 만료 안 됨", () => {
    const token = makeTestToken({ sub: "1" });
    expect(isJwtExpired(token)).toBe(false);
  });

  it("clockSkew 허용", () => {
    const justExpired = Math.floor(Date.now() / 1000) - 5; // 5초 전 만료
    const token = makeTestToken({ exp: justExpired });

    expect(isJwtExpired(token, 0)).toBe(true);
    expect(isJwtExpired(token, 10)).toBe(false); // 10초 허용
  });
});

describe("getJwtExpiration", () => {
  it("만료 시각을 Date로 반환한다", () => {
    const exp = 1700000000;
    const token = makeTestToken({ exp });
    const date = getJwtExpiration(token);

    expect(date).toBeInstanceOf(Date);
    expect(date!.getTime()).toBe(exp * 1000);
  });

  it("exp가 없으면 undefined", () => {
    const token = makeTestToken({});
    expect(getJwtExpiration(token)).toBeUndefined();
  });
});

describe("getJwtTimeRemaining", () => {
  it("남은 시간(ms)을 반환한다", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 60; // 60초 후
    const token = makeTestToken({ exp: futureExp });
    const remaining = getJwtTimeRemaining(token);

    expect(remaining).toBeGreaterThan(50_000);
    expect(remaining).toBeLessThanOrEqual(60_000);
  });

  it("만료되면 음수", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 10;
    const token = makeTestToken({ exp: pastExp });
    expect(getJwtTimeRemaining(token)).toBeLessThan(0);
  });

  it("exp 없으면 Infinity", () => {
    const token = makeTestToken({});
    expect(getJwtTimeRemaining(token)).toBe(Infinity);
  });
});

describe("getJwtClaim", () => {
  it("특정 클레임을 추출한다", () => {
    const token = makeTestToken({ sub: "42", role: "admin", perms: [1, 2] });

    expect(getJwtClaim(token, "sub")).toBe("42");
    expect(getJwtClaim(token, "role")).toBe("admin");
    expect(getJwtClaim<number[]>(token, "perms")).toEqual([1, 2]);
  });

  it("없는 클레임은 undefined", () => {
    const token = makeTestToken({});
    expect(getJwtClaim(token, "missing")).toBeUndefined();
  });
});

describe("createMockJwt", () => {
  it("유효한 JWT 형식을 생성한다", () => {
    const token = createMockJwt({ sub: "test", name: "Test User" });
    const parts = token.split(".");

    expect(parts.length).toBe(3);
    expect(parts[2]).toBe("mock");

    // 라운드트립
    const decoded = decodeJwt(token);
    expect(decoded.payload.sub).toBe("test");
    expect(decoded.payload.name).toBe("Test User");
  });

  it("커스텀 헤더", () => {
    const token = createMockJwt({}, { alg: "HS256" });
    expect(decodeJwt(token).header.alg).toBe("HS256");
  });

  it("exp가 있는 mock 토큰", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = createMockJwt({ exp, sub: "1" });

    expect(isJwtExpired(token)).toBe(false);
    expect(getJwtExpiration(token)!.getTime()).toBe(exp * 1000);
  });
});
