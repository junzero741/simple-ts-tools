import { describe, expect, it, vi } from "vitest";
import { mapAsync } from "./mapAsync";

describe("mapAsync", () => {
  it("각 요소에 비동기 함수를 적용하고 결과를 반환한다", async () => {
    const result = await mapAsync([1, 2, 3], async (n) => n * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it("index를 두 번째 인자로 전달한다", async () => {
    const result = await mapAsync(["a", "b", "c"], async (v, i) => `${i}:${v}`);
    expect(result).toEqual(["0:a", "1:b", "2:c"]);
  });

  it("빈 배열이면 빈 배열을 반환한다", async () => {
    expect(await mapAsync([], async (v: number) => v)).toEqual([]);
  });

  it("concurrency를 초과하지 않는다", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    await mapAsync(
      [1, 2, 3, 4, 5, 6],
      async (n) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 10));
        concurrent--;
        return n;
      },
      { concurrency: 2 }
    );

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it("결과 순서가 입력 순서와 동일하다", async () => {
    // 처리 시간이 역순으로 걸려도 결과는 입력 순서
    const result = await mapAsync(
      [3, 1, 2],
      async (n) => {
        await new Promise((r) => setTimeout(r, n * 5));
        return n * 10;
      },
      { concurrency: 3 }
    );
    expect(result).toEqual([30, 10, 20]);
  });

  it("concurrency 미지정이면 모두 병렬로 실행한다", async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    await mapAsync([1, 2, 3, 4, 5], async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
    });

    expect(maxConcurrent).toBe(5);
  });

  it("fn이 reject하면 에러를 전파한다", async () => {
    await expect(
      mapAsync([1, 2, 3], async (n) => {
        if (n === 2) throw new Error("fail");
        return n;
      })
    ).rejects.toThrow("fail");
  });

  it("concurrency=0이면 에러를 던진다", async () => {
    await expect(
      mapAsync([1, 2], async (v) => v, { concurrency: 0 })
    ).rejects.toThrow("concurrency must be > 0");
  });
});
