import { describe, expect, it } from "vitest";
import { toCamelCase, toPascalCase, toScreamingSnake, toTitleCase } from "./changeCase";

// 테스트에서 사용할 다양한 입력 형식
const INPUTS = {
  space: "hello world",
  kebab: "hello-world",
  snake: "hello_world",
  camel: "helloWorld",
  pascal: "HelloWorld",
  mixed: "hello world-foo_bar",
  upper: "HELLO WORLD",
  single: "hello",
  acronym: "XMLParser",
  multiAcronym: "getHTTPSResponse",
};

describe("toTitleCase", () => {
  it("공백 구분 문자열", () => {
    expect(toTitleCase(INPUTS.space)).toBe("Hello World");
  });
  it("kebab-case", () => {
    expect(toTitleCase(INPUTS.kebab)).toBe("Hello World");
  });
  it("snake_case", () => {
    expect(toTitleCase(INPUTS.snake)).toBe("Hello World");
  });
  it("camelCase", () => {
    expect(toTitleCase(INPUTS.camel)).toBe("Hello World");
  });
  it("PascalCase", () => {
    expect(toTitleCase(INPUTS.pascal)).toBe("Hello World");
  });
  it("혼합 구분자", () => {
    expect(toTitleCase(INPUTS.mixed)).toBe("Hello World Foo Bar");
  });
  it("대문자 입력", () => {
    expect(toTitleCase(INPUTS.upper)).toBe("Hello World");
  });
  it("단일 단어", () => {
    expect(toTitleCase(INPUTS.single)).toBe("Hello");
  });
  it("약어 처리", () => {
    expect(toTitleCase(INPUTS.acronym)).toBe("Xml Parser");
  });
  it("빈 문자열", () => {
    expect(toTitleCase("")).toBe("");
  });
});

describe("toCamelCase", () => {
  it("공백 구분 문자열", () => {
    expect(toCamelCase(INPUTS.space)).toBe("helloWorld");
  });
  it("kebab-case", () => {
    expect(toCamelCase(INPUTS.kebab)).toBe("helloWorld");
  });
  it("snake_case", () => {
    expect(toCamelCase(INPUTS.snake)).toBe("helloWorld");
  });
  it("PascalCase → 첫 글자 소문자", () => {
    expect(toCamelCase(INPUTS.pascal)).toBe("helloWorld");
  });
  it("이미 camelCase", () => {
    expect(toCamelCase(INPUTS.camel)).toBe("helloWorld");
  });
  it("약어 처리 — XMLParser → xmlParser", () => {
    expect(toCamelCase(INPUTS.acronym)).toBe("xmlParser");
  });
  it("복합 약어 — getHTTPSResponse → getHttpsResponse", () => {
    expect(toCamelCase(INPUTS.multiAcronym)).toBe("getHttpsResponse");
  });
  it("혼합 구분자", () => {
    expect(toCamelCase(INPUTS.mixed)).toBe("helloWorldFooBar");
  });
  it("단일 단어", () => {
    expect(toCamelCase(INPUTS.single)).toBe("hello");
  });
  it("빈 문자열", () => {
    expect(toCamelCase("")).toBe("");
  });
  it("get-user-id → getUserId", () => {
    expect(toCamelCase("get-user-id")).toBe("getUserId");
  });
});

describe("toPascalCase", () => {
  it("공백 구분 문자열", () => {
    expect(toPascalCase(INPUTS.space)).toBe("HelloWorld");
  });
  it("kebab-case", () => {
    expect(toPascalCase(INPUTS.kebab)).toBe("HelloWorld");
  });
  it("snake_case", () => {
    expect(toPascalCase(INPUTS.snake)).toBe("HelloWorld");
  });
  it("camelCase → 첫 글자 대문자", () => {
    expect(toPascalCase(INPUTS.camel)).toBe("HelloWorld");
  });
  it("이미 PascalCase", () => {
    expect(toPascalCase(INPUTS.pascal)).toBe("HelloWorld");
  });
  it("약어 처리 — XMLParser → XmlParser", () => {
    expect(toPascalCase(INPUTS.acronym)).toBe("XmlParser");
  });
  it("혼합 구분자", () => {
    expect(toPascalCase(INPUTS.mixed)).toBe("HelloWorldFooBar");
  });
  it("단일 단어", () => {
    expect(toPascalCase(INPUTS.single)).toBe("Hello");
  });
  it("빈 문자열", () => {
    expect(toPascalCase("")).toBe("");
  });
});

describe("toScreamingSnake", () => {
  it("공백 구분 문자열", () => {
    expect(toScreamingSnake(INPUTS.space)).toBe("HELLO_WORLD");
  });
  it("kebab-case", () => {
    expect(toScreamingSnake(INPUTS.kebab)).toBe("HELLO_WORLD");
  });
  it("snake_case", () => {
    expect(toScreamingSnake(INPUTS.snake)).toBe("HELLO_WORLD");
  });
  it("camelCase", () => {
    expect(toScreamingSnake(INPUTS.camel)).toBe("HELLO_WORLD");
  });
  it("PascalCase", () => {
    expect(toScreamingSnake(INPUTS.pascal)).toBe("HELLO_WORLD");
  });
  it("약어 처리 — XMLParser → XML_PARSER", () => {
    expect(toScreamingSnake(INPUTS.acronym)).toBe("XML_PARSER");
  });
  it("혼합 구분자", () => {
    expect(toScreamingSnake(INPUTS.mixed)).toBe("HELLO_WORLD_FOO_BAR");
  });
  it("단일 단어", () => {
    expect(toScreamingSnake(INPUTS.single)).toBe("HELLO");
  });
  it("빈 문자열", () => {
    expect(toScreamingSnake("")).toBe("");
  });
});

describe("실사용 시나리오", () => {
  it("API 응답 필드 → 컴포넌트 prop 이름", () => {
    const apiFields = ["user_id", "first_name", "created_at", "is_active"];
    const propNames = apiFields.map(toCamelCase);
    expect(propNames).toEqual(["userId", "firstName", "createdAt", "isActive"]);
  });

  it("코드 상수명 → 표시 레이블", () => {
    const constants = ["USER_ROLE_ADMIN", "PAYMENT_STATUS_PENDING"];
    const labels = constants.map(toTitleCase);
    expect(labels).toEqual(["User Role Admin", "Payment Status Pending"]);
  });

  it("컴포넌트명 → kebab 태그명은 camelToKebab, 반대는 toPascalCase", () => {
    // "my-button" → "MyButton" 컴포넌트
    expect(toPascalCase("my-button")).toBe("MyButton");
    expect(toPascalCase("data-table-row")).toBe("DataTableRow");
  });

  it("상수 정의 — 어떤 입력이든 SCREAMING_SNAKE 상수명으로", () => {
    expect(toScreamingSnake("max retry count")).toBe("MAX_RETRY_COUNT");
    expect(toScreamingSnake("httpTimeout")).toBe("HTTP_TIMEOUT");
    expect(toScreamingSnake("base-url")).toBe("BASE_URL");
  });

  it("다양한 입력을 단일 케이스로 정규화 — toCamelCase 멱등성", () => {
    // 같은 의미의 다른 형식 → 동일한 camelCase
    const variants = ["user name", "user-name", "user_name", "UserName", "userName"];
    const normalized = variants.map(toCamelCase);
    expect(new Set(normalized).size).toBe(1); // 모두 동일
    expect(normalized[0]).toBe("userName");
  });
});
