export interface StorageOptions {
  /** 스토리지 종류 (기본: "local") */
  type?: "local" | "session";
  /** 모든 키에 자동으로 붙는 네임스페이스 접두사 */
  prefix?: string;
}

export interface SetOptions {
  /** 캐시 만료 시간 (ms). 미지정 시 영구 저장. */
  ttl?: number;
}

interface StoredEntry<T> {
  value: T;
  expiresAt: number | null;
}

/**
 * JSON 직렬화·TTL·네임스페이스를 지원하는 타입 안전 스토리지 래퍼.
 *
 * - SSR/Node.js에서 storage 접근 불가 시 no-op으로 동작 (throw 없음)
 * - TTL 만료 항목은 get 시점에 자동 삭제
 * - 잘못된 JSON은 null 반환 (throw 없음)
 *
 * @example
 * const store = createStorage({ prefix: "myapp" });
 * store.set("user", { id: 1, name: "Alice" }, { ttl: 60_000 });
 * store.get<{ id: number; name: string }>("user"); // { id: 1, name: "Alice" }
 */
export class TypedStorage {
  private readonly prefix: string;
  private readonly storageType: "local" | "session";

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ? `${options.prefix}:` : "";
    this.storageType = options.type ?? "local";
  }

  private get store(): Storage | null {
    if (typeof window === "undefined") return null;
    return this.storageType === "session"
      ? window.sessionStorage
      : window.localStorage;
  }

  private key(rawKey: string): string {
    return `${this.prefix}${rawKey}`;
  }

  /**
   * 값을 저장한다. 객체/배열은 JSON으로 직렬화된다.
   */
  set<T>(rawKey: string, value: T, options: SetOptions = {}): void {
    const store = this.store;
    if (!store) return;
    const entry: StoredEntry<T> = {
      value,
      expiresAt: options.ttl != null ? Date.now() + options.ttl : null,
    };
    try {
      store.setItem(this.key(rawKey), JSON.stringify(entry));
    } catch {
      // QuotaExceededError 등 무시
    }
  }

  /**
   * 저장된 값을 반환한다. 없거나 만료됐거나 파싱 실패 시 `null`.
   */
  get<T>(rawKey: string): T | null {
    const store = this.store;
    if (!store) return null;
    const raw = store.getItem(this.key(rawKey));
    if (raw == null) return null;
    try {
      const entry = JSON.parse(raw) as StoredEntry<T>;
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        store.removeItem(this.key(rawKey));
        return null;
      }
      return entry.value;
    } catch {
      return null;
    }
  }

  /**
   * 키가 존재하고 만료되지 않았으면 `true`.
   */
  has(rawKey: string): boolean {
    return this.get(rawKey) !== null;
  }

  /**
   * 키를 삭제한다.
   */
  remove(rawKey: string): void {
    this.store?.removeItem(this.key(rawKey));
  }

  /**
   * 현재 prefix에 속한 모든 항목을 삭제한다.
   * prefix가 없으면 스토리지 전체를 비운다.
   */
  clear(): void {
    const store = this.store;
    if (!store) return;
    if (!this.prefix) {
      store.clear();
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k?.startsWith(this.prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => store.removeItem(k));
  }

  /**
   * 현재 prefix에 속한 모든 키(raw key, prefix 제외)를 반환한다.
   */
  keys(): string[] {
    const store = this.store;
    if (!store) return [];
    const result: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k == null) continue;
      if (this.prefix && k.startsWith(this.prefix)) {
        result.push(k.slice(this.prefix.length));
      } else if (!this.prefix) {
        result.push(k);
      }
    }
    return result;
  }
}

/**
 * TypedStorage 인스턴스를 생성한다.
 *
 * @example
 * // 기본 (localStorage, 네임스페이스 없음)
 * const store = createStorage();
 *
 * // sessionStorage + 앱 전용 네임스페이스
 * const session = createStorage({ type: "session", prefix: "cart" });
 */
export function createStorage(options?: StorageOptions): TypedStorage {
  return new TypedStorage(options);
}
