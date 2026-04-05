// 타입 안전 데이터 변환 파이프라인 (Pipeline).
//
// 스텝별 이름, 에러 핸들링, 조건부 실행, tap(부수 효과),
// 분기(fork), 실행 결과 추적을 지원한다.
//
// createPipeline<string>()
//   .pipe("trim", s => s.trim())
//   .pipe("upper", s => s.toUpperCase())
//   .pipeIf(addPrefix, "prefix", s => `PREFIX_${s}`)
//   .execute("  hello  ");
// // { ok: true, value: "PREFIX_HELLO", steps: ["trim", "upper", "prefix"] }

export interface PipelineResult<T> {
  ok: true;
  value: T;
  steps: string[];
}

export interface PipelineError {
  ok: false;
  error: unknown;
  failedStep: string;
  steps: string[];
}

export type PipelineOutcome<T> = PipelineResult<T> | PipelineError;

interface Step<TIn, TOut> {
  name: string;
  fn: (input: TIn) => TOut | Promise<TOut>;
  condition?: (input: TIn) => boolean;
  isTap?: boolean;
}

export interface Pipeline<TIn, TCurrent> {
  /** 변환 스텝을 추가한다. */
  pipe<TNext>(name: string, fn: (input: TCurrent) => TNext | Promise<TNext>): Pipeline<TIn, TNext>;

  /** 조건이 참일 때만 실행하는 스텝. 거짓이면 값을 그대로 통과시킨다. */
  pipeIf(
    condition: boolean | ((input: TCurrent) => boolean),
    name: string,
    fn: (input: TCurrent) => TCurrent | Promise<TCurrent>,
  ): Pipeline<TIn, TCurrent>;

  /** 부수 효과 스텝. 값을 변경하지 않는다. */
  tap(name: string, fn: (input: TCurrent) => void | Promise<void>): Pipeline<TIn, TCurrent>;

  /** 파이프라인을 실행한다. */
  execute(input: TIn): Promise<PipelineOutcome<TCurrent>>;

  /** 동기 파이프라인을 실행한다. async 스텝이 있으면 에러. */
  executeSync(input: TIn): PipelineOutcome<TCurrent>;

  /** 등록된 스텝 이름 목록. */
  readonly stepNames: string[];
}

export function createPipeline<T>(): Pipeline<T, T> {
  return buildPipeline<T, T>([]);
}

function buildPipeline<TIn, TCurrent>(steps: Step<any, any>[]): Pipeline<TIn, TCurrent> {
  const pipeline: Pipeline<TIn, TCurrent> = {
    pipe<TNext>(name: string, fn: (input: TCurrent) => TNext | Promise<TNext>): Pipeline<TIn, TNext> {
      return buildPipeline<TIn, TNext>([...steps, { name, fn }]);
    },

    pipeIf(
      condition: boolean | ((input: TCurrent) => boolean),
      name: string,
      fn: (input: TCurrent) => TCurrent | Promise<TCurrent>,
    ): Pipeline<TIn, TCurrent> {
      const condFn = typeof condition === "function" ? condition : () => condition;
      return buildPipeline<TIn, TCurrent>([...steps, { name, fn, condition: condFn }]);
    },

    tap(name: string, fn: (input: TCurrent) => void | Promise<void>): Pipeline<TIn, TCurrent> {
      return buildPipeline<TIn, TCurrent>([...steps, { name, fn, isTap: true }]);
    },

    async execute(input: TIn): Promise<PipelineOutcome<TCurrent>> {
      let current: any = input;
      const executedSteps: string[] = [];

      for (const step of steps) {
        try {
          if (step.condition && !step.condition(current)) {
            continue;
          }

          executedSteps.push(step.name);

          if (step.isTap) {
            await step.fn(current);
          } else {
            current = await step.fn(current);
          }
        } catch (error) {
          return { ok: false, error, failedStep: step.name, steps: executedSteps };
        }
      }

      return { ok: true, value: current as TCurrent, steps: executedSteps };
    },

    executeSync(input: TIn): PipelineOutcome<TCurrent> {
      let current: any = input;
      const executedSteps: string[] = [];

      for (const step of steps) {
        try {
          if (step.condition && !step.condition(current)) {
            continue;
          }

          executedSteps.push(step.name);

          if (step.isTap) {
            const result = step.fn(current);
            if (result instanceof Promise) {
              throw new Error(`Step "${step.name}" returned a Promise in sync execution`);
            }
          } else {
            const result = step.fn(current);
            if (result instanceof Promise) {
              throw new Error(`Step "${step.name}" returned a Promise in sync execution`);
            }
            current = result;
          }
        } catch (error) {
          return { ok: false, error, failedStep: step.name, steps: executedSteps };
        }
      }

      return { ok: true, value: current as TCurrent, steps: executedSteps };
    },

    get stepNames(): string[] {
      return steps.map((s) => s.name);
    },
  };

  return pipeline;
}
