// 피처 플래그 관리자 (Feature Flags).
//
// 런타임에 기능을 토글하고, 퍼센트 기반 롤아웃,
// 사용자/환경별 조건부 활성화, 오버라이드를 지원한다.
//
// const flags = createFeatureFlags({
//   darkMode: true,
//   newCheckout: { enabled: false, rollout: 0.5 },
//   betaSearch: { enabled: true, condition: (ctx) => ctx.role === "beta" },
// });
//
// flags.isEnabled("darkMode");           // true
// flags.isEnabled("newCheckout");         // 50% 확률
// flags.isEnabled("betaSearch", { role: "beta" }); // true
//
// flags.override("darkMode", false);     // 강제 비활성화
// flags.subscribe((name, enabled) => log(name, enabled));

export type FlagValue =
  | boolean
  | {
      enabled: boolean;
      rollout?: number;
      condition?: (context: Record<string, unknown>) => boolean;
    };

export interface FeatureFlags<T extends Record<string, FlagValue>> {
  /** 플래그가 활성화되어 있는지 확인한다. */
  isEnabled(name: keyof T & string, context?: Record<string, unknown>): boolean;

  /** 플래그 값을 오버라이드한다. */
  override(name: keyof T & string, enabled: boolean): void;

  /** 오버라이드를 제거한다. */
  clearOverride(name: keyof T & string): void;

  /** 모든 오버라이드를 제거한다. */
  clearAllOverrides(): void;

  /** 모든 플래그 상태를 반환한다 (오버라이드 포함). */
  getAll(context?: Record<string, unknown>): Record<keyof T & string, boolean>;

  /** 플래그 변경 구독. override 시 알림. 해제 함수 반환. */
  subscribe(handler: (name: string, enabled: boolean) => void): () => void;

  /** 등록된 플래그 이름 목록. */
  readonly names: (keyof T & string)[];
}

export function createFeatureFlags<T extends Record<string, FlagValue>>(
  definitions: T,
): FeatureFlags<T> {
  const overrides = new Map<string, boolean>();
  const listeners = new Set<(name: string, enabled: boolean) => void>();

  function resolve(name: string, context?: Record<string, unknown>): boolean {
    // 오버라이드 우선
    if (overrides.has(name)) return overrides.get(name)!;

    const def = definitions[name];
    if (def === undefined) return false;

    if (typeof def === "boolean") return def;

    if (!def.enabled) return false;

    // condition 체크
    if (def.condition && context) {
      if (!def.condition(context)) return false;
    } else if (def.condition && !context) {
      return false;
    }

    // rollout 체크
    if (def.rollout !== undefined) {
      return Math.random() < def.rollout;
    }

    return true;
  }

  function notify(name: string, enabled: boolean): void {
    for (const h of listeners) h(name, enabled);
  }

  const flags: FeatureFlags<T> = {
    isEnabled(name, context?) {
      return resolve(name as string, context);
    },

    override(name, enabled) {
      overrides.set(name as string, enabled);
      notify(name as string, enabled);
    },

    clearOverride(name) {
      overrides.delete(name as string);
    },

    clearAllOverrides() {
      overrides.clear();
    },

    getAll(context?) {
      const result: Record<string, boolean> = {};
      for (const name of Object.keys(definitions)) {
        result[name] = resolve(name, context);
      }
      return result as Record<keyof T & string, boolean>;
    },

    subscribe(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },

    get names() {
      return Object.keys(definitions) as (keyof T & string)[];
    },
  };

  return flags;
}
