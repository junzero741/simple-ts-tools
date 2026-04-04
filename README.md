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
| `tuple` | `tuple<T extends unknown[]>(...args: T): T` | 인자들을 튜플 타입으로 추론 |

```ts
import { chunk, groupBy, tuple } from "simple-ts-tools";

chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

groupBy([1, 2, 3, 4], x => x % 2 === 0 ? "even" : "odd");
// { odd: [1, 3], even: [2, 4] }

tuple(1, "hello", true);
// [number, string, boolean] — 튜플로 추론됨
```

---

### function

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `debounce` | `debounce<T>(fn: T, wait: number): T & { cancel() }` | 마지막 호출 후 wait ms 뒤에 실행 (trailing-edge) |
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
