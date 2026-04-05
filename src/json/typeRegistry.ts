// 타입 레지스트리 기반 직렬화 (Type Registry Serializer).
//
// JSON.stringify/parse가 Date, Map, Set, RegExp 등의 타입 정보를
// 잃어버리는 문제를 해결한다. 타입별 serialize/deserialize 함수를
// 등록하고, 태그 기반으로 원본 타입을 복원한다.
//
// const registry = createTypeRegistry()
//   .register("Date", Date, (d) => d.toISOString(), (s) => new Date(s))
//   .register("Map", Map, (m) => [...m], (a) => new Map(a))
//   .register("Set", Set, (s) => [...s], (a) => new Set(a));
//
// const str = registry.stringify({ date: new Date(), items: new Set([1,2]) });
// const obj = registry.parse(str);
// // obj.date instanceof Date === true
// // obj.items instanceof Set === true

const TAG_KEY = "$__type";
const VALUE_KEY = "$__value";

export interface TypeRegistry {
  register<T>(
    tag: string,
    ctor: new (...args: any[]) => T,
    serialize: (value: T) => unknown,
    deserialize: (data: unknown) => T,
  ): TypeRegistry;

  stringify(value: unknown, space?: number): string;
  parse(json: string): unknown;

  readonly tags: string[];
}

interface TypeEntry {
  tag: string;
  ctor: Function;
  serialize: (value: any) => unknown;
  deserialize: (data: unknown) => unknown;
}

export function createTypeRegistry(): TypeRegistry {
  const entries: TypeEntry[] = [];

  function findByInstance(value: unknown): TypeEntry | undefined {
    for (const entry of entries) {
      if (value instanceof (entry.ctor as any)) return entry;
    }
    return undefined;
  }

  function findByTag(tag: string): TypeEntry | undefined {
    return entries.find((e) => e.tag === tag);
  }

  function replacer(this: any, key: string, value: unknown): unknown {
    // this[key]로 원본 값에 접근 (Date 등 toJSON이 있는 객체 대응)
    const raw = key === "" ? value : this[key];

    if (raw === null || raw === undefined) return value;

    const entry = findByInstance(raw);
    if (entry) {
      return { [TAG_KEY]: entry.tag, [VALUE_KEY]: entry.serialize(raw) };
    }

    return value;
  }

  function reviver(_key: string, value: unknown): unknown {
    if (
      typeof value === "object" &&
      value !== null &&
      TAG_KEY in (value as Record<string, unknown>)
    ) {
      const obj = value as Record<string, unknown>;
      const tag = obj[TAG_KEY] as string;
      const data = obj[VALUE_KEY];
      const entry = findByTag(tag);
      if (entry) return entry.deserialize(data);
    }
    return value;
  }

  const registry: TypeRegistry = {
    register(tag, ctor, serialize, deserialize) {
      if (entries.some((e) => e.tag === tag)) {
        throw new Error(`Tag "${tag}" already registered`);
      }
      entries.push({ tag, ctor, serialize, deserialize });
      return registry;
    },

    stringify(value, space?) {
      return JSON.stringify(value, replacer, space);
    },

    parse(json) {
      return JSON.parse(json, reviver);
    },

    get tags() {
      return entries.map((e) => e.tag);
    },
  };

  return registry;
}

/** 기본 타입이 미리 등록된 레지스트리. */
export function createDefaultRegistry(): TypeRegistry {
  return createTypeRegistry()
    .register("Date", Date, (d) => d.toISOString(), (s) => new Date(s as string))
    .register("Map", Map, (m) => [...m.entries()], (a) => new Map(a as [unknown, unknown][]))
    .register("Set", Set, (s) => [...s], (a) => new Set(a as unknown[]))
    .register("RegExp", RegExp, (r) => ({ source: r.source, flags: r.flags }), (d) => {
      const { source, flags } = d as { source: string; flags: string };
      return new RegExp(source, flags);
    });
}
