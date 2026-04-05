import { describe, it, expect } from "vitest";
import {
  renameKeys, selectKeys, zipObject, indexBy,
  mapValuesDeep, mergeWith, keysToSnakeCase, keysToCamelCase, countValues,
} from "./transform";

describe("renameKeys", () => {
  it("키 이름을 변경한다", () => {
    expect(renameKeys({ user_name: "Alice", age: 30 }, { user_name: "userName" }))
      .toEqual({ userName: "Alice", age: 30 });
  });

  it("매핑에 없는 키는 유지", () => {
    expect(renameKeys({ a: 1, b: 2 }, { a: "x" })).toEqual({ x: 1, b: 2 });
  });
});

describe("selectKeys", () => {
  it("지정된 키만 선택한다", () => {
    expect(selectKeys({ a: 1, b: 2, c: 3 }, ["a", "c"])).toEqual({ a: 1, c: 3 });
  });

  it("없는 키에 기본값 적용", () => {
    expect(selectKeys({ a: 1 }, ["a", "b"], { b: 99 })).toEqual({ a: 1, b: 99 });
  });

  it("기본값 없으면 undefined", () => {
    expect(selectKeys({ a: 1 }, ["a", "missing"])).toEqual({ a: 1, missing: undefined });
  });
});

describe("zipObject", () => {
  it("키와 값을 합친다", () => {
    expect(zipObject(["a", "b", "c"], [1, 2, 3])).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("값이 부족하면 undefined", () => {
    expect(zipObject(["a", "b"], [1])).toEqual({ a: 1, b: undefined });
  });
});

describe("indexBy", () => {
  it("배열을 키로 인덱싱한다", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];

    expect(indexBy(users, "id")).toEqual({
      "1": { id: 1, name: "Alice" },
      "2": { id: 2, name: "Bob" },
    });
  });
});

describe("mapValuesDeep", () => {
  it("모든 리프 값에 함수를 적용한다", () => {
    const result = mapValuesDeep(
      { a: 1, b: { c: 2, d: { e: 3 } } },
      (v) => (typeof v === "number" ? v * 10 : v),
    );
    expect(result).toEqual({ a: 10, b: { c: 20, d: { e: 30 } } });
  });

  it("배열 내 값도 변환한다", () => {
    const result = mapValuesDeep(
      { items: [1, 2, 3] },
      (v) => (typeof v === "number" ? v + 1 : v),
    );
    expect(result).toEqual({ items: [2, 3, 4] });
  });
});

describe("mergeWith", () => {
  it("같은 키에 대해 함수를 적용한다", () => {
    expect(mergeWith({ a: 1, b: 2 }, { a: 10, b: 20 }, (v1, v2) => (v1 as number) + (v2 as number)))
      .toEqual({ a: 11, b: 22 });
  });

  it("한쪽에만 있는 키는 그대로", () => {
    expect(mergeWith({ a: 1 }, { b: 2 } as any, () => 0))
      .toEqual({ a: 1, b: 2 });
  });
});

describe("keysToSnakeCase", () => {
  it("camelCase → snake_case", () => {
    expect(keysToSnakeCase({ firstName: "Alice", lastName: "Kim", age: 30 }))
      .toEqual({ first_name: "Alice", last_name: "Kim", age: 30 });
  });
});

describe("keysToCamelCase", () => {
  it("snake_case → camelCase", () => {
    expect(keysToCamelCase({ first_name: "Alice", last_name: "Kim" }))
      .toEqual({ firstName: "Alice", lastName: "Kim" });
  });
});

describe("countValues", () => {
  it("조건에 맞는 값 수를 센다", () => {
    expect(countValues({ a: 1, b: null, c: 3, d: null }, (v) => v === null)).toBe(2);
    expect(countValues({ a: 1, b: 2, c: 3 }, (v) => (v as number) > 1)).toBe(2);
  });
});
