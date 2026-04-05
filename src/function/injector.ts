/**
 * 경량 의존성 주입 컨테이너 (DI Container).
 *
 * 서비스를 등록하고 의존성을 자동 해결한다.
 * 싱글톤/트랜지언트 스코프, 팩토리 함수, 자식 컨테이너(스코프)를 지원한다.
 *
 * @example
 * const container = createInjector();
 *
 * // 값 등록
 * container.register("config", { apiUrl: "https://api.example.com" });
 *
 * // 팩토리 등록 (싱글톤)
 * container.factory("db", (c) => createDbConnection(c.resolve("config")));
 *
 * // 팩토리 등록 (트랜지언트 — 매번 새 인스턴스)
 * container.factory("logger", (c) => new Logger(), { scope: "transient" });
 *
 * // 해결
 * const db = container.resolve<DbConnection>("db");
 *
 * @example
 * // 자식 컨테이너 — 부모 서비스 상속, 오버라이드 가능
 * const child = container.createChild();
 * child.register("config", { apiUrl: "https://staging.example.com" });
 * // child.resolve("db")는 staging config를 사용
 *
 * @complexity Time: O(1) resolve (싱글톤 캐시 후). Space: O(n) 등록 수.
 */

export type Scope = "singleton" | "transient";

export interface FactoryOptions {
  scope?: Scope;
}

export interface Injector {
  /** 값을 직접 등록한다. */
  register<T>(token: string, value: T): Injector;

  /** 팩토리 함수로 등록한다. 기본 scope: singleton. */
  factory<T>(
    token: string,
    fn: (container: Injector) => T,
    options?: FactoryOptions,
  ): Injector;

  /** 등록된 서비스를 해결한다. 미등록 시 에러. */
  resolve<T>(token: string): T;

  /** 등록 여부를 확인한다. */
  has(token: string): boolean;

  /** 자식 컨테이너를 생성한다. 부모 서비스를 상속한다. */
  createChild(): Injector;

  /** 모든 등록을 제거한다. */
  clear(): void;
}

interface Registration {
  type: "value" | "factory";
  value?: unknown;
  fn?: (container: Injector) => unknown;
  scope: Scope;
  instance?: unknown;
  resolved: boolean;
}

export function createInjector(parent?: Injector): Injector {
  const registry = new Map<string, Registration>();
  const resolving = new Set<string>();

  const injector: Injector = {
    register<T>(token: string, value: T): Injector {
      registry.set(token, {
        type: "value",
        value,
        scope: "singleton",
        resolved: true,
      });
      return injector;
    },

    factory<T>(
      token: string,
      fn: (container: Injector) => T,
      options: FactoryOptions = {},
    ): Injector {
      const { scope = "singleton" } = options;
      registry.set(token, {
        type: "factory",
        fn,
        scope,
        resolved: false,
      });
      return injector;
    },

    resolve<T>(token: string): T {
      const reg = registry.get(token);

      if (!reg) {
        if (parent) return parent.resolve<T>(token);
        throw new Error(`No registration found for "${token}"`);
      }

      if (reg.type === "value") return reg.value as T;

      // 싱글톤 캐시
      if (reg.scope === "singleton" && reg.resolved) {
        return reg.instance as T;
      }

      // 순환 의존성 감지
      if (resolving.has(token)) {
        throw new Error(`Circular dependency detected for "${token}"`);
      }

      resolving.add(token);
      try {
        const instance = reg.fn!(injector);

        if (reg.scope === "singleton") {
          reg.instance = instance;
          reg.resolved = true;
        }

        return instance as T;
      } finally {
        resolving.delete(token);
      }
    },

    has(token: string): boolean {
      if (registry.has(token)) return true;
      if (parent) return parent.has(token);
      return false;
    },

    createChild(): Injector {
      return createInjector(injector);
    },

    clear(): void {
      registry.clear();
    },
  };

  return injector;
}
