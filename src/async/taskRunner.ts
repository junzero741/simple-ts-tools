/**
 * 의존성 기반 태스크 실행기 (DAG Task Runner).
 *
 * 태스크 간 의존 관계를 정의하고, 의존성이 충족된 태스크부터
 * 최대 병렬로 실행한다. 빌드 시스템, 데이터 파이프라인,
 * 마이그레이션 스크립트 등에 활용된다.
 *
 * @example
 * const runner = createTaskRunner();
 *
 * runner.add("fetch",    [], async () => await fetchData());
 * runner.add("parse",    ["fetch"], async (results) => parse(results.fetch));
 * runner.add("validate", ["parse"], async (results) => validate(results.parse));
 * runner.add("save",     ["validate"], async (results) => save(results.validate));
 * runner.add("notify",   ["save"], async () => sendNotification());
 *
 * const results = await runner.run();
 * // 의존성이 없는 태스크는 병렬 실행, 있는 것은 순서 보장
 *
 * @example
 * // 병렬 독립 태스크
 * runner.add("users", [], () => fetchUsers());
 * runner.add("products", [], () => fetchProducts());
 * runner.add("merge", ["users", "products"], (r) => merge(r.users, r.products));
 * // users, products 병렬 실행 → 둘 다 완료 후 merge 실행
 *
 * @complexity Time: O(V + E) 토폴로지 정렬, V = 태스크 수, E = 의존성 수.
 */

export interface TaskDef<TResults extends Record<string, unknown> = Record<string, unknown>> {
  name: string;
  deps: string[];
  fn: (results: TResults) => unknown | Promise<unknown>;
}

export interface TaskRunnerResult {
  [taskName: string]: unknown;
}

export interface TaskRunner {
  /** 태스크를 등록한다. */
  add<T = unknown>(
    name: string,
    deps: string[],
    fn: (results: TaskRunnerResult) => T | Promise<T>,
  ): TaskRunner;

  /** 모든 태스크를 의존성 순서대로 실행한다. */
  run(): Promise<TaskRunnerResult>;

  /** 등록된 태스크 이름 목록 */
  readonly tasks: string[];
}

export function createTaskRunner(): TaskRunner {
  const defs = new Map<string, TaskDef>();

  const runner: TaskRunner = {
    add(name, deps, fn) {
      if (defs.has(name)) throw new Error(`Task "${name}" already exists`);
      defs.set(name, { name, deps, fn });
      return runner;
    },

    async run(): Promise<TaskRunnerResult> {
      // 의존성 검증
      for (const [name, def] of defs) {
        for (const dep of def.deps) {
          if (!defs.has(dep)) {
            throw new Error(`Task "${name}" depends on unknown task "${dep}"`);
          }
        }
      }

      // 순환 의존성 검사 (DFS)
      const visited = new Set<string>();
      const visiting = new Set<string>();

      function detectCycle(name: string): void {
        if (visiting.has(name)) {
          throw new Error(`Circular dependency detected involving task "${name}"`);
        }
        if (visited.has(name)) return;
        visiting.add(name);
        for (const dep of defs.get(name)!.deps) {
          detectCycle(dep);
        }
        visiting.delete(name);
        visited.add(name);
      }

      for (const name of defs.keys()) {
        detectCycle(name);
      }

      // 실행
      const results: TaskRunnerResult = {};
      const completed = new Set<string>();
      const running = new Map<string, Promise<void>>();

      function isReady(name: string): boolean {
        const def = defs.get(name)!;
        return def.deps.every((d) => completed.has(d));
      }

      function startTask(name: string): Promise<void> {
        const def = defs.get(name)!;
        const promise = (async () => {
          results[name] = await def.fn(results);
          completed.add(name);
          running.delete(name);
        })();
        running.set(name, promise);
        return promise;
      }

      while (completed.size < defs.size) {
        // 준비된 태스크 시작
        const ready: string[] = [];
        for (const name of defs.keys()) {
          if (!completed.has(name) && !running.has(name) && isReady(name)) {
            ready.push(name);
          }
        }

        if (ready.length === 0 && running.size === 0) {
          break; // 모든 태스크 완료 또는 데드락 (순환 검사에서 걸러짐)
        }

        for (const name of ready) {
          startTask(name);
        }

        // 하나라도 완료될 때까지 대기
        if (running.size > 0) {
          await Promise.race(running.values());
        }
      }

      return results;
    },

    get tasks(): string[] {
      return [...defs.keys()];
    },
  };

  return runner;
}
