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
| `compact` | `compact<T>(arr: (T \| null \| undefined \| false \| 0 \| "")[]): T[]` | falsy 값 제거 (타입에서도 제외) |
| `countBy` | `countBy<T, K>(arr: T[], keyFn: (item: T) => K): Partial<Record<K, number>>` | 키 기준으로 등장 횟수 집계 |
| `difference` | `difference<T>(a: T[], b: T[], keyFn?): T[]` | a에만 있는 요소 반환 (차집합) |
| `keyBy` | `keyBy<T, K>(arr: T[], keyFn: (item: T) => K): Record<K, T>` | 배열을 키 함수 기준 Record로 변환 (O(1) 조회용) |
| `maxBy` | `maxBy<T>(arr: T[], keyFn: (item: T) => number): T \| undefined` | keyFn 값이 가장 큰 요소 반환 |
| `minBy` | `minBy<T>(arr: T[], keyFn: (item: T) => number): T \| undefined` | keyFn 값이 가장 작은 요소 반환 |
| `partition` | `partition<T>(arr: T[], predicate): [T[], T[]]` | predicate 기준으로 두 배열로 분리 (타입 가드 지원) |
| `sum` | `sum(arr: number[]): number` | 숫자 배열의 합 |
| `sumBy` | `sumBy<T>(arr: T[], keyFn: (item: T) => number): number` | keyFn으로 추출한 값들의 합 |
| `flatten` | `flatten<T>(arr: T[], depth?: number): FlatArray<T[], number>[]` | 중첩 배열 펼치기 (기본: 1단계) |
| `groupBy` | `groupBy<T, K>(arr: T[], keyFn: (item: T) => K): Partial<Record<K, T[]>>` | 키 추출 함수 기준으로 그룹핑 |
| `intersection` | `intersection<T>(a: T[], b: T[], keyFn?): T[]` | 양쪽 모두에 있는 요소 반환 (교집합) |
| `sortBy` | `sortBy<T>(arr: T[], keyFn: (item: T) => string \| number, order?: 'asc'\|'desc'): T[]` | 키 기준 정렬 (stable, 비파괴) |
| `tuple` | `tuple<T extends unknown[]>(...args: T): T` | 인자들을 튜플 타입으로 추론 |
| `unique` | `unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[]` | 중복 제거 (첫 등장 순서 유지) |
| `zip` | `zip<T extends unknown[][]>(...arrays: T): [...][]` | 여러 배열을 인덱스 기준으로 묶음 (최단 길이 기준) |

