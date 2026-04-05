import { describe, it, expect, vi } from "vitest";
import { createTaskRunner } from "./taskRunner";

describe("createTaskRunner", () => {
  it("독립 태스크를 실행한다", async () => {
    const runner = createTaskRunner()
      .add("a", [], () => 1)
      .add("b", [], () => 2);

    const results = await runner.run();
    expect(results).toEqual({ a: 1, b: 2 });
  });

  it("의존성 순서대로 실행한다", async () => {
    const order: string[] = [];

    const runner = createTaskRunner()
      .add("first", [], () => { order.push("first"); return 1; })
      .add("second", ["first"], () => { order.push("second"); return 2; })
      .add("third", ["second"], () => { order.push("third"); return 3; });

    await runner.run();
    expect(order).toEqual(["first", "second", "third"]);
  });

  it("의존 태스크의 결과를 받는다", async () => {
    const runner = createTaskRunner()
      .add("x", [], () => 10)
      .add("y", [], () => 20)
      .add("sum", ["x", "y"], (r) => (r.x as number) + (r.y as number));

    const results = await runner.run();
    expect(results.sum).toBe(30);
  });

  it("독립 태스크를 병렬 실행한다", async () => {
    let maxConcurrent = 0;
    let concurrent = 0;

    const work = async (name: string) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent--;
      return name;
    };

    const runner = createTaskRunner()
      .add("a", [], () => work("a"))
      .add("b", [], () => work("b"))
      .add("c", [], () => work("c"))
      .add("merge", ["a", "b", "c"], (r) => [r.a, r.b, r.c]);

    const results = await runner.run();
    expect(maxConcurrent).toBe(3);
    expect(results.merge).toEqual(["a", "b", "c"]);
  });

  it("async 태스크를 지원한다", async () => {
    const runner = createTaskRunner()
      .add("delayed", [], async () => {
        await new Promise((r) => setTimeout(r, 10));
        return "done";
      });

    const results = await runner.run();
    expect(results.delayed).toBe("done");
  });

  it("순환 의존성을 감지한다", async () => {
    const runner = createTaskRunner()
      .add("a", ["b"], () => 1)
      .add("b", ["a"], () => 2);

    await expect(runner.run()).rejects.toThrow("Circular dependency");
  });

  it("존재하지 않는 의존성을 감지한다", async () => {
    const runner = createTaskRunner()
      .add("a", ["missing"], () => 1);

    await expect(runner.run()).rejects.toThrow('depends on unknown task "missing"');
  });

  it("중복 태스크 이름을 감지한다", () => {
    const runner = createTaskRunner().add("a", [], () => 1);
    expect(() => runner.add("a", [], () => 2)).toThrow('Task "a" already exists');
  });

  it("tasks — 등록된 태스크 이름 목록", () => {
    const runner = createTaskRunner()
      .add("x", [], () => 1)
      .add("y", [], () => 2);

    expect(runner.tasks).toEqual(["x", "y"]);
  });

  it("다이아몬드 의존성을 올바르게 처리한다", async () => {
    //     A
    //    / \
    //   B   C
    //    \ /
    //     D
    const order: string[] = [];

    const runner = createTaskRunner()
      .add("a", [], () => { order.push("a"); return "A"; })
      .add("b", ["a"], () => { order.push("b"); return "B"; })
      .add("c", ["a"], () => { order.push("c"); return "C"; })
      .add("d", ["b", "c"], (r) => { order.push("d"); return `${r.b}+${r.c}`; });

    const results = await runner.run();
    expect(order.indexOf("a")).toBe(0);
    expect(order.indexOf("d")).toBe(3);
    expect(results.d).toBe("B+C");
  });

  it("태스크 실패 시 에러를 전파한다", async () => {
    const runner = createTaskRunner()
      .add("ok", [], () => 1)
      .add("fail", ["ok"], () => { throw new Error("boom"); })
      .add("after", ["fail"], () => 3);

    await expect(runner.run()).rejects.toThrow("boom");
  });

  it("빈 러너를 실행하면 빈 결과를 반환한다", async () => {
    const results = await createTaskRunner().run();
    expect(results).toEqual({});
  });
});
