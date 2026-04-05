import { describe, expect, it } from "vitest";
import { camelToSnake, snakeToCamel } from "./snakeCase";

describe("camelToSnake", () => {
  it("camelCase를 snake_case로 변환한다", () => {
    expect(camelToSnake("backgroundColor")).toBe("background_color");
    expect(camelToSnake("userId")).toBe("user_id");
    expect(camelToSnake("createdAt")).toBe("created_at");
  });

  it("PascalCase를 변환한다", () => {
    expect(camelToSnake("UserProfile")).toBe("user_profile");
    expect(camelToSnake("HttpRequest")).toBe("http_request");
  });

  it("연속된 약어를 올바르게 처리한다", () => {
    expect(camelToSnake("XMLParser")).toBe("xml_parser");
    expect(camelToSnake("getHTTPSResponse")).toBe("get_https_response");
    expect(camelToSnake("parseJSON")).toBe("parse_json");
  });

  it("이미 snake_case이면 그대로 반환한다", () => {
    expect(camelToSnake("background_color")).toBe("background_color");
  });

  it("단일 단어는 소문자로 변환한다", () => {
    expect(camelToSnake("hello")).toBe("hello");
    expect(camelToSnake("Hello")).toBe("hello");
  });

  it("숫자를 포함한 케이스를 처리한다", () => {
    expect(camelToSnake("base64Encode")).toBe("base64_encode");
    expect(camelToSnake("sha256Hash")).toBe("sha256_hash");
  });
});

describe("snakeToCamel", () => {
  it("snake_case를 camelCase로 변환한다", () => {
    expect(snakeToCamel("background_color")).toBe("backgroundColor");
    expect(snakeToCamel("user_id")).toBe("userId");
    expect(snakeToCamel("created_at")).toBe("createdAt");
  });

  it("여러 단어를 처리한다", () => {
    expect(snakeToCamel("get_https_response")).toBe("getHttpsResponse");
    expect(snakeToCamel("first_name_last_name")).toBe("firstNameLastName");
  });

  it("이미 camelCase이면 그대로 반환한다", () => {
    expect(snakeToCamel("alreadyCamel")).toBe("alreadyCamel");
  });

  it("단일 단어는 그대로 반환한다", () => {
    expect(snakeToCamel("hello")).toBe("hello");
  });

  it("mapKeys와 조합해 API 응답 키를 변환한다", () => {
    // 이 패턴은 실제 사용 예를 시뮬레이션
    const snakeKeys = ["user_id", "first_name", "created_at"];
    expect(snakeKeys.map(snakeToCamel)).toEqual(["userId", "firstName", "createdAt"]);
  });
});
