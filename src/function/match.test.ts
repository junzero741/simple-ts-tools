import { describe, it, expect } from "vitest";
import { match } from "./match";

describe("match", () => {
  describe("with — 값 매칭", () => {
    it("정확히 일치하는 값의 핸들러를 실행한다", () => {
      const result = match(2)
        .with(1, () => "one")
        .with(2, () => "two")
        .with(3, () => "three")
        .otherwise(() => "other");

      expect(result).toBe("two");
    });

    it("문자열 매칭", () => {
      const result = match("hello")
        .with("hi", () => 1)
        .with("hello", () => 2)
        .otherwise(() => 0);

      expect(result).toBe(2);
    });

    it("첫 번째 매치를 반환한다", () => {
      const result = match(1)
        .with(1, () => "first")
        .with(1, () => "second")
        .otherwise(() => "none");

      expect(result).toBe("first");
    });
  });

  describe("withMany — 다중 값 매칭", () => {
    it("여러 값 중 하나와 일치하면 핸들러를 실행한다", () => {
      const result = match(3)
        .withMany([1, 2], () => "low")
        .withMany([3, 4], () => "mid")
        .withMany([5, 6], () => "high")
        .otherwise(() => "unknown");

      expect(result).toBe("mid");
    });
  });

  describe("when — 조건 매칭", () => {
    it("조건이 참인 핸들러를 실행한다", () => {
      const result = match(85)
        .when((s) => s >= 90, () => "A")
        .when((s) => s >= 80, () => "B")
        .when((s) => s >= 70, () => "C")
        .otherwise(() => "F");

      expect(result).toBe("B");
    });

    it("입력값을 핸들러에 전달한다", () => {
      const result = match(42)
        .when((n) => n > 0, (n) => `positive: ${n}`)
        .otherwise(() => "non-positive");

      expect(result).toBe("positive: 42");
    });
  });

  describe("with + when 혼합", () => {
    it("with와 when을 섞어 사용한다", () => {
      const result = match(0)
        .with(0, () => "zero")
        .when((n) => n > 0, () => "positive")
        .otherwise(() => "negative");

      expect(result).toBe("zero");
    });
  });

  describe("otherwise", () => {
    it("매치되지 않으면 otherwise를 실행한다", () => {
      const result = match(99)
        .with(1, () => "one")
        .otherwise(() => "default");

      expect(result).toBe("default");
    });

    it("otherwise에 입력값을 전달한다", () => {
      const result = match(42)
        .with(1, () => "one")
        .otherwise((n) => `unknown: ${n}`);

      expect(result).toBe("unknown: 42");
    });
  });

  describe("run", () => {
    it("매치되면 결과를 반환한다", () => {
      const result = match(2)
        .with(2, () => "two")
        .run();

      expect(result).toBe("two");
    });

    it("매치되지 않으면 undefined를 반환한다", () => {
      const result = match(99)
        .with(1, () => "one")
        .run();

      expect(result).toBeUndefined();
    });
  });

  describe("exhaustive", () => {
    it("매치되면 결과를 반환한다", () => {
      const result = match("a")
        .with("a", () => 1)
        .exhaustive();

      expect(result).toBe(1);
    });

    it("매치되지 않으면 에러를 던진다", () => {
      expect(() =>
        match("z")
          .with("a", () => 1)
          .exhaustive(),
      ).toThrow("No pattern matched for value: z");
    });
  });

  describe("실전 패턴", () => {
    it("HTTP 상태 코드 매핑", () => {
      const toMessage = (code: number) =>
        match(code)
          .with(200, () => "OK")
          .with(201, () => "Created")
          .with(204, () => "No Content")
          .withMany([301, 302], () => "Redirect")
          .with(400, () => "Bad Request")
          .with(404, () => "Not Found")
          .when((c) => c >= 500, () => "Server Error")
          .otherwise(() => "Unknown");

      expect(toMessage(200)).toBe("OK");
      expect(toMessage(301)).toBe("Redirect");
      expect(toMessage(503)).toBe("Server Error");
      expect(toMessage(418)).toBe("Unknown");
    });

    it("타입 기반 분기", () => {
      const describe = (val: unknown) =>
        match(typeof val)
          .with("string", () => "문자열")
          .with("number", () => "숫자")
          .with("boolean", () => "불리언")
          .otherwise(() => "기타");

      expect(describe("hi")).toBe("문자열");
      expect(describe(42)).toBe("숫자");
      expect(describe(null)).toBe("기타");
    });
  });
});
