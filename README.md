# simple-ts-tools

개인 프로젝트에서 반복적으로 쓰이는 TypeScript 유틸리티 모음.

## 설치

```bash
pnpm add simple-ts-tools
```

## 모듈 목록

### array

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `chunk` | `chunk<T>(arr: T[], size: number): T[][]` | 배열을 n개씩 나눈다 |
| `groupBy` | `groupBy<T, K>(arr: T[], keyFn: (item: T) => K): Partial<Record<K, T[]>>` | 키 추출 함수 기준으로 그룹핑 |
| `sortBy` | `sortBy<T>(arr: T[], keyFn: (item: T) => string \| number, order?: 'asc'\|'desc'): T[]` | 키 기준 정렬 (stable, 비파괴) |
| `tuple` | `tuple<T extends unknown[]>(...args: T): T` | 인자들을 튜플 타입으로 추론 |
| `unique` | `unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[]` | 중복 제거 (첫 등장 순서 유지) |

```ts
import { chunk, groupBy, tuple } from "simple-ts-tools";

chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

groupBy([1, 2, 3, 4], x => x % 2 === 0 ? "even" : "odd");
// { odd: [1, 3], even: [2, 4] }

tuple(1, "hello", true);
// [number, string, boolean] — 튜플로 추론됨

unique([1, 2, 2, 3, 1]);
// [1, 2, 3]

unique(["React", "react", "Vue"], t => t.toLowerCase());
// ["React", "Vue"] — 대소문자 무시

unique(users, u => u.id);
// id 기준 첫 등장 객체만 유지

sortBy(users, u => u.name);            // 이름 오름차순
sortBy(users, u => u.name, "desc");    // 이름 내림차순
sortBy(items, i => -i.price);          // 가격 내림차순 (부호 반전)
```

---

### async

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `sleep` | `sleep(ms: number): Promise<void>` | 지정한 시간(ms)만큼 대기 |
| `retry` | `retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>` | 실패 시 지수 백오프로 재시도 |

**RetryOptions**

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `attempts` | `number` | `3` | 최대 시도 횟수 |
| `delay` | `number` | `200` | 첫 재시도 대기 시간 (ms) |
| `backoff` | `number` | `2` | 재시도마다 delay에 곱할 배수 |
| `when` | `(error: unknown) => boolean` | — | 재시도 조건 함수 |

```ts
import { sleep, retry } from "simple-ts-tools";

// 300ms 대기
await sleep(300);

// 네트워크 요청 재시도 (200ms → 400ms → 800ms)
const data = await retry(
  () => fetch("/api/data").then(r => r.json()),
  { attempts: 3, delay: 200 }
);

// 5xx 에러만 재시도, 4xx는 즉시 throw
await retry(() => callApi(), {
  when: (e) => (e as Response).status >= 500,
});
```

---

### function

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `debounce` | `debounce<T>(fn: T, wait: number): T & { cancel() }` | 마지막 호출 후 wait ms 뒤에 실행 (trailing-edge) |
| `memoize` | `memoize<TArgs, TReturn>(fn, keyFn?): fn & { cache: Map; clear() }` | 인자 기준으로 결과 캐싱 |
| `pipe` | `pipe(value, ...fns): T` | 값을 함수들에 왼쪽→오른쪽으로 순서대로 통과 (최대 8단계 타입 안전) |
| `throttle` | `throttle<T>(fn: T, interval: number): T & { cancel() }` | interval ms 내 최대 한 번 실행 (leading-edge + trailing) |

