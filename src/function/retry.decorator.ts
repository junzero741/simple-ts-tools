// 함수 데코레이터 유틸 (Function Decorators).
//
// 기존 함수를 감싸서 횡단 관심사(로깅, 캐싱, 타이밍, 재시도,
// fallback, 디바운스 결과)를 부착하는 고차 함수 모음.
//
// const fn = withTiming(withFallback(fetchData, () => cachedData));
// const result = await fn(); // 타이밍 측정 + 실패 시 fallback

/**
 * 함수 실행 시간을 측정한다. 콜백으로 소요 시간(ms)을 전달.
 */
export function withTiming<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  onTiming: (elapsed: number, args: TArgs) => void,
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    const start = performance.now();
    const result = fn(...args);

    if (result instanceof Promise) {
      return result.then((v) => {
        onTiming(performance.now() - start, args);
        return v;
      }) as TResult;
    }

    onTiming(performance.now() - start, args);
    return result;
  };
}

/**
 * 함수가 에러를 던지면 fallback 값을 반환한다.
 */
export function withFallback<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  fallback: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch(() => fallback(...args)) as TResult;
      }
      return result;
    } catch {
      return fallback(...args);
    }
  };
}

/**
 * 함수 호출 전후에 로그를 남긴다.
 */
export function withLogging<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  logger: {
    before?: (args: TArgs) => void;
    after?: (result: TResult, args: TArgs) => void;
    onError?: (error: unknown, args: TArgs) => void;
  },
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    logger.before?.(args);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return (result as Promise<unknown>)
          .then((v) => { logger.after?.(v as TResult, args); return v; })
          .catch((e) => { logger.onError?.(e, args); throw e; }) as TResult;
      }
      logger.after?.(result, args);
      return result;
    } catch (e) {
      logger.onError?.(e, args);
      throw e;
    }
  };
}

/**
 * 함수 결과를 변환한다.
 */
export function withTransform<TArgs extends unknown[], TOriginal, TResult>(
  fn: (...args: TArgs) => TOriginal,
  transform: (result: TOriginal) => TResult,
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    const result = fn(...args);
    if (result instanceof Promise) {
      return (result as Promise<unknown>).then((v) => transform(v as TOriginal)) as TResult;
    }
    return transform(result);
  };
}

/**
 * 함수가 n회까지만 실행되고 이후는 마지막 결과를 반환한다.
 */
export function withMaxCalls<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  maxCalls: number,
): (...args: TArgs) => TResult {
  let calls = 0;
  let lastResult: TResult;

  return (...args: TArgs): TResult => {
    if (calls < maxCalls) {
      calls++;
      lastResult = fn(...args);
    }
    return lastResult;
  };
}

/**
 * 함수 호출을 지연시킨다.
 */
export function withDelay<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ms: number,
): (...args: TArgs) => Promise<Awaited<TResult>> {
  return async (...args: TArgs): Promise<Awaited<TResult>> => {
    await new Promise((r) => setTimeout(r, ms));
    return await fn(...args) as Awaited<TResult>;
  };
}

/**
 * 함수 인자를 검증한다. 실패 시 에러.
 */
export function withValidation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  validate: (...args: TArgs) => void,
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    validate(...args);
    return fn(...args);
  };
}
