import { describe, it, expect, vi } from "vitest";
import { createPipeline } from "./pipeline";

describe("createPipeline", () => {
  describe("pipe — 동기", () => {
    it("스텝을 순서대로 실행한다", () => {
      const result = createPipeline<string>()
        .pipe("trim", (s) => s.trim())
        .pipe("upper", (s) => s.toUpperCase())
        .executeSync("  hello  ");

      expect(result).toEqual({
        ok: true,
        value: "HELLO",
        steps: ["trim", "upper"],
      });
    });

    it("타입을 변환한다", () => {
      const result = createPipeline<string>()
        .pipe("parse", (s) => parseInt(s, 10))
        .pipe("double", (n) => n * 2)
        .pipe("toString", (n) => `result: ${n}`)
        .executeSync("21");

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("result: 42");
    });
  });

  describe("pipe — 비동기", () => {
    it("async 스텝을 실행한다", async () => {
      const result = await createPipeline<number>()
        .pipe("fetch", async (n) => {
          await new Promise((r) => setTimeout(r, 5));
          return n * 10;
        })
        .pipe("format", (n) => `$${n}`)
        .execute(5);

      expect(result).toEqual({
        ok: true,
        value: "$50",
        steps: ["fetch", "format"],
      });
    });
  });

  describe("pipeIf", () => {
    it("조건이 true면 실행한다", () => {
      const result = createPipeline<string>()
        .pipe("trim", (s) => s.trim())
        .pipeIf(true, "prefix", (s) => `PREFIX_${s}`)
        .executeSync("  hi  ");

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("PREFIX_hi");
    });

    it("조건이 false면 건너뛴다", () => {
      const result = createPipeline<string>()
        .pipe("trim", (s) => s.trim())
        .pipeIf(false, "prefix", (s) => `PREFIX_${s}`)
        .executeSync("  hi  ");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hi");
        expect(result.steps).toEqual(["trim"]);
      }
    });

    it("함수 조건을 지원한다", () => {
      const result = createPipeline<number>()
        .pipeIf((n) => n > 10, "cap", () => 10)
        .executeSync(5);

      if (result.ok) expect(result.value).toBe(5);

      const result2 = createPipeline<number>()
        .pipeIf((n) => n > 10, "cap", () => 10)
        .executeSync(20);

      if (result2.ok) expect(result2.value).toBe(10);
    });
  });

  describe("tap", () => {
    it("부수 효과를 실행하되 값을 변경하지 않는다", () => {
      const side: string[] = [];
      const result = createPipeline<string>()
        .pipe("upper", (s) => s.toUpperCase())
        .tap("log", (s) => { side.push(s); })
        .pipe("exclaim", (s) => `${s}!`)
        .executeSync("hello");

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toBe("HELLO!");
      expect(side).toEqual(["HELLO"]);
    });
  });

  describe("에러 핸들링", () => {
    it("스텝 실패 시 에러 정보를 반환한다", () => {
      const result = createPipeline<string>()
        .pipe("step1", (s) => s.toUpperCase())
        .pipe("step2", () => { throw new Error("boom"); })
        .pipe("step3", (s) => s)
        .executeSync("hi");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failedStep).toBe("step2");
        expect((result.error as Error).message).toBe("boom");
        expect(result.steps).toEqual(["step1", "step2"]);
      }
    });

    it("async 에러도 잡는다", async () => {
      const result = await createPipeline<string>()
        .pipe("fail", async () => { throw new Error("async boom"); })
        .execute("hi");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.failedStep).toBe("fail");
    });
  });

  describe("stepNames", () => {
    it("등록된 스텝 이름을 반환한다", () => {
      const p = createPipeline<string>()
        .pipe("a", (s) => s)
        .pipeIf(true, "b", (s) => s)
        .tap("c", () => {});

      expect(p.stepNames).toEqual(["a", "b", "c"]);
    });
  });

  describe("빈 파이프라인", () => {
    it("입력을 그대로 반환한다", () => {
      const result = createPipeline<number>().executeSync(42);
      expect(result).toEqual({ ok: true, value: 42, steps: [] });
    });
  });

  describe("실전 시나리오", () => {
    it("ETL 파이프라인", async () => {
      type Row = { name: string; age: string };
      type User = { name: string; age: number; active: boolean };

      const result = await createPipeline<Row[]>()
        .pipe("parse age", (rows) => rows.map((r) => ({ ...r, age: parseInt(r.age, 10) })))
        .pipe("filter valid", (rows) => rows.filter((r) => !isNaN(r.age)))
        .pipe("add flag", (rows) => rows.map((r) => ({ ...r, active: r.age >= 18 })))
        .execute([
          { name: "Alice", age: "30" },
          { name: "Bob", age: "invalid" },
          { name: "Charlie", age: "16" },
        ]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([
          { name: "Alice", age: 30, active: true },
          { name: "Charlie", age: 16, active: false },
        ]);
        expect(result.steps).toEqual(["parse age", "filter valid", "add flag"]);
      }
    });
  });
});