```ts
import { chunk, compact, flatten, groupBy, tuple, zip } from "simple-ts-tools";

chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// falsy 값 제거 — 반환 타입에서 null/undefined/false/0/"" 자동 제외
compact([0, 1, false, 2, "", 3, null, undefined]);
// [1, 2, 3]   (타입: number[])

const ids: (string | null)[] = ["a", null, "b", undefined, "c"];
const validIds: string[] = compact(ids);  // null/undefined 제거, 타입 보장

// 중첩 배열 펼치기
flatten([1, [2, [3, [4]]]]);           // [1, 2, [3, [4]]] — depth=1
flatten([1, [2, [3, [4]]]], 2);        // [1, 2, 3, [4]]
flatten([1, [2, [3]]], Infinity);      // [1, 2, 3] — 완전히 펼치기

// 여러 배열을 인덱스 기준으로 묶기 — 가장 짧은 배열 길이에 맞춤
zip([1, 2, 3], ["a", "b", "c"]);      // [[1,"a"], [2,"b"], [3,"c"]]
zip([1, 2], ["a", "b", "c"], [true]); // [[1,"a",true]] — 길이 1

// API 응답의 keys/values를 합칠 때
const keys = ["id", "name", "age"];
const values = [1, "Alice", 30];
Object.fromEntries(zip(keys, values)); // { id: 1, name: "Alice", age: 30 }

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

// 교집합 — 양쪽에 공통으로 존재하는 요소
intersection([1, 2, 3], [2, 3, 4]);                   // [2, 3]
intersection(usersA, usersB, u => u.id);              // 공통 유저
intersection(userRoles, requiredRoles).length > 0;    // 권한 체크

// 차집합 — 첫 번째에만 있는 요소
difference([1, 2, 3], [2, 3]);                        // [1]
difference(prev, next, item => item.id);              // 삭제된 항목
const added   = difference(next, prev);               // 추가된 항목
const removed = difference(prev, next);               // 삭제된 항목

sortBy(users, u => u.name);            // 이름 오름차순
sortBy(users, u => u.name, "desc");    // 이름 내림차순
sortBy(items, i => -i.price);          // 가격 내림차순 (부호 반전)

// 배열 → Record 변환 (O(1) 조회)
const users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
const userMap = keyBy(users, u => u.id);
userMap[1]; // { id: 1, name: "Alice" }
userMap[2]; // { id: 2, name: "Bob" }

// API 응답 배열을 id 기준으로 색인화할 때 자주 사용
const postMap = keyBy(posts, p => p.slug); // O(n) 한 번, 이후 O(1) 조회

// 등장 횟수 집계 — groupBy의 카운트 버전
countBy(["a", "b", "a", "c", "b", "a"], x => x);
// { a: 3, b: 2, c: 1 }

countBy(users, u => u.role);
// { admin: 2, viewer: 5, editor: 1 }

countBy([1, 2, 3, 4, 5, 6], n => n % 2 === 0 ? "even" : "odd");
// { odd: 3, even: 3 }

// 조건으로 배열 둘로 분리 — filter 두 번 대신 한 번의 순회로 처리
const [active, inactive] = partition(users, u => u.isActive);
const [passed, failed] = partition(scores, s => s >= 60);

// 타입 가드로 타입 좁히기
const values: (string | number)[] = [1, "a", 2, "b"];
const [strings, nums] = partition(values, (v): v is string => typeof v === "string");
// strings: string[], nums: number[]

// 최솟값 / 최댓값 요소 찾기 — sort 없이 O(n)
minBy(products, p => p.price);           // 가장 저렴한 상품
maxBy(articles, a => a.views);           // 조회수 가장 높은 글
minBy(events, e => e.startAt.getTime()); // 가장 이른 일정

// 합산
sum([1, 2, 3, 4, 5]);                         // 15
sumBy(cart, item => item.price * item.qty);   // 장바구니 총액
sumBy(tasks, t => t.estimatedHours);          // 총 예상 시간
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

### event

| 클래스 | 설명 |
|--------|------|
| `BehaviorSubject<T>` | 현재 값을 보유하며 변경 시 구독자에게 알리는 반응형 상태 홀더 |
| `TypedEventEmitter<TEvents>` | 이벤트 이름과 페이로드 타입이 컴파일 타임에 검증되는 pub/sub |

| 메서드 | 설명 |
|--------|------|
| `.on(event, handler)` | 핸들러 등록 |
| `.once(event, handler)` | 한 번만 실행되는 핸들러 등록 |
| `.off(event, handler)` | 핸들러 제거 |
| `.emit(event, payload)` | 이벤트 발행 |
| `.clear(event?)` | 특정 이벤트(또는 전체) 핸들러 제거 |
| `.listenerCount(event)` | 등록된 핸들러 수 |

모든 메서드는 `this`를 반환하여 체이닝 가능.

**BehaviorSubject** — 현재 값 보유 + 구독자 알림

| 메서드 / 프로퍼티 | 설명 |
|--------|------|
| `.getValue()` | 현재 값 동기 반환 |
| `.set(value)` | 새 값 설정, 동일값이면 무시 |
| `.update(fn)` | 현재 값 기반 업데이트 |
| `.subscribe(handler)` | 구독 등록 (즉시 현재 값 전달), 해제 함수 반환 |
| `.complete()` | 완료 처리, 이후 set/update 무시 |
| `.subscriberCount` | 현재 구독자 수 |

```ts
import { BehaviorSubject } from "simple-ts-tools";

// 간단한 카운터 상태
const count$ = new BehaviorSubject(0);
const unsub = count$.subscribe(v => console.log(v)); // 즉시 0 출력
count$.set(1);                  // 1 출력
count$.update(v => v + 1);     // 2 출력
unsub();                        // 구독 해제

// 객체 상태 관리
type State = { user: string | null; loading: boolean };
const state$ = new BehaviorSubject<State>({ user: null, loading: false });
state$.update(s => ({ ...s, loading: true }));
state$.update(s => ({ ...s, user: "Alice", loading: false }));
```

```ts
import { TypedEventEmitter } from "simple-ts-tools";

