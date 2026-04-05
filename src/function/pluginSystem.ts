// 플러그인 시스템 (Plugin System).
//
// 플러그인 등록, 훅(확장 포인트) 정의, 의존성 해결,
// 라이프사이클(init/destroy)을 지원하는 확장 시스템.
//
// const app = createPluginSystem<{
//   "beforeRequest": [Request],
//   "afterResponse": [Response],
//   "transform": [string],
// }>();
//
// app.register({
//   name: "logger",
//   hooks: {
//     beforeRequest: (req) => console.log(req.url),
//   },
// });
//
// app.register({
//   name: "auth",
//   dependencies: ["logger"],
//   hooks: {
//     beforeRequest: (req) => { req.headers.auth = "token"; },
//   },
// });
//
// await app.init();
// await app.call("beforeRequest", request);

export interface PluginDef<THooks extends Record<string, unknown[]>> {
  name: string;
  dependencies?: string[];
  hooks?: {
    [K in keyof THooks]?: (...args: THooks[K]) => void | Promise<void>;
  };
  init?: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
}

export interface PluginSystem<THooks extends Record<string, unknown[]>> {
  register(plugin: PluginDef<THooks>): PluginSystem<THooks>;
  unregister(name: string): boolean;

  init(): Promise<void>;
  destroy(): Promise<void>;

  call<K extends keyof THooks & string>(hook: K, ...args: THooks[K]): Promise<void>;
  callSync<K extends keyof THooks & string>(hook: K, ...args: THooks[K]): void;

  has(name: string): boolean;
  readonly plugins: string[];
  readonly initialized: boolean;
}

export function createPluginSystem<
  THooks extends Record<string, unknown[]>,
>(): PluginSystem<THooks> {
  const registry = new Map<string, PluginDef<THooks>>();
  let sortedOrder: string[] = [];
  let isInitialized = false;

  function topologicalSort(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    function visit(name: string): void {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular plugin dependency involving "${name}"`);
      }
      visiting.add(name);

      const plugin = registry.get(name);
      if (plugin?.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!registry.has(dep)) {
            throw new Error(`Plugin "${name}" depends on unknown plugin "${dep}"`);
          }
          visit(dep);
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    }

    for (const name of registry.keys()) visit(name);
    return order;
  }

  const system: PluginSystem<THooks> = {
    register(plugin) {
      if (registry.has(plugin.name)) {
        throw new Error(`Plugin "${plugin.name}" already registered`);
      }
      registry.set(plugin.name, plugin);
      sortedOrder = [];
      return system;
    },

    unregister(name) {
      if (!registry.has(name)) return false;
      // 의존하는 플러그인이 있는지 확인
      for (const [pName, p] of registry) {
        if (p.dependencies?.includes(name)) {
          throw new Error(`Cannot unregister "${name}": "${pName}" depends on it`);
        }
      }
      registry.delete(name);
      sortedOrder = [];
      return true;
    },

    async init() {
      sortedOrder = topologicalSort();
      for (const name of sortedOrder) {
        const plugin = registry.get(name)!;
        if (plugin.init) await plugin.init();
      }
      isInitialized = true;
    },

    async destroy() {
      // 역순으로 destroy
      for (let i = sortedOrder.length - 1; i >= 0; i--) {
        const plugin = registry.get(sortedOrder[i]);
        if (plugin?.destroy) await plugin.destroy();
      }
      isInitialized = false;
    },

    async call(hook, ...args) {
      if (sortedOrder.length === 0) sortedOrder = topologicalSort();
      for (const name of sortedOrder) {
        const plugin = registry.get(name)!;
        const fn = plugin.hooks?.[hook];
        if (fn) await (fn as (...a: unknown[]) => void | Promise<void>)(...args);
      }
    },

    callSync(hook, ...args) {
      if (sortedOrder.length === 0) sortedOrder = topologicalSort();
      for (const name of sortedOrder) {
        const plugin = registry.get(name)!;
        const fn = plugin.hooks?.[hook];
        if (fn) (fn as (...a: unknown[]) => void)(...args);
      }
    },

    has(name) { return registry.has(name); },
    get plugins() {
      if (sortedOrder.length === 0 && registry.size > 0) {
        try { sortedOrder = topologicalSort(); } catch { /* ignore */ }
      }
      return sortedOrder.length > 0 ? [...sortedOrder] : [...registry.keys()];
    },
    get initialized() { return isInitialized; },
  };

  return system;
}
