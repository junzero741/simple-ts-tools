import { describe, expect, it } from "vitest";
import { buildQueryString, parseQueryString } from "./queryString";

describe("parseQueryString", () => {
  it("기본 키-값 쌍을 파싱한다", () => {
    expect(parseQueryString("page=1&sort=name")).toEqual({
      page: "1",
      sort: "name",
    });
  });

  it("앞의 ? 기호를 허용한다", () => {
    expect(parseQueryString("?page=1&sort=name")).toEqual({
      page: "1",
      sort: "name",
    });
  });

  it("같은 키가 여러 번 등장하면 배열로 반환한다", () => {
    expect(parseQueryString("tags=a&tags=b&tags=c")).toEqual({
      tags: ["a", "b", "c"],
    });
  });

  it("URL 인코딩된 값을 디코딩한다", () => {
    expect(parseQueryString("q=hello%20world")).toEqual({ q: "hello world" });
    expect(parseQueryString("name=홍길동")).toEqual({ name: "홍길동" });
  });

  it("빈 문자열은 빈 객체를 반환한다", () => {
    expect(parseQueryString("")).toEqual({});
    expect(parseQueryString("?")).toEqual({});
  });

  it("단일 키와 배열 키가 혼합된 경우를 처리한다", () => {
    const result = parseQueryString("page=1&tags=a&tags=b");
    expect(result.page).toBe("1");
    expect(result.tags).toEqual(["a", "b"]);
  });
});

describe("buildQueryString", () => {
  it("기본 키-값 쌍을 직렬화한다", () => {
    const result = buildQueryString({ page: 1, sort: "name" });
    expect(result).toContain("page=1");
    expect(result).toContain("sort=name");
  });

  it("배열 값을 키 반복으로 직렬화한다", () => {
    const result = buildQueryString({ tags: ["a", "b", "c"] });
    expect(result).toBe("tags=a&tags=b&tags=c");
  });

  it("null/undefined 값은 제외한다", () => {
    const result = buildQueryString({ page: 1, filter: null, sort: undefined });
    expect(result).toBe("page=1");
  });

  it("배열 안의 null/undefined도 제외한다", () => {
    const result = buildQueryString({ tags: ["a", null, "b", undefined] });
    expect(result).toBe("tags=a&tags=b");
  });

  it("불리언과 숫자를 문자열로 변환한다", () => {
    const result = buildQueryString({ active: true, count: 42 });
    expect(result).toContain("active=true");
    expect(result).toContain("count=42");
  });

  it("빈 객체는 빈 문자열을 반환한다", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("parseQueryString → buildQueryString 왕복이 일관성 있다", () => {
    const original = { page: "1", tags: ["a", "b"] };
    const built = buildQueryString(original);
    const parsed = parseQueryString(built);
    expect(parsed).toEqual(original);
  });
});