type AppEvents = {
  userLogin:  { userId: string; timestamp: number };
  userLogout: { userId: string };
  error:      Error;
};

const emitter = new TypedEventEmitter<AppEvents>();

// 이벤트 이름, 페이로드 타입 모두 자동 추론
emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`${userId} logged in at ${timestamp}`);
});

emitter.once("error", (err) => console.error(err.message));

emitter
  .emit("userLogin", { userId: "u1", timestamp: Date.now() })
  .emit("userLogout", { userId: "u1" });
```

---

### function

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `debounce` | `debounce<T>(fn: T, wait: number): T & { cancel() }` | 마지막 호출 후 wait ms 뒤에 실행 (trailing-edge) |
| `memoize` | `memoize<TArgs, TReturn>(fn, keyFn?): fn & { cache: Map; clear() }` | 인자 기준으로 결과 캐싱 |
| `once` | `once<TArgs, TReturn>(fn): fn & { reset() }` | 최초 한 번만 실행, 이후 호출은 첫 결과 반환 |
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

// 초기화 코드를 딱 한 번만 실행
const initDB = once(() => connectDatabase());
await initDB(); // 실행
await initDB(); // 동일한 Promise 반환, 재연결 없음
initDB.reset(); // 상태 초기화

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
| `clamp` | `clamp(value: number, min: number, max: number): number` | 값을 [min, max] 범위로 제한 |
| `randomInt` | `randomInt(min: number, max: number): number` | [min, max] 범위의 정수 난수 (양 끝 포함) |
| `range` | `range(start: number, end: number, step?: number): number[]` | [start, end) 범위의 숫자 배열 생성 |
| `round` | `round(value: number, decimals?: number): number` | 소수 자릿수 반올림 (부동소수점 오차 보정) |

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
| `deepClone` | `deepClone<T>(value: T): T` | 재귀적 깊은 복사 (Date/Map/Set/RegExp 포함) |
| `deepEqual` | `deepEqual(a: unknown, b: unknown): boolean` | 재귀적 깊은 동등 비교 |
| `deepMerge` | `deepMerge<T, S>(target: T, source: S): T & S` | 두 plain 객체를 재귀적으로 병합 (배열은 source로 덮어씀) |
| `mapKeys` | `mapKeys<V>(obj: Record<string, V>, keyFn: (key: string) => string): Record<string, V>` | 모든 키에 변환 함수 적용 |
| `mapValues` | `mapValues<T, U>(obj: T, valueFn: (value, key) => U): Record<string, U>` | 모든 값에 변환 함수 적용 |
| `omit` | `omit<T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>` | 지정한 키를 제외한 새 객체 반환 |
| `omitBy` | `omitBy<T>(obj: T, predicate: (value, key) => boolean): Partial<T>` | predicate 통과 항목을 제외한 새 객체 반환 |
| `pick` | `pick<T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` | 지정한 키만 추출한 새 객체 반환 |
| `pickBy` | `pickBy<T>(obj: T, predicate: (value, key) => boolean): Partial<T>` | predicate 통과 항목만 추출한 새 객체 반환 |

반환 타입이 `Pick<T, K>` / `Omit<T, K>`로 정확히 추론되어 이후 코드에서 추가 타입 단언 불필요.

```ts
import { pick, omit, pickBy, omitBy } from "simple-ts-tools";

// API 응답에서 필요한 필드만 추출
const user = { id: 1, name: "Alice", password: "secret", token: "xyz" };
pick(user, ["id", "name"]);          // { id: 1, name: "Alice" }

// 민감 필드 제거 후 클라이언트 전달
omit(user, ["password", "token"]);   // { id: 1, name: "Alice" }

// 값 조건으로 필터링 — null/undefined 제거
const config = { host: "localhost", port: 3000, debug: null, timeout: undefined };
pickBy(config, v => v != null);      // { host: "localhost", port: 3000 }
omitBy(config, v => v == null);      // 동일한 결과 (omitBy는 pickBy의 반전)

// 키 조건으로 필터링 — private 필드 제거
const dto = { _id: "abc", name: "Alice", _version: 2, age: 30 };
omitBy(dto, (_, k) => String(k).startsWith("_")); // { name: "Alice", age: 30 }

