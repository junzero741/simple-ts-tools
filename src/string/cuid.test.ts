import { describe, it, expect } from "vitest";
import { createCuid, createNanoId, createPrefixedId, createSortableId, createHumanCode } from "./cuid";

describe("createCuid", () => {
  it("기본 24자 ID를 생성한다", () => {
    const id = createCuid();
    expect(id.length).toBe(24);
    expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it("커스텀 길이", () => {
    expect(createCuid(12).length).toBe(12);
    expect(createCuid(32).length).toBe(32);
  });

  it("8 미만이면 에러", () => {
    expect(() => createCuid(7)).toThrow("length must be at least 8");
  });

  it("유일하다", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createCuid()));
    expect(ids.size).toBe(1000);
  });

  it("시간순 정렬이 가능하다", () => {
    const ids = Array.from({ length: 10 }, () => createCuid());
    const sorted = [...ids].sort();
    expect(sorted).toEqual(ids);
  });
});

describe("createNanoId", () => {
  it("기본 21자 ID를 생성한다", () => {
    const id = createNanoId();
    expect(id.length).toBe(21);
  });

  it("URL 안전 문자만 포함한다", () => {
    const id = createNanoId(100);
    expect(id).toMatch(/^[0-9a-zA-Z_-]+$/);
  });

  it("커스텀 길이", () => {
    expect(createNanoId(8).length).toBe(8);
    expect(createNanoId(64).length).toBe(64);
  });

  it("유일하다", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createNanoId()));
    expect(ids.size).toBe(1000);
  });
});

describe("createPrefixedId", () => {
  it("접두사_ID 형식", () => {
    const id = createPrefixedId("usr");
    expect(id).toMatch(/^usr_[0-9a-z]+$/);
  });

  it("접두사 변경", () => {
    expect(createPrefixedId("order")).toMatch(/^order_/);
    expect(createPrefixedId("txn")).toMatch(/^txn_/);
  });

  it("커스텀 길이", () => {
    const id = createPrefixedId("x", 10);
    // "x_" + 10자
    expect(id.length).toBe(12);
  });
});

describe("createSortableId", () => {
  it("고정 길이 ID를 생성한다", () => {
    const id = createSortableId();
    expect(id.length).toBe(17); // 9 + 4 + 4
    expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it("시간순 정렬이 가능하다", () => {
    const ids = Array.from({ length: 20 }, () => createSortableId());
    const sorted = [...ids].sort();
    expect(sorted).toEqual(ids);
  });

  it("유일하다", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createSortableId()));
    expect(ids.size).toBe(1000);
  });
});

describe("createHumanCode", () => {
  it("기본 6자 코드", () => {
    const code = createHumanCode();
    expect(code.length).toBe(6);
  });

  it("혼동 문자를 포함하지 않는다", () => {
    // 0, O, 1, l, I 제외
    for (let i = 0; i < 100; i++) {
      const code = createHumanCode(20);
      expect(code).not.toMatch(/[01OIl]/);
    }
  });

  it("커스텀 길이", () => {
    expect(createHumanCode(4).length).toBe(4);
    expect(createHumanCode(10).length).toBe(10);
  });
});
