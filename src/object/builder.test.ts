import { describe, it, expect, vi } from "vitest";
import { createBuilder } from "./builder";

type Config = {
  host: string;
  port: number;
  ssl: boolean;
};

describe("createBuilder", () => {
  it("set으로 값을 설정하고 build한다", () => {
    const config = createBuilder<Config>()
      .set("host", "localhost")
      .set("port", 8080)
      .set("ssl", false)
      .build();

    expect(config).toEqual({ host: "localhost", port: 8080, ssl: false });
  });

  it("기본값을 지정할 수 있다", () => {
    const config = createBuilder<Config>({ port: 3000, ssl: true })
      .set("host", "api.example.com")
      .build();

    expect(config).toEqual({ host: "api.example.com", port: 3000, ssl: true });
  });

  it("같은 키를 덮어쓴다", () => {
    const config = createBuilder<Config>()
      .set("host", "first")
      .set("port", 80)
      .set("ssl", false)
      .set("host", "second")
      .build();

    expect(config.host).toBe("second");
  });

  it("setIf — 조건이 참일 때만 설정한다", () => {
    const config = createBuilder<Config>()
      .set("host", "localhost")
      .set("port", 80)
      .set("ssl", false)
      .setIf(true, "ssl", true)
      .setIf(false, "port", 443)
      .build();

    expect(config.ssl).toBe(true);
    expect(config.port).toBe(80);
  });

  it("merge — 여러 키를 한 번에 설정한다", () => {
    const config = createBuilder<Config>()
      .merge({ host: "localhost", port: 8080 })
      .set("ssl", false)
      .build();

    expect(config).toEqual({ host: "localhost", port: 8080, ssl: false });
  });

  it("merge — 기존 값을 덮어쓴다", () => {
    const config = createBuilder<Config>({ host: "old", port: 80, ssl: false })
      .merge({ host: "new", port: 443 })
      .build();

    expect(config.host).toBe("new");
    expect(config.port).toBe(443);
    expect(config.ssl).toBe(false);
  });

  it("tap — 현재 상태를 확인한다", () => {
    const spy = vi.fn();

    createBuilder<Config>()
      .set("host", "localhost")
      .set("port", 80)
      .tap(spy)
      .set("ssl", true)
      .build();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ host: "localhost", port: 80 }),
    );
  });

  it("partial — 현재까지의 부분 객체를 반환한다", () => {
    const partial = createBuilder<Config>()
      .set("host", "localhost")
      .partial();

    expect(partial).toEqual({ host: "localhost" });
  });

  it("build는 원본에 영향을 주지 않는다 (불변)", () => {
    const builder = createBuilder<Config>()
      .set("host", "localhost")
      .set("port", 80)
      .set("ssl", false);

    const config1 = builder.build();
    const config2 = builder.build();

    config1.host = "modified";
    expect(config2.host).toBe("localhost");
  });

  it("체이닝이 유연하게 동작한다", () => {
    type Complex = {
      name: string;
      tags: string[];
      nested: { x: number };
      optional?: string;
    };

    const result = createBuilder<Complex>()
      .set("name", "test")
      .set("tags", ["a", "b"])
      .set("nested", { x: 42 })
      .build();

    expect(result).toEqual({
      name: "test",
      tags: ["a", "b"],
      nested: { x: 42 },
    });
  });
});
