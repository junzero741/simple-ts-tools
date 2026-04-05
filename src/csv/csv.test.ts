import { describe, expect, it } from "vitest";
import { formatCSV, parseCSV } from "./csv";

// ─── parseCSV ─────────────────────────────────────────────────────────────────

describe("parseCSV — 기본 동작 (header: true)", () => {
  it("헤더 + 데이터 행을 Record 배열로 반환한다", () => {
    const result = parseCSV("name,age\nAlice,30\nBob,25");
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("빈 입력은 빈 배열을 반환한다", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("헤더만 있고 데이터가 없으면 빈 배열을 반환한다", () => {
    expect(parseCSV("name,age")).toEqual([]);
  });

  it("헤더 열 수보다 데이터 열이 적으면 빈 문자열로 채운다", () => {
    const result = parseCSV("a,b,c\n1,2");
    expect(result[0]).toEqual({ a: "1", b: "2", c: "" });
  });
});

describe("parseCSV — header: false", () => {
  it("2차원 배열로 반환한다", () => {
    const result = parseCSV("a,b\n1,2\n3,4", { header: false });
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("빈 입력은 빈 배열을 반환한다", () => {
    expect(parseCSV("", { header: false })).toEqual([]);
  });
});

describe("parseCSV — quoted fields (RFC 4180)", () => {
  it("따옴표로 묶인 필드를 올바르게 파싱한다", () => {
    const result = parseCSV(`name,bio\nAlice,"She said ""hello"""`);
    expect(result[0].bio).toBe('She said "hello"');
  });

  it("필드 내 쉼표를 허용한다", () => {
    const result = parseCSV(`name,address\nAlice,"Seoul, Korea"`);
    expect(result[0].address).toBe("Seoul, Korea");
  });

  it("필드 내 줄바꿈을 허용한다", () => {
    const result = parseCSV(`name,note\nAlice,"line1\nline2"`);
    expect(result[0].note).toBe("line1\nline2");
  });

  it("따옴표 이스케이프 (\"\"→\") 를 처리한다", () => {
    const result = parseCSV(`q\n"it's ""great"""`);
    expect(result[0].q).toBe('it\'s "great"');
  });
});

describe("parseCSV — 구분자 옵션", () => {
  it("세미콜론 구분자를 사용한다", () => {
    const result = parseCSV("a;b\n1;2", { delimiter: ";" });
    expect(result).toEqual([{ a: "1", b: "2" }]);
  });

  it("탭 구분자를 사용한다", () => {
    const result = parseCSV("a\tb\n1\t2", { delimiter: "\t" });
    expect(result).toEqual([{ a: "1", b: "2" }]);
  });
});

describe("parseCSV — trim 옵션", () => {
  it("기본적으로 앞뒤 공백을 제거한다", () => {
    const result = parseCSV(" name , age \n Alice , 30 ");
    expect(result[0]).toEqual({ name: "Alice", age: "30" });
  });

  it("trim: false이면 공백을 유지한다", () => {
    const result = parseCSV(" name \n Alice ", { trim: false });
    expect(result[0]).toEqual({ " name ": " Alice " });
  });
});

describe("parseCSV — 줄바꿈 처리", () => {
  it("\\r\\n (CRLF) 줄바꿈을 처리한다", () => {
    const result = parseCSV("name,age\r\nAlice,30\r\nBob,25");
    expect(result).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  it("\\r (CR) 줄바꿈을 처리한다", () => {
    const result = parseCSV("name,age\rAlice,30");
    expect(result).toEqual([{ name: "Alice", age: "30" }]);
  });
});

describe("parseCSV — skipEmptyLines", () => {
  it("기본적으로 빈 행을 건너뛴다", () => {
    const result = parseCSV("name\nAlice\n\nBob");
    expect(result).toHaveLength(2);
  });

  it("skipEmptyLines: false이면 빈 행을 포함한다", () => {
    const result = parseCSV("a\nb\n\nc", { skipEmptyLines: false });
    expect(result).toHaveLength(3); // b, (빈 행), c
    expect(result[1]).toEqual({ a: "" });
  });
});

// ─── formatCSV ────────────────────────────────────────────────────────────────

describe("formatCSV — Record 배열", () => {
  it("헤더와 데이터를 CSV로 변환한다", () => {
    const result = formatCSV([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(result).toBe("name,age\nAlice,30\nBob,25");
  });

  it("빈 배열은 빈 문자열을 반환한다", () => {
    expect(formatCSV([])).toBe("");
  });

  it("null/undefined 값을 빈 문자열로 변환한다", () => {
    const result = formatCSV([{ a: null, b: undefined, c: 1 }] as never);
    expect(result).toBe("a,b,c\n,,1");
  });
});

describe("formatCSV — 2차원 배열", () => {
  it("배열을 CSV로 변환한다", () => {
    const result = formatCSV([
      ["name", "age"],
      ["Alice", "30"],
    ]);
    expect(result).toBe("name,age\nAlice,30");
  });
});

describe("formatCSV — 인용 처리", () => {
  it("구분자를 포함한 필드를 인용한다", () => {
    const result = formatCSV([{ address: "Seoul, Korea" }]);
    expect(result).toBe(`address\n"Seoul, Korea"`);
  });

  it("따옴표를 포함한 필드를 이스케이프한다", () => {
    const result = formatCSV([{ bio: 'He said "hello"' }]);
    expect(result).toBe(`bio\n"He said ""hello"""`);
  });

  it("줄바꿈을 포함한 필드를 인용한다", () => {
    const result = formatCSV([{ note: "line1\nline2" }]);
    expect(result).toBe(`note\n"line1\nline2"`);
  });
});

describe("formatCSV — 옵션", () => {
  it("delimiter 옵션을 사용한다", () => {
    const result = formatCSV([{ a: "1", b: "2" }], { delimiter: ";" });
    expect(result).toBe("a;b\n1;2");
  });

  it("lineBreak: \\r\\n 옵션을 사용한다", () => {
    const result = formatCSV([{ a: "1" }], { lineBreak: "\r\n" });
    expect(result).toBe("a\r\n1");
  });
});

describe("parseCSV ↔ formatCSV 왕복 변환", () => {
  it("formatCSV → parseCSV는 원본 데이터를 복원한다", () => {
    const original = [
      { name: "Alice", note: 'She said "hello"', city: "Seoul, Korea" },
      { name: "Bob",   note: "line1\nline2",     city: "Busan" },
    ];
    const csv = formatCSV(original);
    const parsed = parseCSV(csv);
    // 숫자는 문자열로 복원됨
    expect(parsed[0].name).toBe("Alice");
    expect(parsed[0].note).toBe('She said "hello"');
    expect(parsed[0].city).toBe("Seoul, Korea");
    expect(parsed[1].note).toBe("line1\nline2");
  });
});