// 깊은 복사 — 불변 상태 업데이트
const next = deepClone(state);
next.user.scores.push(30); // state.user.scores는 변하지 않음

// 키 일괄 변환 — API snake_case → camelCase
mapKeys({ background_color: "#fff", font_size: 16 }, kebabToCamel);
// { backgroundColor: "#fff", fontSize: 16 }

// 값 일괄 변환
mapValues({ a: "1", b: "2" }, Number);        // { a: 1, b: 2 }
mapValues({ a: 1, b: 2 }, (v, k) => `${k}=${v}`); // { a: "a=1", b: "b=2" }

// 깊은 동등 비교 — ===으로 안 되는 타입들
deepEqual({ a: [1, 2] }, { a: [1, 2] });                          // true
deepEqual(new Date("2024-01-01"), new Date("2024-01-01"));         // true
deepEqual(new Map([["k", 1]]), new Map([["k", 1]]));               // true
deepEqual([], {});                                                  // false

// 재귀적 병합 — plain 객체끼리만 재귀, 배열·Date 등은 source로 덮어씀
const defaults = { host: "localhost", port: 3000, db: { name: "dev", pool: 5 } };
const userConfig = { port: 8080, db: { name: "prod" } };
deepMerge(defaults, userConfig);
// { host: "localhost", port: 8080, db: { name: "prod", pool: 5 } }

// 중첩 상태 부분 업데이트
deepMerge(state, { ui: { theme: "dark" } });
// state의 다른 ui 필드는 유지, theme만 변경
```

---

### result

타입 안전한 에러 처리 패턴. 함수가 `throw` 대신 `Result`를 반환하면 호출자가 에러 케이스를 **반드시** 처리해야 한다 (컴파일러가 강제).

| API | 설명 |
|-----|------|
| `ok<T>(value)` | `Ok<T>` 생성 |
| `err<E>(error)` | `Err<E>` 생성 |
| `tryCatch(fn)` | 동기 함수 실행 → `Result<T, unknown>` |
| `tryCatchAsync(fn)` | 비동기 함수 실행 → `Promise<Result<T, unknown>>` |
| `mapResult(result, fn)` | Ok이면 값 변환, Err이면 그대로 전파 |
| `unwrapOr(result, fallback)` | Ok면 value, Err면 fallback 반환 |

```ts
import { ok, err, tryCatch, tryCatchAsync, mapResult, unwrapOr } from "simple-ts-tools";

// 반환 타입으로 에러 가능성을 명시
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("division by zero");
  return ok(a / b);
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5 — 타입: number
} else {
  console.error(result.error); // 타입: string
}

// JSON.parse 같은 throw 가능 함수를 안전하게 감싸기
const parsed = tryCatch(() => JSON.parse(rawInput));
const value = unwrapOr(parsed, {});

// 비동기 API 호출
const data = await tryCatchAsync(() =>
  new RequestBuilder().url("/api/users").method("GET").send<User[]>()
);
const users = mapResult(data, us => us.filter(u => u.active));
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

### string

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `camelToKebab` | `camelToKebab(str: string): string` | camelCase/PascalCase → kebab-case (약어 처리 포함) |
| `capitalize` | `capitalize(str: string): string` | 첫 글자 대문자, 나머지 소문자 |
| `formatBytes` | `formatBytes(bytes: number, decimals?: number): string` | 바이트 수를 사람이 읽기 좋은 단위로 변환 (B/KB/MB/GB/TB) |
| `isEmpty` | `isEmpty(value: string \| null \| undefined): boolean` | 빈 문자열·공백·null·undefined이면 true |
| `kebabToCamel` | `kebabToCamel(str: string): string` | kebab-case → camelCase |
| `truncate` | `truncate(str: string, maxLength: number, suffix?: string): string` | maxLength 초과 시 suffix(기본 "…")를 붙여 잘라냄 |

