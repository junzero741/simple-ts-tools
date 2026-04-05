// 비즈니스 규칙 엔진 (Rule Engine).
//
// 조건-액션 쌍을 선언적으로 등록하고, 데이터에 대해 평가한다.
// 할인 정책, 알림 라우팅, 입력 검증, 권한 판정 등 복잡한
// 비즈니스 로직을 if/else 지옥 없이 관리.
//
// const engine = createRuleEngine<Order, Discount>();
//
// engine.add({
//   name: "bulk",
//   condition: (o) => o.qty >= 100,
//   action: (o) => ({ type: "percent", value: 10 }),
//   priority: 10,
// });
//
// engine.add({
//   name: "vip",
//   condition: (o) => o.customer.vip,
//   action: (o) => ({ type: "percent", value: 15 }),
//   priority: 20,
// });
//
// engine.evaluate(order);            // 첫 매칭 규칙의 결과
// engine.evaluateAll(order);         // 모든 매칭 규칙의 결과
// engine.first(order);               // 우선순위 최고 매칭 1개

export interface Rule<TFact, TResult> {
  name: string;
  condition: (fact: TFact) => boolean;
  action: (fact: TFact) => TResult;
  priority?: number;
  enabled?: boolean;
}

export interface RuleEngineOptions {
  /** true면 첫 매칭에서 멈춘다 (기본: false). */
  stopOnFirst?: boolean;
}

export interface RuleEngine<TFact, TResult> {
  /** 규칙을 추가한다. */
  add(rule: Rule<TFact, TResult>): RuleEngine<TFact, TResult>;

  /** 규칙을 제거한다. */
  remove(name: string): boolean;

  /** 규칙을 활성화/비활성화한다. */
  toggle(name: string, enabled: boolean): void;

  /** 모든 매칭 규칙의 결과를 반환한다 (우선순위 순). */
  evaluateAll(fact: TFact): Array<{ rule: string; result: TResult }>;

  /** 첫 매칭 규칙의 결과를 반환한다 (최고 우선순위). */
  first(fact: TFact): { rule: string; result: TResult } | undefined;

  /** 매칭되는 규칙 이름 목록. */
  match(fact: TFact): string[];

  /** 등록된 규칙 수. */
  readonly size: number;

  /** 등록된 규칙 목록. */
  readonly rules: ReadonlyArray<Readonly<Rule<TFact, TResult>>>;

  /** 모든 규칙을 제거한다. */
  clear(): void;
}

export function createRuleEngine<TFact, TResult>(): RuleEngine<TFact, TResult> {
  const ruleList: Rule<TFact, TResult>[] = [];
  let sorted = false;

  function ensureSorted(): void {
    if (sorted) return;
    ruleList.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    sorted = true;
  }

  const engine: RuleEngine<TFact, TResult> = {
    add(rule) {
      if (ruleList.some((r) => r.name === rule.name)) {
        throw new Error(`Rule "${rule.name}" already exists`);
      }
      ruleList.push({ enabled: true, priority: 0, ...rule });
      sorted = false;
      return engine;
    },

    remove(name) {
      const idx = ruleList.findIndex((r) => r.name === name);
      if (idx === -1) return false;
      ruleList.splice(idx, 1);
      return true;
    },

    toggle(name, enabled) {
      const rule = ruleList.find((r) => r.name === name);
      if (rule) rule.enabled = enabled;
    },

    evaluateAll(fact) {
      ensureSorted();
      const results: Array<{ rule: string; result: TResult }> = [];

      for (const rule of ruleList) {
        if (rule.enabled === false) continue;
        if (rule.condition(fact)) {
          results.push({ rule: rule.name, result: rule.action(fact) });
        }
      }

      return results;
    },

    first(fact) {
      ensureSorted();
      for (const rule of ruleList) {
        if (rule.enabled === false) continue;
        if (rule.condition(fact)) {
          return { rule: rule.name, result: rule.action(fact) };
        }
      }
      return undefined;
    },

    match(fact) {
      ensureSorted();
      return ruleList
        .filter((r) => r.enabled !== false && r.condition(fact))
        .map((r) => r.name);
    },

    get size() { return ruleList.length; },
    get rules() { ensureSorted(); return ruleList; },

    clear() { ruleList.length = 0; sorted = true; },
  };

  return engine;
}
