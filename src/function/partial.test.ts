import { describe, expect, it, vi } from "vitest";
import { partial } from "./partial";

describe("partial", () => {
  describe("2인자 함수 — 1개 바인딩", () => {
    it("첫 번째 인자를 바인딩한다", () => {
      const add = (a: number, b: number) => a + b;
      const add10 = partial(add, 10);
      expect(add10(5)).toBe(15);
      expect(add10(0)).toBe(10);
      expect(add10(-3)).toBe(7);
    });

    it("반환된 함수는 여러 번 호출할 수 있다", () => {
      const greet = (greeting: string, name: string) => `${greeting}, ${name}!`;
      const hello = partial(greet, "Hello");
      expect(hello("Alice")).toBe("Hello, Alice!");
      expect(hello("Bob")).toBe("Hello, Bob!");
    });
  });

  describe("3인자 함수", () => {
    it("1개 바인딩 — 나머지 2개는 호출 시 전달", () => {
      const add3 = (a: number, b: number, c: number) => a + b + c;
      const add10 = partial(add3, 10);
      expect(add10(1, 2)).toBe(13);
    });

    it("2개 바인딩 — 나머지 1개는 호출 시 전달", () => {
      const clamp = (min: number, max: number, v: number) =>
        Math.min(Math.max(v, min), max);
      const clamp0to100 = partial(clamp, 0, 100);
      expect(clamp0to100(50)).toBe(50);
      expect(clamp0to100(150)).toBe(100);
      expect(clamp0to100(-10)).toBe(0);
    });
  });

  describe("4인자 함수", () => {
    it("2개 바인딩", () => {
      const fn = (a: string, b: string, c: string, d: string) =>
        `${a}-${b}-${c}-${d}`;
      const bound = partial(fn, "A", "B");
      expect(bound("C", "D")).toBe("A-B-C-D");
    });

    it("3개 바인딩", () => {
      const fn = (a: number, b: number, c: number, d: number) => a + b + c + d;
      const bound = partial(fn, 1, 2, 3);
      expect(bound(4)).toBe(10);
    });
  });

  describe("curry와의 차이", () => {
    it("curry는 한 번에 하나씩, partial은 여러 개를 한 번에 바인딩", () => {
      const multiply = (a: number, b: number, c: number) => a * b * c;

      // partial: 2개를 한 번에 바인딩
      const timesSix = partial(multiply, 2, 3);
      expect(timesSix(5)).toBe(30);
    });
  });

  describe("실사용 시나리오", () => {
    it("Array.map과 함께 사용 — .map()의 콜백 생성", () => {
      const clamp = (min: number, max: number, v: number) =>
        Math.min(Math.max(v, min), max);
      const clampScore = partial(clamp, 0, 100);

      const rawScores = [120, 85, -5, 60, 105];
      expect(rawScores.map(clampScore)).toEqual([100, 85, 0, 60, 100]);
    });

    it("이벤트 핸들러에 설정값 미리 바인딩", () => {
      const handler = vi.fn(
        (eventType: string, payload: unknown) => ({ type: eventType, payload })
      );
      const clickHandler = partial(handler, "click");
      clickHandler({ x: 10, y: 20 });
      expect(handler).toHaveBeenCalledWith("click", { x: 10, y: 20 });
    });

    it("API 호출 함수에 공통 설정 바인딩", () => {
      const request = (
        baseUrl: string,
        headers: Record<string, string>,
        path: string
      ) => ({ url: `${baseUrl}${path}`, headers });

      const apiCall = partial(request, "https://api.example.com", {
        Authorization: "Bearer token",
      });

      const result = apiCall("/users");
      expect(result.url).toBe("https://api.example.com/users");
      expect(result.headers.Authorization).toBe("Bearer token");
    });

    it("formatDate에 포맷을 미리 바인딩 — 동일 포맷 반복 적용", () => {
      // 두 번째 인자 바인딩이 아니라 첫 번째를 바인딩하는 래퍼 예시
      const repeat = (times: number, str: string) => str.repeat(times);
      const doubleStr = partial(repeat, 2);
      expect(["ab", "cd", "ef"].map(doubleStr)).toEqual(["abab", "cdcd", "efef"]);
    });

    it("정렬 기준을 미리 바인딩한 compare 함수", () => {
      const compareBy = (key: string, a: Record<string, number>, b: Record<string, number>) =>
        a[key] - b[key];
      const compareByAge = partial(compareBy, "age");

      const users = [{ age: 30 }, { age: 25 }, { age: 35 }];
      users.sort(compareByAge);
      expect(users.map((u) => u.age)).toEqual([25, 30, 35]);
    });
  });
});
