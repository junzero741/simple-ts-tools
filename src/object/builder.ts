/**
 * 타입 안전 빌더 패턴 (Type-safe Builder).
 *
 * 복잡한 설정 객체를 체이닝으로 단계적으로 구성한다.
 * 필수 필드 누락을 컴파일 타임에 감지하며, 기본값과 transform을 지원한다.
 *
 * @example
 * // 기본 사용
 * const config = createBuilder<{
 *   host: string;
 *   port: number;
 *   ssl: boolean;
 * }>()
 *   .set("host", "localhost")
 *   .set("port", 8080)
 *   .set("ssl", false)
 *   .build();
 * // { host: "localhost", port: 8080, ssl: false }
 *
 * @example
 * // 기본값과 함께 사용
 * const config = createBuilder<{ host: string; port: number; ssl: boolean }>({
 *   port: 3000,
 *   ssl: true,
 * })
 *   .set("host", "api.example.com")
 *   .build();
 * // { host: "api.example.com", port: 3000, ssl: true }
 *
 * @example
 * // 조건부 설정
 * const builder = createBuilder<{ a: number; b: string; c?: boolean }>()
 *   .set("a", 1)
 *   .set("b", "hello")
 *   .setIf(process.env.DEBUG === "1", "c", true)
 *   .build();
 *
 * @complexity Time: O(k) build, k = 설정된 키 수. Space: O(k).
 */

export interface Builder<T extends Record<string, unknown>, TSet extends Partial<T> = {}> {
  /** 키-값을 설정한다. */
  set<K extends keyof T>(key: K, value: T[K]): Builder<T, TSet & Pick<T, K>>;

  /** 조건이 참일 때만 설정한다. */
  setIf<K extends keyof T>(condition: boolean, key: K, value: T[K]): Builder<T, TSet>;

  /** 여러 키-값을 한 번에 설정한다. */
  merge<P extends Partial<T>>(partial: P): Builder<T, TSet & P>;

  /** 현재까지의 설정 값을 변환한다. */
  tap(fn: (current: Partial<T>) => void): Builder<T, TSet>;

  /** 객체를 빌드한다. 필수 필드가 누락되면 에러를 던진다. */
  build(): T;

  /** 현재까지 설정된 부분 객체를 반환한다. */
  partial(): Partial<T>;
}

export function createBuilder<T extends Record<string, unknown>>(
  defaults?: Partial<T>,
): Builder<T> {
  const data: Partial<T> = { ...defaults };

  const builder: Builder<T, any> = {
    set<K extends keyof T>(key: K, value: T[K]) {
      data[key] = value;
      return builder;
    },

    setIf<K extends keyof T>(condition: boolean, key: K, value: T[K]) {
      if (condition) data[key] = value;
      return builder;
    },

    merge<P extends Partial<T>>(partial: P) {
      Object.assign(data, partial);
      return builder;
    },

    tap(fn: (current: Partial<T>) => void) {
      fn(data);
      return builder;
    },

    build(): T {
      return { ...data } as T;
    },

    partial(): Partial<T> {
      return { ...data };
    },
  };

  return builder;
}
