import { describe, expect, it } from "vitest";
import { defaults } from "./defaults";

describe("defaults", () => {
  it("target의 undefined 속성을 source로 채운다", () => {
    const result = defaults({ a: 1, b: undefined }, { a: 99, b: 2, c: 3 });
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("target의 기존 값은 유지된다 (undefined가 아닌 경우)", () => {
    const result = defaults({ a: 1, b: 2 }, { a: 99, b: 99 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it("null은 undefined가 아니므로 덮어쓰지 않는다", () => {
    const result = defaults({ a: null }, { a: 42 });
    expect(result.a).toBeNull();
  });

  it("0과 false도 유효한 값이므로 유지된다", () => {
    const result = defaults({ a: 0, b: false }, { a: 10, b: true });
    expect(result.a).toBe(0);
    expect(result.b).toBe(false);
  });

  it("빈 문자열도 유효한 값이므로 유지된다", () => {
    const result = defaults({ a: "" }, { a: "hello" });
    expect(result.a).toBe("");
  });

  it("여러 source를 왼쪽부터 순서대로 적용한다", () => {
    const result = defaults(
      { a: undefined, b: undefined, c: 1 },
      { a: 10, b: 20 },
      { a: 30, b: 40, d: 50 }
    );
    // a: 첫 번째 source의 10 (두 번째 source의 30은 이미 채워졌으므로 무시)
    // b: 첫 번째 source의 20
    // c: target 유지
    // d: 두 번째 source에서 추가
    expect(result).toEqual({ a: 10, b: 20, c: 1, d: 50 });
  });

  it("source가 없으면 target의 복사본을 반환한다", () => {
    const target = { a: 1, b: 2 };
    const result = defaults(target);
    expect(result).toEqual({ a: 1, b: 2 });
    expect(result).not.toBe(target); // 새 객체
  });

  it("원본 target을 변경하지 않는다", () => {
    const target = { a: undefined, b: 2 };
    defaults(target, { a: 99 });
    expect(target.a).toBeUndefined();
  });

  it("deepMerge와의 차이: defaults는 undefined만 채운다", () => {
    // deepMerge: source가 target을 덮어씀
    // defaults: target의 undefined만 source로 채움

    // defaults({ a: 1 }, { a: 2 }) → { a: 1 }  (target 유지)
    expect(defaults({ a: 1 }, { a: 2 })).toEqual({ a: 1 });
  });

  it("실사용: 함수 옵션 기본값 처리", () => {
    interface Options {
      timeout?: number;
      retries?: number;
      verbose?: boolean;
    }
    const DEFAULT_OPTIONS: Required<Options> = {
      timeout: 5000,
      retries: 3,
      verbose: false,
    };

    const userOptions: Options = { timeout: 1000 };
    const merged = defaults(userOptions, DEFAULT_OPTIONS);

    expect(merged.timeout).toBe(1000);   // 사용자 설정 유지
    expect(merged.retries).toBe(3);       // 기본값 채움
    expect(merged.verbose).toBe(false);   // 기본값 채움
  });

  it("실사용: 환경별 설정 오버라이드", () => {
    const prodConfig = { host: "prod.example.com", port: 443, debug: false };
    const devOverride = { host: "localhost", port: undefined, debug: true };

    // devOverride를 base로, prodConfig에서 undefined만 채움
    const config = defaults(devOverride, prodConfig);
    expect(config.host).toBe("localhost");  // devOverride 유지
    expect(config.port).toBe(443);          // prodConfig에서 채움
    expect(config.debug).toBe(true);        // devOverride 유지
  });
});
