// 고급 수학 유틸 (Advanced Math).
//
// 정수론, 조합론, 수열 등 알고리즘과 실무에서 자주 쓰이는 수학 함수.
//
// gcd(12, 8)            → 4
// lcm(4, 6)             → 12
// isPrime(17)           → true
// factorial(5)          → 120
// combinations(5, 2)    → 10
// permutations(5, 2)    → 20
// fibonacci(10)         → 55
// modPow(2, 10, 1000)   → 1024

/** 최대공약수 (유클리드 알고리즘). */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** 최소공배수. */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/** 여러 수의 GCD. */
export function gcdAll(...nums: number[]): number {
  return nums.reduce(gcd);
}

/** 여러 수의 LCM. */
export function lcmAll(...nums: number[]): number {
  return nums.reduce(lcm);
}

/** 소수 판별 (O(√n)). */
export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

/** n 이하의 소수 목록 (에라토스테네스의 체). */
export function primesUpTo(n: number): number[] {
  if (n < 2) return [];
  const sieve = new Uint8Array(n + 1);
  const primes: number[] = [];

  for (let i = 2; i <= n; i++) {
    if (sieve[i] === 0) {
      primes.push(i);
      for (let j = i * i; j <= n; j += i) {
        sieve[j] = 1;
      }
    }
  }

  return primes;
}

/** 팩토리얼 (n!). n ≤ 170. */
export function factorial(n: number): number {
  if (n < 0) throw new Error("factorial of negative number");
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** 조합 수 C(n, r) = n! / (r! * (n-r)!). 오버플로 방지. */
export function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  r = Math.min(r, n - r); // 대칭 활용
  let result = 1;
  for (let i = 0; i < r; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

/** 순열 수 P(n, r) = n! / (n-r)!. */
export function permutations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) {
    result *= n - i;
  }
  return result;
}

/** n번째 피보나치 수 (0-indexed). F(0)=0, F(1)=1. */
export function fibonacci(n: number): number {
  if (n < 0) throw new Error("fibonacci of negative index");
  if (n <= 1) return n;
  let [a, b] = [0, 1];
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/** 모듈러 거듭제곱 (base^exp % mod). 큰 수에 안전. */
export function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

/** n이 2의 거듭제곱인지 판별. */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/** n 이상의 가장 작은 2의 거듭제곱. */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let v = n - 1;
  v |= v >> 1;
  v |= v >> 2;
  v |= v >> 4;
  v |= v >> 8;
  v |= v >> 16;
  return v + 1;
}

/** 두 수가 서로소인지 판별 (GCD === 1). */
export function isCoprime(a: number, b: number): boolean {
  return gcd(a, b) === 1;
}