```ts
import { debounce, throttle } from "simple-ts-tools";

// 검색창 — 입력 멈춘 300ms 후 API 호출
const search = debounce((q: string) => fetchResults(q), 300);
input.addEventListener("input", e => search(e.currentTarget.value));
search.cancel(); // 예약 취소

// 스크롤 핸들러 — 100ms마다 최대 한 번
const onScroll = throttle(() => updatePosition(), 100);
window.addEventListener("scroll", onScroll);
onScroll.cancel(); // 쿨다운 초기화

// 비용이 큰 계산 캐싱
const fib = memoize((n: number): number => n <= 1 ? n : fib(n - 1) + fib(n - 2));
fib(40); // 계산 실행
fib(40); // 캐시에서 즉시 반환
fib.clear(); // 캐시 초기화

// 데이터 변환 파이프라인
const result = pipe(
  rawUsers,
  users => unique(users, u => u.id),           // 중복 제거
  users => users.filter(u => u.active),         // 필터
  users => groupBy(users, u => u.role),         // 역할별 그룹핑
);

// 커스텀 키 함수로 객체 인자 처리
const getUser = memoize(
  (user: { id: number }) => fetchUser(user.id),
  (user) => String(user.id)  // 참조가 달라도 id가 같으면 캐시 히트
);
```

---

### http

| 클래스 | 설명 |
|--------|------|
| `RequestBuilder` | 컴파일 타임 안전성이 보장된 HTTP 요청 빌더 |

URL과 메서드가 모두 지정된 경우에만 `.build()` / `.send<T>()` 호출 가능 (타입 레벨 강제).

```ts
import { RequestBuilder } from "simple-ts-tools";

const request = new RequestBuilder()
  .url("https://api.example.com/users")
  .method("GET")
  .param("page", "1")
  .build();

const data = await new RequestBuilder()
  .url("https://api.example.com/users")
  .method("POST")
  .body({ name: "Alice" })
  .send<{ id: number }>();
```

---

### language

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `isAlphabet` | `isAlphabet(char: string): boolean` | 단일 문자가 알파벳인지 확인 |
| `isAlphanumeric` | `isAlphanumeric(str: string): boolean` | 문자열이 영문자·숫자로만 구성됐는지 확인 |

---

### number

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `range` | `range(start: number, end: number, step?: number): number[]` | [start, end) 범위의 숫자 배열 생성 |
| `clamp` | `clamp(value: number, min: number, max: number): number` | 값을 [min, max] 범위로 제한 |

```ts
import { range, clamp } from "simple-ts-tools";

// 페이지네이션 버튼 1~5
range(1, 6);           // [1, 2, 3, 4, 5]

// 짝수만, 2칸씩
range(0, 10, 2);       // [0, 2, 4, 6, 8]

// 역방향
range(5, 0, -1);       // [5, 4, 3, 2, 1]

// 진행률 0~100 제한
clamp(progress, 0, 100);

// 슬라이더 값 제한
clamp(inputValue, min, max);
```

---

### object

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `pick` | `pick<T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` | 지정한 키만 추출한 새 객체 반환 |
| `omit` | `omit<T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>` | 지정한 키를 제외한 새 객체 반환 |

반환 타입이 `Pick<T, K>` / `Omit<T, K>`로 정확히 추론되어 이후 코드에서 추가 타입 단언 불필요.

```ts
import { pick, omit } from "simple-ts-tools";

// API 응답에서 필요한 필드만 추출
const user = { id: 1, name: "Alice", password: "secret", token: "xyz" };
pick(user, ["id", "name"]);          // { id: 1, name: "Alice" }

// 민감 필드 제거 후 클라이언트 전달
omit(user, ["password", "token"]);   // { id: 1, name: "Alice" }
```

---

### phone

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `formatPhoneNumber` | `formatPhoneNumber(value: string): string` | 한국 전화번호를 하이픈 포맷으로 변환 |

```ts
formatPhoneNumber("01012345678"); // "010-1234-5678"
formatPhoneNumber("0212345678");  // "02-123-4567" (8자리 지역번호 형식)
```

---

### tree

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `dfs` | `dfs<T>(node: TreeNode<T>): T[]` | 트리를 DFS 후위 순회하여 값 배열 반환 |

```ts
import { dfs } from "simple-ts-tools";

dfs({ value: 1, children: [
  { value: 2, children: [] },
  { value: 3, children: [] },
]});
// [2, 3, 1]
```

---

## 개발

```bash
pnpm test          # 테스트 실행
pnpm test:watch    # 테스트 감시 모드
pnpm build         # 빌드 (dist/)
pnpm lint          # 타입 체크
```
