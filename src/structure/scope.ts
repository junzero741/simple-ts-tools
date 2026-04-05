// 계층적 스코프 체인 (Scope Chain).
//
// 부모-자식 관계의 key-value 스코프를 구성한다. 자식에서 키를
// 찾지 못하면 부모로 올라가 탐색한다 (프로토타입 체인과 유사).
//
// 변수 스코프, 설정 오버라이드, 테마 상속, 환경 변수 계층,
// CSS 캐스케이드, 템플릿 컨텍스트에 활용.
//
// const global = createScope<string>();
// global.set("theme", "light");
// global.set("lang", "en");
//
// const user = global.child();
// user.set("theme", "dark");    // 오버라이드
//
// user.get("theme");   // "dark" (자기 스코프)
// user.get("lang");    // "en"   (부모에서 탐색)

export interface Scope<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  has(key: string): boolean;
  hasOwn(key: string): boolean;
  delete(key: string): boolean;

  child(): Scope<V>;

  readonly parent: Scope<V> | undefined;
  readonly ownKeys: string[];

  resolve(key: string): { value: V; scope: Scope<V> } | undefined;
  toObject(): Record<string, V>;
  readonly depth: number;
}

export function createScope<V>(parent?: Scope<V>): Scope<V> {
  const store = new Map<string, V>();

  const scope: Scope<V> = {
    get(key) {
      if (store.has(key)) return store.get(key);
      return parent?.get(key);
    },

    set(key, value) {
      store.set(key, value);
    },

    has(key) {
      return store.has(key) || (parent?.has(key) ?? false);
    },

    hasOwn(key) {
      return store.has(key);
    },

    delete(key) {
      return store.delete(key);
    },

    child() {
      return createScope<V>(scope);
    },

    get parent() { return parent; },

    get ownKeys() { return [...store.keys()]; },

    resolve(key) {
      if (store.has(key)) return { value: store.get(key)!, scope };
      if (parent) return parent.resolve(key);
      return undefined;
    },

    toObject() {
      const parentObj = parent ? parent.toObject() : {};
      const own: Record<string, V> = {};
      for (const [k, v] of store) own[k] = v;
      return { ...parentObj, ...own };
    },

    get depth(): number {
      return parent ? parent.depth + 1 : 0;
    },
  };

  return scope;
}
