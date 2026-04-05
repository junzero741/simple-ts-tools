import { describe, it, expect } from "vitest";
import { lens, view, set, over, prop, composeLens } from "./lens";

type User = { name: string; age: number };
type State = { user: { address: { city: string; zip: string } } };

describe("lens", () => {
  const nameLens = lens<User, string>(
    (u) => u.name,
    (u, name) => ({ ...u, name }),
  );

  const user: User = { name: "alice", age: 30 };

  describe("view", () => {
    it("렌즈를 통해 값을 읽는다", () => {
      expect(view(nameLens, user)).toBe("alice");
    });
  });

  describe("set", () => {
    it("렌즈를 통해 값을 설정한다 (불변)", () => {
      const updated = set(nameLens, user, "bob");
      expect(updated).toEqual({ name: "bob", age: 30 });
      expect(user.name).toBe("alice");
    });
  });

  describe("over", () => {
    it("렌즈를 통해 값을 변환한다 (불변)", () => {
      const updated = over(nameLens, user, (s) => s.toUpperCase());
      expect(updated).toEqual({ name: "ALICE", age: 30 });
      expect(user.name).toBe("alice");
    });
  });

  describe("prop", () => {
    it("프로퍼티 렌즈를 자동 생성한다", () => {
      const ageLens = prop<User>()("age");

      expect(view(ageLens, user)).toBe(30);
      expect(set(ageLens, user, 31)).toEqual({ name: "alice", age: 31 });
    });

    it("원본을 변경하지 않는다", () => {
      const ageLens = prop<User>()("age");
      set(ageLens, user, 99);
      expect(user.age).toBe(30);
    });
  });

  describe("composeLens", () => {
    const state: State = {
      user: { address: { city: "Seoul", zip: "06000" } },
    };

    it("두 렌즈를 합성한다", () => {
      const userLens = prop<State>()("user");
      const addressLens = prop<State["user"]>()("address");

      const userAddressLens = composeLens(userLens, addressLens);

      expect(view(userAddressLens, state)).toEqual({ city: "Seoul", zip: "06000" });
    });

    it("세 렌즈를 합성하여 깊은 경로에 접근한다", () => {
      const userLens = prop<State>()("user");
      const addressLens = prop<State["user"]>()("address");
      const cityLens = prop<State["user"]["address"]>()("city");

      const deepCityLens = composeLens(userLens, addressLens, cityLens);

      expect(view(deepCityLens, state)).toBe("Seoul");

      const updated = set(deepCityLens, state, "Busan");
      expect(updated.user.address.city).toBe("Busan");
      expect(updated.user.address.zip).toBe("06000");
      expect(state.user.address.city).toBe("Seoul");
    });

    it("over로 깊은 경로를 변환한다", () => {
      const userLens = prop<State>()("user");
      const addressLens = prop<State["user"]>()("address");
      const cityLens = prop<State["user"]["address"]>()("city");

      const deepCityLens = composeLens(userLens, addressLens, cityLens);

      const updated = over(deepCityLens, state, (c) => c.toLowerCase());
      expect(updated.user.address.city).toBe("seoul");
    });
  });

  describe("커스텀 렌즈", () => {
    it("배열 인덱스 렌즈", () => {
      const atIndex = <T>(i: number) =>
        lens<T[], T>(
          (arr) => arr[i],
          (arr, val) => arr.map((v, idx) => (idx === i ? val : v)),
        );

      const arr = [10, 20, 30];
      const secondLens = atIndex<number>(1);

      expect(view(secondLens, arr)).toBe(20);
      expect(set(secondLens, arr, 99)).toEqual([10, 99, 30]);
      expect(arr[1]).toBe(20);
    });

    it("Map 키 렌즈", () => {
      const atKey = <K, V>(key: K) =>
        lens<Map<K, V>, V | undefined>(
          (map) => map.get(key),
          (map, val) => {
            const next = new Map(map);
            if (val === undefined) next.delete(key);
            else next.set(key, val);
            return next;
          },
        );

      const map = new Map([["a", 1], ["b", 2]]);
      const aLens = atKey<string, number>("a");

      expect(view(aLens, map)).toBe(1);
      const updated = set(aLens, map, 10);
      expect(updated.get("a")).toBe(10);
      expect(map.get("a")).toBe(1);
    });
  });
});
