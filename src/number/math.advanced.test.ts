import { describe, it, expect } from "vitest";
import {
  gcd, lcm, gcdAll, lcmAll,
  isPrime, primesUpTo,
  factorial, combinations, permutations,
  fibonacci, modPow,
  isPowerOfTwo, nextPowerOfTwo, isCoprime,
} from "./math.advanced";

describe("gcd / lcm", () => {
  it("gcd", () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(7, 13)).toBe(1);
    expect(gcd(0, 5)).toBe(5);
    expect(gcd(100, 75)).toBe(25);
    expect(gcd(-12, 8)).toBe(4);
  });

  it("lcm", () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(3, 7)).toBe(21);
    expect(lcm(0, 5)).toBe(0);
  });

  it("gcdAll", () => {
    expect(gcdAll(12, 18, 24)).toBe(6);
  });

  it("lcmAll", () => {
    expect(lcmAll(2, 3, 4)).toBe(12);
    expect(lcmAll(6, 8, 12)).toBe(24);
  });
});

describe("isPrime", () => {
  it("소수 판별", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(3)).toBe(true);
    expect(isPrime(17)).toBe(true);
    expect(isPrime(97)).toBe(true);
  });

  it("합성수", () => {
    expect(isPrime(1)).toBe(false);
    expect(isPrime(4)).toBe(false);
    expect(isPrime(15)).toBe(false);
    expect(isPrime(100)).toBe(false);
  });

  it("경계값", () => {
    expect(isPrime(0)).toBe(false);
    expect(isPrime(-1)).toBe(false);
  });
});

describe("primesUpTo", () => {
  it("n 이하 소수 목록", () => {
    expect(primesUpTo(20)).toEqual([2, 3, 5, 7, 11, 13, 17, 19]);
  });

  it("2 미만이면 빈 배열", () => {
    expect(primesUpTo(1)).toEqual([]);
  });

  it("소수 개수 확인", () => {
    expect(primesUpTo(100).length).toBe(25);
  });
});

describe("factorial", () => {
  it("기본", () => {
    expect(factorial(0)).toBe(1);
    expect(factorial(1)).toBe(1);
    expect(factorial(5)).toBe(120);
    expect(factorial(10)).toBe(3628800);
  });

  it("음수면 에러", () => {
    expect(() => factorial(-1)).toThrow();
  });
});

describe("combinations", () => {
  it("C(n, r)", () => {
    expect(combinations(5, 2)).toBe(10);
    expect(combinations(10, 3)).toBe(120);
    expect(combinations(6, 0)).toBe(1);
    expect(combinations(6, 6)).toBe(1);
  });

  it("r > n이면 0", () => {
    expect(combinations(3, 5)).toBe(0);
  });

  it("대칭 — C(n,r) === C(n,n-r)", () => {
    expect(combinations(10, 3)).toBe(combinations(10, 7));
  });
});

describe("permutations", () => {
  it("P(n, r)", () => {
    expect(permutations(5, 2)).toBe(20);
    expect(permutations(4, 4)).toBe(24);
    expect(permutations(5, 0)).toBe(1);
  });

  it("r > n이면 0", () => {
    expect(permutations(3, 5)).toBe(0);
  });
});

describe("fibonacci", () => {
  it("기본", () => {
    expect(fibonacci(0)).toBe(0);
    expect(fibonacci(1)).toBe(1);
    expect(fibonacci(10)).toBe(55);
    expect(fibonacci(20)).toBe(6765);
  });

  it("음수면 에러", () => {
    expect(() => fibonacci(-1)).toThrow();
  });
});

describe("modPow", () => {
  it("모듈러 거듭제곱", () => {
    expect(modPow(2, 10, 1000)).toBe(24); // 1024 % 1000
    expect(modPow(3, 13, 100)).toBe(3 ** 13 % 100);
    expect(modPow(2, 0, 5)).toBe(1);
  });

  it("mod가 1이면 0", () => {
    expect(modPow(5, 3, 1)).toBe(0);
  });
});

describe("isPowerOfTwo", () => {
  it("2의 거듭제곱", () => {
    expect(isPowerOfTwo(1)).toBe(true);
    expect(isPowerOfTwo(2)).toBe(true);
    expect(isPowerOfTwo(1024)).toBe(true);
  });

  it("아닌 수", () => {
    expect(isPowerOfTwo(0)).toBe(false);
    expect(isPowerOfTwo(3)).toBe(false);
    expect(isPowerOfTwo(6)).toBe(false);
  });
});

describe("nextPowerOfTwo", () => {
  it("n 이상의 가장 작은 2^k", () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(1000)).toBe(1024);
  });
});

describe("isCoprime", () => {
  it("서로소 판별", () => {
    expect(isCoprime(3, 7)).toBe(true);
    expect(isCoprime(4, 6)).toBe(false);
    expect(isCoprime(1, 100)).toBe(true);
  });
});