```ts
import { isEmpty, truncate, capitalize } from "simple-ts-tools";

// 폼 유효성 검사
isEmpty("");          // true
isEmpty("   ");       // true
isEmpty(null);        // true
isEmpty("hello");     // false

// 카드/리스트 제목 표시
truncate("긴 제목이 넘칩니다", 8);          // "긴 제목이 넘…"
truncate("Hello, World!", 8, "...");        // "Hello..."

// 표시용 문자열 정규화
capitalize("hELLO wORLD");  // "Hello world"

// CSS 클래스명 / API 필드명 변환
camelToKebab("backgroundColor");    // "background-color"
camelToKebab("XMLParser");           // "xml-parser"     ← 약어 처리
camelToKebab("getHTTPSResponse");    // "get-https-response"
kebabToCamel("background-color");    // "backgroundColor"
kebabToCamel(camelToKebab("myProp")); // "myProp" (왕복 가능)

// 파일 크기를 사람이 읽기 좋은 단위로 표시
formatBytes(0);               // "0 B"
formatBytes(1024);            // "1 KB"
formatBytes(1536);            // "1.5 KB"
formatBytes(1048576);         // "1 MB"
formatBytes(1234567, 1);      // "1.2 MB"
formatBytes(1024 ** 3);       // "1 GB"

// 업로드 UI, 파일 탐색기에서 자주 사용
`파일 크기: ${formatBytes(file.size)}` // "파일 크기: 2.34 MB"
```

---

### tree

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `bfs` | `bfs<T>(root: TreeNode<T>): T[]` | 트리를 BFS(레벨 순서)로 탐색하여 값 배열 반환 |
| `dfs` | `dfs<T>(node: TreeNode<T>): T[]` | 트리를 DFS 후위 순회하여 값 배열 반환 |

```ts
import { bfs, dfs } from "simple-ts-tools";

//      1
//    /   \
//   2     3
//  / \
// 4   5

const tree = { value: 1, children: [
  { value: 2, children: [
    { value: 4, children: [] },
    { value: 5, children: [] },
  ]},
  { value: 3, children: [] },
]};

// BFS — 레벨 순서 (너비 우선)
bfs(tree);  // [1, 2, 3, 4, 5]

// DFS — 후위 순회 (깊이 우선)
dfs(tree);  // [4, 5, 2, 3, 1]

// 활용: 최단 경로 탐색, 레벨별 처리에는 bfs
// 활용: 하위 노드부터 처리해야 할 때 (예: 트리 삭제, 크기 계산)는 dfs
```

---

### cache

| 클래스 | 설명 |
|--------|------|
| `LRUCache<K, V>` | 용량 제한 캐시. 초과 시 가장 오래 전에 사용된 항목 자동 제거 |

| 메서드 / 프로퍼티 | 설명 |
|--------|------|
| `new LRUCache(capacity)` | 최대 저장 항목 수 지정 (양의 정수) |
| `.get(key)` | 값 반환, 없으면 `undefined`. 조회 시 최근 사용으로 갱신 |
| `.set(key, value)` | 값 저장. 기존 키면 갱신 후 최근 사용으로 이동. 체이닝 가능 |
| `.has(key)` | 키 존재 여부 확인 (순서 변경 없음) |
| `.delete(key)` | 항목 제거, 성공 여부 반환 |
| `.clear()` | 전체 비우기 |
| `.size` | 현재 항목 수 |

내부적으로 `Map`의 삽입 순서를 활용해 get/set 모두 **O(1)** 으로 동작한다.

```ts
import { LRUCache } from "simple-ts-tools";

// API 응답 캐싱 — 최대 100개, 초과 시 오래된 것부터 제거
const apiCache = new LRUCache<string, Response>(100);

async function fetchUser(id: string) {
  const cached = apiCache.get(id);
  if (cached) return cached;
  const data = await fetch(`/api/users/${id}`).then(r => r.json());
  apiCache.set(id, data);
  return data;
}

// 계산 비용이 큰 함수 결과 캐싱
const imgCache = new LRUCache<string, HTMLImageElement>(50);

// 연속된 조회에서 LRU 동작 확인
const cache = new LRUCache<string, number>(2);
cache.set("a", 1).set("b", 2);
cache.get("a");       // "a"가 최근 사용으로 갱신
cache.set("c", 3);    // 용량 초과 → "b"(가장 오래됨)가 제거
cache.has("b");       // false
cache.has("a");       // true
```

---

## 개발

```bash
pnpm test          # 테스트 실행
pnpm test:watch    # 테스트 감시 모드
pnpm build         # 빌드 (dist/)
pnpm lint          # 타입 체크
```
