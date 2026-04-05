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
| `first` | `first<T>(arr: T[]): T \| undefined` | 첫 번째 요소 반환 (빈 배열 → `undefined`) |
| `last` | `last<T>(arr: T[]): T \| undefined` | 마지막 요소 반환 (빈 배열 → `undefined`) |
| `move` | `move<T>(arr: T[], from: number, to: number): T[]` | 요소를 from → to 인덱스로 이동 (비파괴) |
| `paginate` | `paginate<T>(arr: T[], page: number, pageSize: number): PaginationResult<T>` | 배열 페이지네이션 (data·total·totalPages·hasNext·hasPrev) |
| `toggle` | `toggle<T>(arr: T[], item: T, keyFn?): T[]` | 없으면 추가, 있으면 제거 (비파괴) |
| `countBy` | `countBy<T, K>(arr: T[], keyFn: (item: T) => K): Partial<Record<K, number>>` | 키 기준으로 등장 횟수 집계 |
| `difference` | `difference<T>(a: T[], b: T[], keyFn?): T[]` | a에만 있는 요소 반환 (차집합) |
| `keyBy` | `keyBy<T, K>(arr: T[], keyFn: (item: T) => K): Record<K, T>` | 배열을 키 함수 기준 Record로 변환 (O(1) 조회용) |
| `maxBy` | `maxBy<T>(arr: T[], keyFn: (item: T) => number): T \| undefined` | keyFn 값이 가장 큰 요소 반환 |
| `minBy` | `minBy<T>(arr: T[], keyFn: (item: T) => number): T \| undefined` | keyFn 값이 가장 작은 요소 반환 |
| `partition` | `partition<T>(arr: T[], predicate): [T[], T[]]` | predicate 기준으로 두 배열로 분리 (타입 가드 지원) |
| `sample` | `sample<T>(arr: T[]): T \| undefined` | 배열에서 무작위로 한 요소 반환 |
| `sampleSize` | `sampleSize<T>(arr: T[], n: number): T[]` | 중복 없이 무작위로 n개 반환 |
| `shuffle` | `shuffle<T>(arr: T[]): T[]` | Fisher-Yates 알고리즘으로 섞은 새 배열 반환 (비파괴) |
| `sum` | `sum(arr: number[]): number` | 숫자 배열의 합 |
| `sumBy` | `sumBy<T>(arr: T[], keyFn: (item: T) => number): number` | keyFn으로 추출한 값들의 합 |
| `flatten` | `flatten<T>(arr: T[], depth?: number): FlatArray<T[], number>[]` | 중첩 배열 펼치기 (기본: 1단계) |
| `groupBy` | `groupBy<T, K>(arr: T[], keyFn: (item: T) => K): Partial<Record<K, T[]>>` | 키 추출 함수 기준으로 그룹핑 |
| `intersection` | `intersection<T>(a: T[], b: T[], keyFn?): T[]` | 양쪽 모두에 있는 요소 반환 (교집합) |
| `sortBy` | `sortBy<T>(arr: T[], keyFn: (item: T) => string \| number, order?: 'asc'\|'desc'): T[]` | 키 기준 정렬 (stable, 비파괴) |
| `tuple` | `tuple<T extends unknown[]>(...args: T): T` | 인자들을 튜플 타입으로 추론 |
| `unique` | `unique<T>(arr: T[], keyFn?: (item: T) => unknown): T[]` | 중복 제거 (첫 등장 순서 유지) |
| `zip` | `zip<T extends unknown[][]>(...arrays: T): [...][]` | 여러 배열을 인덱스 기준으로 묶음 (최단 길이 기준) |
| `take` | `take<T>(arr: T[], n: number): T[]` | 앞에서 n개 반환 |
| `drop` | `drop<T>(arr: T[], n: number): T[]` | 앞에서 n개 제거한 나머지 반환 |
| `takeLast` | `takeLast<T>(arr: T[], n: number): T[]` | 뒤에서 n개 반환 |
| `dropLast` | `dropLast<T>(arr: T[], n: number): T[]` | 뒤에서 n개 제거한 나머지 반환 |
| `takeWhile` | `takeWhile<T>(arr: T[], predicate: (item: T) => boolean): T[]` | predicate가 true인 동안 앞에서부터 수집 |
| `dropWhile` | `dropWhile<T>(arr: T[], predicate: (item: T) => boolean): T[]` | predicate가 true인 동안 앞에서부터 건너뜀 |

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

// 배열 무작위 셔플 (비파괴 — Fisher-Yates)
shuffle([1, 2, 3, 4, 5]);          // [3, 1, 5, 2, 4] (무작위)

// 무작위 1개 선택
sample(["A", "B", "C", "D"]);      // "B" (무작위)

// 중복 없이 n개 선택
sampleSize([1, 2, 3, 4, 5], 3);    // [4, 1, 3] (무작위 3개)
sampleSize(questions, 5);           // 시험 문제 랜덤 출제

// 안전한 first / last (빈 배열에서도 throw 없음)
first([1, 2, 3]);   // 1
last([1, 2, 3]);    // 3
first([]);          // undefined
last([]);           // undefined

// drag-and-drop 순서 변경 — 비파괴
const tasks = ["Task A", "Task B", "Task C", "Task D"];
move(tasks, 2, 0);  // ["Task C", "Task A", "Task B", "Task D"]
move(tasks, 0, 3);  // ["Task B", "Task C", "Task D", "Task A"]

// 멀티셀렉트 토글 — 있으면 제거, 없으면 추가
toggle(["react", "typescript"], "vue");     // ["react", "typescript", "vue"]
toggle(["react", "typescript"], "react");   // ["typescript"]

// 객체 배열 토글 — keyFn으로 비교 기준 지정
const selected = [{ id: 1 }, { id: 2 }];
toggle(selected, { id: 2 }, x => x.id);  // [{ id: 1 }]      (제거)
toggle(selected, { id: 3 }, x => x.id);  // [..., { id: 3 }] (추가)

// take / drop — 앞에서 자르기
take([1, 2, 3, 4, 5], 3);    // [1, 2, 3]
drop([1, 2, 3, 4, 5], 2);    // [3, 4, 5]
takeLast([1, 2, 3, 4, 5], 2); // [4, 5]
dropLast([1, 2, 3, 4, 5], 2); // [1, 2, 3]

// takeWhile / dropWhile — 조건이 만족되는 동안
takeWhile([1, 2, 3, 4, 1], x => x < 3);  // [1, 2]
dropWhile([1, 2, 3, 4, 1], x => x < 3);  // [3, 4, 1]

// 실사용: 조건 충족 전까지의 로그 수집
const errorsBeforeTimeout = takeWhile(logs, log => log.level !== "fatal");

// 초기 로딩 스피너 이후의 이벤트만 처리
const eventsAfterReady = dropWhile(events, e => e.type !== "ready");

// 실사용: 최신 5개 알림만 표시
take(notifications.reverse(), 5);

// 첫 번째 페이지를 제외하고 나머지 로드
drop(allPages, 1);

// 페이지네이션 — 리스트 UI에서 매번 직접 계산하던 것을 한 번에
const posts = Array.from({ length: 53 }, (_, i) => ({ id: i + 1 }));

const page1 = paginate(posts, 1, 10);
// { data: [{id:1},...,{id:10}], total: 53, page: 1, pageSize: 10,
//   totalPages: 6, hasNext: true, hasPrev: false }

const page6 = paginate(posts, 6, 10);
// { data: [{id:51},{id:52},{id:53}], hasNext: false, hasPrev: true }

// 실사용: React 컴포넌트
const { data, totalPages, hasNext, hasPrev } = paginate(allItems, currentPage, 20);
```

---

### async

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `createDeferred` | `createDeferred<T>(): Deferred<T>` | 외부에서 resolve/reject 가능한 Promise 객체 생성 |
| `mapAsync` | `mapAsync<T, R>(arr: T[], fn, options?): Promise<R[]>` | 동시성 제한 병렬 처리 (기본: 제한 없음) |
| `memoizeAsync` | `memoizeAsync<TArgs, TReturn>(fn, options?): MemoizedFn` | 비동기 함수 캐싱 (TTL·maxSize·thundering herd 방지) |
| `retry` | `retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>` | 실패 시 지수 백오프로 재시도 |
| `sleep` | `sleep(ms: number): Promise<void>` | 지정한 시간(ms)만큼 대기 |
| `timeout` | `timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>` | 타임아웃 초과 시 reject |

**MemoizeAsyncOptions**

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `ttl` | `number` | — | 캐시 만료 시간 (ms). 미지정 시 영구 캐시 |
| `maxSize` | `number` | — | 최대 캐시 항목 수. 초과 시 FIFO 제거 |
| `keyFn` | `(...args) => string` | `JSON.stringify` | 캐시 키 생성 함수 |

**RetryOptions**

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `attempts` | `number` | `3` | 최대 시도 횟수 |
| `delay` | `number` | `200` | 첫 재시도 대기 시간 (ms) |
| `backoff` | `number` | `2` | 재시도마다 delay에 곱할 배수 |
| `when` | `(error: unknown) => boolean` | — | 재시도 조건 함수 |

```ts
import { mapAsync, sleep, retry } from "simple-ts-tools";

// 동시성 제한 병렬 처리 — 외부 API rate limit 대응
const users = await mapAsync(
  userIds,
  id => fetchUser(id),
  { concurrency: 3 }   // 최대 3개 동시 실행
);

// concurrency 미지정 = Promise.all과 동일
const results = await mapAsync(items, item => processItem(item));

// index 활용
const indexed = await mapAsync(rows, async (row, i) => ({ ...row, rank: i + 1 }));

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

// 타임아웃 — 지정 시간 내 완료 안 되면 reject
const data = await timeout(fetch("/api/slow"), 3000);
await timeout(heavyJob(), 5000, "처리 시간 초과");

// retry와 조합 — 타임아웃 걸린 요청도 재시도
await retry(() => timeout(fetchData(), 2000), { attempts: 3 });

// Deferred — 외부에서 제어 가능한 Promise
const ready = createDeferred<void>();

// 이벤트 기반 코드를 Promise로 변환
const loaded = createDeferred<string>();
image.onload = () => loaded.resolve(image.src);
image.onerror = (e) => loaded.reject(e);
const src = await loaded.promise;

// 두 비동기 흐름 사이 핸드셰이크
const serverReady = createDeferred<void>();
server.on("listen", () => serverReady.resolve());
await serverReady.promise;
// 이제 서버가 준비됨을 보장하고 다음 단계 진행

// 상태 확인
ready.status; // "pending" | "fulfilled" | "rejected"

// 중복 호출 안전 — resolve/reject 이후 추가 호출은 무시됨
ready.resolve();
ready.resolve(); // no-op

// memoizeAsync — 비동기 함수 캐싱
const getUser = memoizeAsync(fetchUser, { ttl: 60_000 });
await getUser(1); // 네트워크 요청
await getUser(1); // 60초 내 → 캐시 반환 (fn 재호출 없음)

// maxSize: LRU-like 항목 수 제한
const getProduct = memoizeAsync(fetchProduct, { ttl: 30_000, maxSize: 100 });

// thundering herd 자동 방지
// 같은 키 동시 호출 → 단 한 번만 실행, 결과는 모두에게 공유
const [a, b, c] = await Promise.all([getUser(1), getUser(1), getUser(1)]);
// fetchUser는 한 번만 호출됨

// 특정 키 무효화 (예: 데이터 수정 후)
await updateUser(1, newData);
getUser.invalidate(1); // 다음 호출 시 재조회

// 전체 캐시 초기화
getUser.clear();

// keyFn 커스터마이즈 — 역할에 무관하게 id 기준 캐싱
const getPermissions = memoizeAsync(fetchPermissions, {
  keyFn: (user) => user.id,
  ttl: 5 * 60_000,
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
| `compose` | `compose(...fns): (a: A) => R` | 함수들을 오른쪽→왼쪽으로 합성해 재사용 가능한 변환 함수 반환 (최대 8단계 타입 안전) |
| `curry` | `curry(fn): CurriedFn` | 함수를 커리화 — 인자를 하나씩 받아 마지막까지 받으면 실행 (2~4인자 완전 타입 추론) |
| `debounce` | `debounce<T>(fn: T, wait: number): T & { cancel() }` | 마지막 호출 후 wait ms 뒤에 실행 (trailing-edge) |
| `memoize` | `memoize<TArgs, TReturn>(fn, keyFn?): fn & { cache: Map; clear() }` | 인자 기준으로 결과 캐싱 |
| `once` | `once<TArgs, TReturn>(fn): fn & { reset() }` | 최초 한 번만 실행, 이후 호출은 첫 결과 반환 |
| `pipe` | `pipe(value, ...fns): T` | 값을 함수들에 왼쪽→오른쪽으로 순서대로 통과 (최대 8단계 타입 안전) |
| `throttle` | `throttle<T>(fn: T, interval: number): T & { cancel() }` | interval ms 내 최대 한 번 실행 (leading-edge + trailing) |

```ts
import { curry, debounce, throttle, pipe } from "simple-ts-tools";

// compose — 재사용 가능한 변환 함수 조립 (오른쪽 → 왼쪽)
const double  = (n: number) => n * 2;
const addOne  = (n: number) => n + 1;
const square  = (n: number) => n * n;

compose(double, addOne, square)(3);
// square(3)=9 → addOne(9)=10 → double(10)=20

// pipe와의 차이:
// pipe(3, square, addOne, double)  → 값을 즉시 통과 (일회성)
// compose(double, addOne, square)  → 재사용 가능한 함수 반환

// .map()과 함께 사용 — 핵심 강점
[1, 2, 3].map(compose(double, addOne)); // [4, 6, 8]

// 재사용 가능한 정규화 파이프라인
const normalizeUsername = compose(
  (s: string) => s.replace(/[^a-z0-9]/g, ""),
  (s: string) => s.toLowerCase(),
  (s: string) => s.trim(),
);
users.map(u => ({ ...u, username: normalizeUsername(u.username) }));

// 커링과 조합 — 설정 가능한 변환 합성
const clamp = (max: number) => (n: number) => Math.min(n, max);
const round2 = (n: number) => Math.round(n * 100) / 100;
const processPrice = compose(clamp(999.99), round2);
prices.map(processPrice);

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

// curry — 부분 적용으로 재사용 가능한 함수 생성
const add = curry((a: number, b: number) => a + b);
const add10 = add(10);
add10(5);   // 15
add10(20);  // 30

const clampRange = curry(
  (min: number, max: number, v: number) => Math.min(Math.max(v, min), max)
);
const clamp0to100 = clampRange(0)(100);
clamp0to100(150); // 100

// curry + pipe 조합 — 선언적 데이터 변환
const multiply = curry((factor: number, n: number) => n * factor) as
  (factor: number) => (n: number) => number;
const double = multiply(2);
const triple = multiply(3);

pipe(5, double, triple); // 30  (5 → 10 → 30)
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
| `isArray` | `isArray(value: unknown): value is unknown[]` | 배열 여부 확인 |
| `isBoolean` | `isBoolean(value: unknown): value is boolean` | boolean 여부 확인 |
| `isDefined` | `isDefined<T>(value: T): value is NonNullable<T>` | null/undefined가 아닌지 확인 — 타입을 NonNullable로 좁힘 |
| `isEmail` | `isEmail(value: string): boolean` | 이메일 형식 검증 |
| `isFunction` | `isFunction(value: unknown): value is Function` | 함수 여부 확인 |
| `isNil` | `isNil(value: unknown): value is null \| undefined` | null 또는 undefined 여부 확인 |
| `isNumber` | `isNumber(value: unknown): value is number` | number 여부 확인 (NaN은 false) |
| `isObject` | `isObject(value: unknown): value is Record<string, unknown>` | plain 객체 여부 (null·Array·Date 등은 false) |
| `isString` | `isString(value: unknown): value is string` | string 여부 확인 |
| `isUrl` | `isUrl(value: string, allowedProtocols?: string[]): boolean` | URL 형식 검증 (기본: http/https만 허용) |

```ts
import { isEmail, isUrl } from "simple-ts-tools";

// 폼 검증
isEmail("user@example.com");      // true
isEmail("user+tag@co.kr");        // true
isEmail("user@");                 // false
isEmail("@example.com");          // false

isUrl("https://example.com");     // true
isUrl("http://localhost:3000");   // true
isUrl("ftp://files.example.com"); // false (기본은 http/https만)
isUrl("ftp://files.example.com", ["ftp:"]); // true

// XSS 방지 — javascript: URL 차단
isUrl("javascript:alert(1)");     // false

// 타입 가드 — 런타임 타입 좁히기
isNil(null);        // true
isNil(0);           // false
isDefined("hello"); // true

// filter와 조합 시 반환 타입이 자동으로 좁혀짐
const values: (string | null | undefined)[] = ["a", null, "b", undefined];
const strings = values.filter(isDefined); // string[]

// 런타임 타입 분기
function process(value: unknown) {
  if (isString(value)) return value.toUpperCase();  // string으로 좁혀짐
  if (isNumber(value)) return value.toFixed(2);     // number로 좁혀짐
  if (isArray(value))  return value.length;
  if (isObject(value)) return Object.keys(value).length;
}

isNumber(NaN);        // false — NaN 방어
isObject([]);         // false — Array는 plain 객체가 아님
isObject(new Date()); // false — 인스턴스는 제외
```

---

### number

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `clamp` | `clamp(value: number, min: number, max: number): number` | 값을 [min, max] 범위로 제한 |
| `formatNumber` | `formatNumber(value: number, options?): string` | 천단위 구분·소수점·통화·compact 포맷 |
| `lerp` | `lerp(start: number, end: number, t: number): number` | 두 값 사이의 선형 보간 (t=0→start, t=1→end) |
| `normalize` | `normalize(value: number, min: number, max: number, clamp?: boolean): number` | [min, max] → [0, 1] 정규화 |
| `percentage` | `percentage(value: number, total: number, decimals?: number): number` | value가 total에서 차지하는 백분율 |
| `randomInt` | `randomInt(min: number, max: number): number` | [min, max] 범위의 정수 난수 (양 끝 포함) |
| `range` | `range(start: number, end: number, step?: number): number[]` | [start, end) 범위의 숫자 배열 생성 |
| `round` | `round(value: number, decimals?: number): number` | 소수 자릿수 반올림 (부동소수점 오차 보정) |
| `toOrdinal` | `toOrdinal(n: number): string` | 숫자에 영어 서수 접미사 추가 (1st, 2nd, 3rd, 11th …) |
| `sum` | `sum(nums: number[]): number` | 숫자 배열의 합 (빈 배열 → 0) |
| `mean` | `mean(nums: number[]): number` | 산술 평균 (빈 배열 → NaN) |
| `median` | `median(nums: number[]): number` | 중앙값 (빈 배열 → NaN, 원본 불변) |
| `mode` | `mode(nums: number[]): number[]` | 최빈값 배열 (공동 최빈값 모두 반환) |
| `variance` | `variance(nums: number[], sample?: boolean): number` | 분산 (기본: 모집단, sample=true: 표본) |
| `stddev` | `stddev(nums: number[], sample?: boolean): number` | 표준편차 (기본: 모집단) |

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

// 숫자 포맷 — Intl.NumberFormat 기반
formatNumber(1234567);                             // "1,234,567"
formatNumber(1234567.89, { decimals: 2 });         // "1,234,567.89"
formatNumber(50000, { currency: "KRW" });          // "₩50,000"
formatNumber(9900000, { notation: "compact" });    // "990만" (ko-KR)
formatNumber(1234567, { locale: "en-US", decimals: 2 }); // "1,234,567.00"

// lerp — 선형 보간 (애니메이션, UI 전환)
lerp(0, 100, 0.5);    // 50
lerp(10, 20, 0.25);   // 12.5
lerp(0, 255, 0.8);    // 204  ← 색상 채널 보간

// normalize — [min, max] → [0, 1] (스코어 정규화, 게이지 UI)
normalize(50, 0, 100);          // 0.5
normalize(75, 0, 100);          // 0.75
normalize(150, 0, 100);         // 1.5  ← 범위 초과 허용
normalize(150, 0, 100, true);   // 1    ← clamp: true로 제한
normalize(0, 0, 0);             // 0    ← min === max 안전 처리

// percentage — 백분율 계산 (진행률, 통계 UI)
percentage(37, 50);             // 74
percentage(1, 3, 1);            // 33.3
percentage(2, 3, 2);            // 66.67
percentage(10, 0);              // 0   ← total=0 안전 처리

// 실사용: 업로드 진행률
const progress = percentage(uploadedBytes, totalBytes, 1);
// "74.5%"

// 영어 서수 — 리더보드, 순위, 날짜 표시
toOrdinal(1);    // "1st"
toOrdinal(2);    // "2nd"
toOrdinal(3);    // "3rd"
toOrdinal(4);    // "4th"
toOrdinal(11);   // "11th"  ← 예외
toOrdinal(21);   // "21st"
toOrdinal(112);  // "112th" ← 예외 (끝 두 자리 12)

// 실사용
`${toOrdinal(rank)} place`;          // "1st place"
`${toOrdinal(day)} of December`;     // "25th of December"
rankings.map((u, i) => `${toOrdinal(i+1)}: ${u.name}`);

// 통계 함수 — 대시보드, 성적 분석, 데이터 시각화
const scores = [70, 80, 85, 90, 95];
sum(scores);                          // 420
mean(scores);                         // 84
median(scores);                       // 85
mode([1, 2, 2, 3]);                   // [2]
mode([1, 1, 2, 2]);                   // [1, 2]  공동 최빈값

// 분산 & 표준편차 — 데이터 분포도 측정
const data = [2, 4, 4, 4, 5, 5, 7, 9];
variance(data);               // 4       (모집단 분산, n으로 나눔)
variance(data, true);         // 4.571   (표본 분산, n-1로 나눔 — Bessel 보정)
stddev(data);                 // 2       (모집단 표준편차)
stddev(data, true);           // 2.138   (표본 표준편차)

// 실사용: 성적 편차 계산
const classStdDev = stddev(scores);   // 8.60
const zScore = (score - mean(scores)) / classStdDev;
```

---

### object

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `deepClone` | `deepClone<T>(value: T): T` | 재귀적 깊은 복사 (Date/Map/Set/RegExp 포함) |
| `deepEqual` | `deepEqual(a: unknown, b: unknown): boolean` | 재귀적 깊은 동등 비교 |
| `deepMerge` | `deepMerge<T, S>(target: T, source: S): T & S` | 두 plain 객체를 재귀적으로 병합 (배열은 source로 덮어씀) |
| `flattenObject` | `flattenObject(obj, separator?): Record<string, unknown>` | 중첩 객체 → 점 구분자 평탄 키 (`{ "a.b.c": 1 }`) |
| `unflattenObject` | `unflattenObject(obj, separator?): Record<string, unknown>` | 평탄 키 → 중첩 객체 복원 (왕복 가능) |
| `getIn` | `getIn(obj: unknown, path: string): unknown` | 점 구분자 경로로 중첩 값 읽기 (없으면 `undefined`) |
| `setIn` | `setIn<T>(obj: T, path: string, value: unknown): T` | 점 구분자 경로에 값 설정한 새 객체 반환 (불변) |
| `hasIn` | `hasIn(obj: unknown, path: string): boolean` | 점 구분자 경로가 존재하는지 확인 |
| `fromPairs` | `fromPairs<K, V>(pairs: [K, V][]): Record<K, V>` | [키, 값] 튜플 배열 → 객체 |
| `invert` | `invert<K, V>(obj: Record<K, V>): Record<string, K>` | 키와 값을 뒤집은 새 객체 반환 |
| `toPairs` | `toPairs<T>(obj: T): [keyof T, T[keyof T]][]` | 객체 → [키, 값] 튜플 배열 |
| `mapKeys` | `mapKeys<V>(obj: Record<string, V>, keyFn: (key: string) => string): Record<string, V>` | 모든 키에 변환 함수 적용 |
| `mapValues` | `mapValues<T, U>(obj: T, valueFn: (value, key) => U): Record<string, U>` | 모든 값에 변환 함수 적용 |
| `omit` | `omit<T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>` | 지정한 키를 제외한 새 객체 반환 |
| `omitBy` | `omitBy<T>(obj: T, predicate: (value, key) => boolean): Partial<T>` | predicate 통과 항목을 제외한 새 객체 반환 |
| `pick` | `pick<T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>` | 지정한 키만 추출한 새 객체 반환 |
| `pickBy` | `pickBy<T>(obj: T, predicate: (value, key) => boolean): Partial<T>` | predicate 통과 항목만 추출한 새 객체 반환 |
| `diff` | `diff(a, b: Record<string, unknown>): DiffResult` | 두 객체의 얕은 diff — added/removed/changed 반환 |
| `isDiffEmpty` | `isDiffEmpty(result: DiffResult): boolean` | diff 결과에 변경사항이 없으면 true |

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

// 키-값 반전 — 코드 ↔ 이름 양방향 조회
const StatusCode = { OK: 200, NOT_FOUND: 404, SERVER_ERROR: 500 };
const byCode = invert(StatusCode);
byCode[200];    // "OK"
byCode[404];    // "NOT_FOUND"

// 열거형을 반전해 디버깅 메시지 생성
const ErrorCode = { INVALID_INPUT: "E001", NOT_FOUND: "E002" };
const codeToName = invert(ErrorCode);
codeToName["E001"]; // "INVALID_INPUT"

// 객체 ↔ [키, 값] 배열 변환 — 변환 파이프라인에서 유용
const prices = { apple: 300, banana: 150, cherry: 500 };

// 300원 이상만 유지
const expensive = fromPairs(
  toPairs(prices).filter(([, price]) => price >= 300) as [string, number][]
);
// { apple: 300, cherry: 500 }

// 값에 부가세 적용
const withTax = fromPairs(
  toPairs(prices).map(([k, v]) => [k, Math.round(v * 1.1)]) as [string, number][]
);
// { apple: 330, banana: 165, cherry: 550 }

// 중첩 객체 평탄화 — dotenv, 설정 파일, 폼 상태 직렬화
flattenObject({ a: { b: { c: 1 }, d: 2 } });
// { "a.b.c": 1, "a.d": 2 }

flattenObject({ user: { name: "Alice", address: { city: "Seoul" } } });
// { "user.name": "Alice", "user.address.city": "Seoul" }

flattenObject({ items: ["x", "y"] });
// { "items.0": "x", "items.1": "y" }

// 커스텀 separator
flattenObject({ a: { b: 1 } }, "/");
// { "a/b": 1 }

// 복원 (왕복)
const flat = flattenObject(config);
Object.keys(flat); // ["db.host", "db.port", "db.name", ...]
unflattenObject(flat); // 원본 config 복원

// 실사용: API 응답의 중첩 에러 경로를 폼 필드에 매핑
const errors = flattenObject(apiError.details);
// { "user.email": "이메일 형식이 올바르지 않습니다", "user.name": "필수 항목입니다" }
setFieldErrors(errors);

// 점 구분자 경로 접근 — 중첩 상태, 폼, config에서 자주 사용
const state = { user: { address: { city: "Seoul" }, scores: [90, 85] } };

getIn(state, "user.address.city");   // "Seoul"
getIn(state, "user.scores.0");       // 90
getIn(state, "user.age");            // undefined (존재하지 않는 경로)
hasIn(state, "user.address.city");   // true
hasIn(state, "user.address.zip");    // false
hasIn({ a: undefined }, "a");        // true (키는 존재, 값이 undefined인 경우)

// setIn — 불변 업데이트 (원본 변경 없음)
const next = setIn(state, "user.address.city", "Busan");
state.user.address.city;  // "Seoul" (변경 없음)
next.user.address.city;   // "Busan"

setIn({}, "a.b.c", 1);   // { a: { b: { c: 1 } } } (중간 경로 자동 생성)

// 실사용: 폼 필드 개별 업데이트
const form = setIn(currentForm, `items.${index}.quantity`, newQty);

// 얕은 객체 diff — 폼 dirty 상태, 설정 변경 감지, 패치 생성
const a = { keep: 1, remove: 2, change: "old" };
const b = { keep: 1, add: 3,    change: "new" };
const result = diff(a, b);
result.added;    // { add: 3 }
result.removed;  // { remove: 2 }
result.changed;  // { change: { from: "old", to: "new" } }

// 변경사항 없는지 빠른 확인
isDiffEmpty(diff(initial, current));  // true → dirty 없음

// 실사용: 폼 dirty state 감지
const initial = { name: "Alice", email: "alice@example.com" };
const current  = { name: "Bob",   email: "alice@example.com" };
const d = diff(initial, current);
if (!isDiffEmpty(d)) {
  console.log("변경된 필드:", d.changed);  // { name: { from: "Alice", to: "Bob" } }
}

// PATCH 페이로드 생성 — 변경된 필드만 서버로 전송
const patch = diff(original, edited).changed;
api.patch("/user", Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v.to])));
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

### storage

JSON 직렬화·TTL·네임스페이스를 지원하는 타입 안전 localStorage/sessionStorage 래퍼.
SSR/Node 환경에서 storage 접근 불가 시 no-op으로 동작한다 (throw 없음).

| API | 설명 |
|-----|------|
| `createStorage(options?)` | TypedStorage 인스턴스 생성 |
| `store.set(key, value, options?)` | JSON 직렬화 저장. `ttl` (ms) 옵션으로 만료 설정 |
| `store.get<T>(key)` | 역직렬화 반환. 없거나 만료됐으면 `null` |
| `store.has(key)` | 유효한 항목이 존재하면 `true` |
| `store.remove(key)` | 항목 삭제 |
| `store.clear()` | prefix 항목 전체 삭제 (prefix 없으면 전체 초기화) |
| `store.keys()` | 현재 prefix의 모든 raw key 반환 |

**StorageOptions**

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `type` | `"local" \| "session"` | `"local"` | localStorage 또는 sessionStorage |
| `prefix` | `string` | — | 모든 키에 자동으로 붙는 네임스페이스 (`"prefix:key"`) |

```ts
import { createStorage } from "simple-ts-tools";

// 기본 — localStorage, 네임스페이스 없음
const store = createStorage();
store.set("theme", "dark");
store.get<string>("theme");   // "dark"

// TTL — 1시간 후 자동 만료
store.set("authToken", token, { ttl: 60 * 60 * 1000 });

// 네임스페이스 — 앱별 키 충돌 방지
const appStore = createStorage({ prefix: "myapp" });
appStore.set("user", { id: 1, name: "Alice" });
// localStorage에는 "myapp:user"로 저장됨

// 타입 안전 get
const user = appStore.get<{ id: number; name: string }>("user");
user?.name; // "Alice"

// sessionStorage — 탭/창 닫으면 자동 삭제
const sessionStore = createStorage({ type: "session", prefix: "cart" });
sessionStore.set("items", cartItems);

// has / remove
appStore.has("user");     // true
appStore.remove("user");
appStore.has("user");     // false

// 현재 prefix의 모든 키
appStore.keys();          // ["user", "theme", ...]

// prefix 범위 내 전체 삭제
appStore.clear();         // "myapp:*" 항목만 삭제, 다른 앱 키 유지
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
| `camelToSnake` | `camelToSnake(str: string): string` | camelCase/PascalCase → snake_case (약어 처리 포함) |
| `capitalize` | `capitalize(str: string): string` | 첫 글자 대문자, 나머지 소문자 |
| `snakeToCamel` | `snakeToCamel(str: string): string` | snake_case → camelCase |
| `escapeHtml` | `escapeHtml(str: string): string` | HTML 특수 문자를 엔티티로 변환 (`& < > " '`) |
| `formatBytes` | `formatBytes(bytes: number, decimals?: number): string` | 바이트 수를 사람이 읽기 좋은 단위로 변환 (B/KB/MB/GB/TB) |
| `template` | `template(str: string, data: Record<string, ...>): string` | `{{변수명}}` 자리 표시자를 데이터로 치환 |
| `unescapeHtml` | `unescapeHtml(str: string): string` | HTML 엔티티를 원래 문자로 복원 |
| `isEmpty` | `isEmpty(value: string \| null \| undefined): boolean` | 빈 문자열·공백·null·undefined이면 true |
| `kebabToCamel` | `kebabToCamel(str: string): string` | kebab-case → camelCase |
| `truncate` | `truncate(str: string, maxLength: number, suffix?: string): string` | maxLength 초과 시 suffix(기본 "…")를 붙여 잘라냄 |
| `slugify` | `slugify(str: string, options?: SlugifyOptions): string` | 문자열을 URL-safe 슬러그로 변환 (악센트 제거, 특수 문자 제거) |
| `mask` | `mask(str: string, start?: number, end?: number, char?: string): string` | 지정 범위를 마스킹 문자로 대체 |
| `maskEmail` | `maskEmail(email: string): string` | 이메일 local 파트 앞 2자 이후 마스킹 |
| `maskCard` | `maskCard(cardNumber: string): string` | 카드번호 마지막 4자리만 표시, 4자리씩 하이픈 구분 |
| `maskPhone` | `maskPhone(phone: string): string` | 전화번호 중간 자리 마스킹 (한국 형식) |
| `wordCount` | `wordCount(str: string): number` | 단어 수 반환 (공백 기준, 연속 공백 정규화) |
| `words` | `words(str: string): string[]` | 문자열을 단어 배열로 분리 |
| `truncateWords` | `truncateWords(str: string, maxWords: number, suffix?: string): string` | 단어 수 기준으로 잘라냄 (기본 suffix: "…") |

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

// snake_case 변환 (DB 컬럼명 ↔ JS 프로퍼티 변환)
camelToSnake("backgroundColor");    // "background_color"
camelToSnake("XMLParser");           // "xml_parser"      ← 약어 처리
camelToSnake("getHTTPSResponse");    // "get_https_response"
snakeToCamel("background_color");    // "backgroundColor"
snakeToCamel(camelToSnake("myProp")); // "myProp" (왕복 가능)

// 파일 크기를 사람이 읽기 좋은 단위로 표시
formatBytes(0);               // "0 B"
formatBytes(1024);            // "1 KB"
formatBytes(1536);            // "1.5 KB"
formatBytes(1048576);         // "1 MB"
formatBytes(1234567, 1);      // "1.2 MB"
formatBytes(1024 ** 3);       // "1 GB"

// 업로드 UI, 파일 탐색기에서 자주 사용
`파일 크기: ${formatBytes(file.size)}` // "파일 크기: 2.34 MB"

// XSS 방지 — innerHTML에 동적 데이터 삽입 전 필수
escapeHtml('<script>alert("xss")</script>');
// '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

escapeHtml('안녕 & "반가워" <br>');
// '안녕 &amp; &quot;반가워&quot; &lt;br&gt;'

// 역변환
unescapeHtml('&lt;b&gt;hello&lt;/b&gt;'); // '<b>hello</b>'

// 왕복 무손실
const raw = '<b>Alice & "Bob"</b>';
unescapeHtml(escapeHtml(raw)) === raw; // true

// 문자열 템플릿 — {{변수명}} 치환
template("안녕하세요, {{name}}님!", { name: "Alice" });
// "안녕하세요, Alice님!"

template("{{sender}}님이 {{count}}개의 메시지를 보냈습니다.", { sender: "Bob", count: 3 });
// "Bob님이 3개의 메시지를 보냈습니다."

template("{{year}}년 {{month}}월 {{day}}일", { year: 2024, month: 6, day: 7 });
// "2024년 6월 7일"

// 정의되지 않은 변수는 빈 문자열
template("Hello, {{name}}{{title}}!", { name: "Alice" });
// "Hello, Alice!"

// URL 슬러그 생성 — 블로그 포스트, 상품 URL, SEO 경로 생성
slugify("Hello World");                          // "hello-world"
slugify("café au lait");                         // "cafe-au-lait"  ← 악센트 제거
slugify("résumé");                               // "resume"
slugify("Chapter 2: Introduction!");             // "chapter-2-introduction"
slugify("hello   world---test");                 // "hello-world-test" ← 연속 구분자 통합
slugify("Hello World", { separator: "_" });      // "hello_world"
slugify("Hello World", { lowercase: false });    // "Hello-World"

// 실사용: 게시물 URL 생성
const post = { title: "나의 첫 번째 포스트!" };
const url = `/posts/${slugify(post.title)}`; // "/posts/" (한글 → 비라틴 제거)
// 한글 포스트는 별도 인코딩 또는 영문 slug 필드 활용 권장

// 마스킹 — 민감 정보 표시
mask("1234567890", 0, 6);              // "******7890"
mask("ABCDEFGH", 2, 6);               // "AB****GH"

maskEmail("alice@example.com");        // "al***@example.com"
maskEmail("ab@test.com");              // "ab@test.com" (2자 이하 그대로)

maskCard("1234567890123456");          // "****-****-****-3456"
maskCard("1234-5678-9012-3456");       // "****-****-****-3456"

maskPhone("01012345678");             // "010-****-5678"
maskPhone("010-1234-5678");           // "010-****-5678"
maskPhone("0212345678");              // "02-****-5678"

// 단어 수 처리 — 리치 텍스트 에디터, 폼 유효성 검사
wordCount("Hello World");          // 2
wordCount("  Hello   World  ");    // 2  (연속 공백 정규화)
wordCount("");                     // 0

words("React TypeScript Next.js"); // ["React", "TypeScript", "Next.js"]

// truncateWords — 문자 수가 아닌 단어 수 기준으로 잘라냄
// (truncate는 단어 중간에서 잘릴 수 있는 문제를 이 함수로 해결)
truncateWords("Hello World Foo Bar Baz", 3);           // "Hello World Foo…"
truncateWords("React TypeScript Next.js", 10);          // "React TypeScript Next.js" (초과 없음)
truncateWords("Hello World Foo", 2, " [더 보기]");       // "Hello World [더 보기]"

// 실사용: 블로그 카드 미리보기
const preview = truncateWords(article.body, 20);
// 최대 20단어로 미리보기, 단어 중간에서 잘리지 않음

// 실사용: 트위터 스타일 글자 수 제한 표시
const remaining = 280 - wordCount(input) * 5; // 대략적 계산용
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

### date

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `addDays` | `addDays(date: Date, days: number): Date` | n일을 더한 새 Date 반환 |
| `addMonths` | `addMonths(date: Date, months: number): Date` | n개월을 더한 새 Date (월말 자동 clamp) |
| `addYears` | `addYears(date: Date, years: number): Date` | n년을 더한 새 Date |
| `subDays` | `subDays(date: Date, days: number): Date` | n일을 뺀 새 Date 반환 |
| `startOfDay` | `startOfDay(date: Date): Date` | 하루의 시작 시각 (00:00:00.000) |
| `endOfDay` | `endOfDay(date: Date): Date` | 하루의 마지막 시각 (23:59:59.999) |
| `isSameDay` | `isSameDay(a: Date, b: Date): boolean` | 같은 날(연·월·일)인지 확인 (시각 무시) |
| `isWeekend` | `isWeekend(date: Date): boolean` | 토요일 또는 일요일인지 확인 |
| `isWeekday` | `isWeekday(date: Date): boolean` | 월~금인지 확인 |
| `isSameMonth` | `isSameMonth(a: Date, b: Date): boolean` | 같은 달(연·월)인지 확인 |
| `diffDays` | `diffDays(a: Date, b: Date): number` | 두 날짜의 일수 차이 (절댓값) |
| `startOfMonth` | `startOfMonth(date: Date): Date` | 해당 월의 첫날 00:00:00.000 |
| `endOfMonth` | `endOfMonth(date: Date): Date` | 해당 월의 마지막 날 23:59:59.999 |
| `startOfWeek` | `startOfWeek(date: Date, weekStart?: 0\|1): Date` | 해당 주 시작일 00:00:00.000 (0=일, 1=월) |
| `endOfWeek` | `endOfWeek(date: Date, weekStart?: 0\|1): Date` | 해당 주 마지막일 23:59:59.999 |
| `getQuarter` | `getQuarter(date: Date): 1\|2\|3\|4` | 분기 반환 (1~4) |
| `formatDate` | `formatDate(date: Date, format: string): string` | 토큰 기반 날짜 포맷 변환 |
| `formatRelativeTime` | `formatRelativeTime(date: Date, base?: Date, locale?: "ko"\|"en"): string` | 상대 시간 표시 ("3분 전", "2일 후") |
| `parseDate` | `parseDate(input: string, locale?: "en-US"\|"en-GB"): Date \| null` | 다양한 형식의 날짜 문자열 → Date (실패 시 null) |
| `formatDuration` | `formatDuration(ms: number, options?): string` | 밀리초 → 사람이 읽기 좋은 시간 문자열 (한/영 지원) |

**지원 토큰**

| 토큰 | 설명 | 예시 |
|------|------|------|
| `YYYY` | 4자리 연도 | `2024` |
| `YY` | 2자리 연도 | `24` |
| `MM` | 2자리 월 | `06` |
| `M` | 월 (패딩 없음) | `6` |
| `DD` | 2자리 일 | `07` |
| `D` | 일 (패딩 없음) | `7` |
| `HH` | 24시간제 시 | `09` |
| `H` | 24시간제 시 (패딩 없음) | `9` |
| `hh` | 12시간제 시 | `09` |
| `h` | 12시간제 시 (패딩 없음) | `9` |
| `mm` | 분 | `05` |
| `ss` | 초 | `03` |
| `A` | AM / PM | `PM` |
| `a` | am / pm | `pm` |

```ts
import { formatDate } from "simple-ts-tools";

const now = new Date("2024-06-07T09:05:03");

formatDate(now, "YYYY-MM-DD");           // "2024-06-07"
formatDate(now, "YYYY년 M월 D일");       // "2024년 6월 7일"
formatDate(now, "HH:mm:ss");             // "09:05:03"
formatDate(now, "YYYY-MM-DD HH:mm:ss"); // "2024-06-07 09:05:03"

const afternoon = new Date("2024-06-07T14:30:00");
formatDate(afternoon, "h:mm A");         // "2:30 PM"
formatDate(afternoon, "hh:mm a");        // "02:30 pm"

// 파일명, 로그 타임스탬프
`log_${formatDate(new Date(), "YYYY-MM-DD")}.txt` // "log_2024-06-07.txt"

// 날짜 조작 — 원본 불변
const today = new Date("2024-06-07");
addDays(today, 7);     // 2024-06-14 (today는 변하지 않음)
subDays(today, 3);     // 2024-06-04
startOfDay(today);     // 2024-06-07T00:00:00.000
endOfDay(today);       // 2024-06-07T23:59:59.999

// 날짜 비교 / 필터링
isSameDay(new Date(), new Date());                             // true
diffDays(new Date("2024-01-01"), new Date("2024-01-31"));     // 30

// 활용 패턴
const todayPosts = posts.filter(p => isSameDay(p.createdAt, new Date()));
const weekAgo = subDays(new Date(), 7);
const thisWeekPosts = posts.filter(p => p.createdAt >= weekAgo);

// 날짜 범위 쿼리
const start = startOfDay(selectedDate);
const end = endOfDay(selectedDate);
db.query({ createdAt: { gte: start, lte: end } });

// 월/년 단위 조작 — 월말 날짜도 안전하게 처리
addMonths(new Date("2024-01-31"), 1);  // 2024-02-29 (윤년 clamp)
addMonths(new Date("2024-03-31"), -1); // 2024-02-29
addYears(new Date("2024-02-29"), 1);   // 2025-02-28 (비윤년 clamp)

// 주말/평일 필터링
const workdays = dateRange.filter(isWeekday);
const weekends = dateRange.filter(isWeekend);
const nextBizDay = isWeekday(tomorrow) ? tomorrow : addDays(tomorrow, isWeekend(tomorrow) && tomorrow.getDay() === 6 ? 2 : 1);

// 상대 시간 표시 (SNS 피드, 댓글, 알림)
const now = new Date();
formatRelativeTime(new Date(now.getTime() - 30 * 1000));        // "방금 전"
formatRelativeTime(new Date(now.getTime() - 3 * 60 * 1000));    // "3분 전"
formatRelativeTime(new Date(now.getTime() - 2 * 3600 * 1000));  // "2시간 전"
formatRelativeTime(new Date(now.getTime() - 5 * 86400 * 1000)); // "5일 전"
formatRelativeTime(new Date(now.getTime() + 86400 * 1000));     // "1일 후"

// 영어 지원
formatRelativeTime(pastDate, now, "en");  // "3 minutes ago"
formatRelativeTime(futureDate, now, "en"); // "in 2 hours"

// parseDate — 다양한 포맷 파싱 (성공 시 Date, 실패 시 null)
parseDate("2024-06-07");           // Date (2024년 6월 7일)
parseDate("2024/06/07");           // Date
parseDate("2024.06.07");           // Date
parseDate("2024년 6월 7일");       // Date (한국어)
parseDate("2024년6월7일");         // Date (공백 없음도 지원)
parseDate("06/07/2024");           // Date (en-US: MM/DD/YYYY)
parseDate("07/06/2024", "en-GB");  // Date (en-GB: DD/MM/YYYY)
parseDate("2024-02-30");           // null (존재하지 않는 날짜)
parseDate("not-a-date");           // null

// API 응답의 날짜 문자열을 안전하게 파싱
const date = parseDate(apiResponse.createdAt);
if (date) formatRelativeTime(date);

// 월 범위 — 캘린더, 대시보드 데이터 범위
const today = new Date("2024-06-15");
startOfMonth(today);  // 2024-06-01T00:00:00.000
endOfMonth(today);    // 2024-06-30T23:59:59.999
endOfMonth(new Date("2024-02-01"));  // 2024-02-29 (윤년)

// 주 범위 — 주간 통계, 캘린더 뷰
startOfWeek(today);        // 2024-06-09 (일요일 기준)
startOfWeek(today, 1);     // 2024-06-10 (월요일 기준)
endOfWeek(today);          // 2024-06-15 (토요일)
endOfWeek(today, 1);       // 2024-06-16 (일요일)

// 분기 — 분기 보고서, 재무 데이터
getQuarter(new Date("2024-01-15"));  // 1
getQuarter(new Date("2024-04-01"));  // 2
getQuarter(new Date("2024-07-31"));  // 3
getQuarter(new Date("2024-10-01"));  // 4

// 같은 달 확인 — 월별 집계 그룹핑
isSameMonth(new Date("2024-06-01"), new Date("2024-06-30"));  // true
isSameMonth(new Date("2024-06-01"), new Date("2024-07-01"));  // false

// 실사용: 이번 달 매출 쿼리
const [from, to] = [startOfMonth(new Date()), endOfMonth(new Date())];
db.query("SELECT * FROM orders WHERE created_at BETWEEN ? AND ?", [from, to]);

// formatDuration — 밀리초 → 사람이 읽기 좋은 시간 문자열
formatDuration(90_000);                         // "1분 30초"
formatDuration(3_661_000);                      // "1시간 1분"   (기본 2단위)
formatDuration(3_661_000, { parts: 3 });        // "1시간 1분 1초"
formatDuration(86_400_000);                     // "1일"
formatDuration(500);                            // "< 1초"
formatDuration(-90_000);                        // "1분 30초"   (음수 → 절댓값)

// 영어 지원
formatDuration(90_000, { locale: "en" });            // "1m 30s"
formatDuration(3_661_000, { locale: "en", parts: 3 }); // "1h 1m 1s"
formatDuration(500, { locale: "en" });               // "< 1s"

// 실사용: 동영상 길이 표시
formatDuration(5_400_000);    // "1시간 30분"
formatDuration(600_000);      // "10분"

// ETA(남은 시간) 표시
const etaMs = uploadedBytes === 0 ? 0 : (totalBytes - uploadedBytes) / speed * 1000;
`남은 시간: ${formatDuration(etaMs)}`;   // "2시간 3분"

// 타이머 표시 — 단일 단위
formatDuration(3_000, { parts: 1 });    // "3초"
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

### structure

| 클래스 | 설명 |
|--------|------|
| `PriorityQueue<T>` | 이진 최소 힙 기반 우선순위 큐. priority 낮을수록 먼저 꺼냄. 동일 priority는 FIFO |
| `Queue<T>` | FIFO 큐. dequeue O(1) (head 포인터 방식) |
| `Stack<T>` | LIFO 스택. 모든 연산 O(1) |

**PriorityQueue 메서드**

| 메서드 / 프로퍼티 | 시그니처 | 설명 |
|--------|----------|------|
| `enqueue(value, priority)` | `(value: T, priority: number): void` | O(log n) 삽입 |
| `dequeue()` | `(): T \| undefined` | O(log n) — 최소 priority 값 꺼내기 |
| `peek()` | `(): T \| undefined` | O(1) — 제거 없이 다음 값 확인 |
| `toArray()` | `(): T[]` | 우선순위 순으로 배열 반환 (비파괴) |
| `.size` | `number` | 현재 요소 수 |
| `.isEmpty` | `boolean` | 비어있는지 확인 |

| 메서드 / 프로퍼티 | Queue | Stack | 설명 |
|--------|-------|-------|------|
| `enqueue(item)` / `push(item)` | ✓ | ✓ | 요소 추가, 체이닝 가능 |
| `dequeue()` / `pop()` | ✓ | ✓ | 요소 꺼내기 (없으면 `undefined`) |
| `peek()` | ✓ | ✓ | 제거 없이 다음 요소 확인 |
| `.isEmpty` | ✓ | ✓ | 비어 있는지 확인 |
| `.size` | ✓ | ✓ | 현재 요소 수 |
| `clear()` | ✓ | ✓ | 전체 비우기 |
| `toArray()` | ✓ | ✓ | 배열로 변환 |

```ts
import { PriorityQueue, Queue, Stack } from "simple-ts-tools";

// 작업 스케줄러 — 긴급도 기반 처리 (낮은 숫자 = 높은 우선순위)
const scheduler = new PriorityQueue<Task>();
scheduler.enqueue(sendEmail,     priority: 3);
scheduler.enqueue(processPayment, priority: 1);  // 먼저 처리됨
scheduler.enqueue(updateCache,   priority: 2);

while (!scheduler.isEmpty) {
  const task = scheduler.dequeue()!;
  await task.run();
}

// 다익스트라 알고리즘 — 최단 거리 노드 우선 탐색
const pq = new PriorityQueue<string>();
pq.enqueue("A", 0);
while (!pq.isEmpty) {
  const node = pq.dequeue()!;
  for (const [next, cost] of graph[node]) {
    pq.enqueue(next, dist[node] + cost);
  }
}

// 같은 priority → enqueue 순서 유지 (FIFO tiebreak)
const pq2 = new PriorityQueue<string>();
pq2.enqueue("first",  5);
pq2.enqueue("second", 5);
pq2.dequeue(); // "first"

// BFS 직접 구현
const queue = new Queue<TreeNode>([root]);
while (!queue.isEmpty) {
  const node = queue.dequeue()!;
  process(node);
  node.children.forEach(c => queue.enqueue(c));
}

// 히스토리 / undo 스택
const history = new Stack<State>();
history.push(currentState);
const prev = history.pop(); // undo

// 괄호 유효성 검사
function isBalanced(s: string) {
  const stack = new Stack<string>();
  for (const ch of s) {
    if ("({[".includes(ch)) stack.push(ch);
    else if (")}]".includes(ch) && stack.pop() !== { ")":"(", "}":"{", "]":"[" }[ch])
      return false;
  }
  return stack.isEmpty;
}
```

---

### url

| 함수 | 시그니처 | 설명 |
|------|----------|------|
| `parseQueryString` | `parseQueryString(query: string): Record<string, string \| string[]>` | 쿼리 문자열 → 객체 (중복 키는 배열) |
| `buildQueryString` | `buildQueryString(params: QueryParams): string` | 객체 → 쿼리 문자열 (null/undefined 제외) |

```ts
import { parseQueryString, buildQueryString } from "simple-ts-tools";

// 파싱 — 앞의 ? 유무 무관
parseQueryString("?page=1&sort=name");
// { page: "1", sort: "name" }

parseQueryString("tags=a&tags=b&tags=c");
// { tags: ["a", "b", "c"] }  — 중복 키는 자동으로 배열

parseQueryString("q=hello%20world");
// { q: "hello world" }  — URL 디코딩 자동

// 직렬화 — null/undefined 자동 제외
buildQueryString({ page: 1, sort: "name" });
// "page=1&sort=name"

buildQueryString({ tags: ["a", "b", "c"] });
// "tags=a&tags=b&tags=c"

buildQueryString({ page: 1, filter: null, sort: undefined });
// "page=1"  — null/undefined 제외

// 활용: 현재 URL에 파라미터 추가/수정
const current = parseQueryString(location.search);
const updated = buildQueryString({ ...current, page: 2 });
router.push(`/list?${updated}`);
```

---

### validation

컴포저블 스키마 검증. `Rule<T>` 배열로 스키마를 정의하고, `validate()`로 한 번에 실행한다.
각 필드에서 첫 번째로 실패한 규칙의 메시지만 반환한다.

**내장 규칙**

| 규칙 | 설명 |
|------|------|
| `required(msg?)` | null · undefined · 빈 문자열 · 빈 배열 거부 |
| `minLength(n, msg?)` | 문자열 최소 길이 |
| `maxLength(n, msg?)` | 문자열 최대 길이 |
| `minValue(n, msg?)` | 숫자 최솟값 |
| `maxValue(n, msg?)` | 숫자 최댓값 |
| `pattern(regex, msg?)` | 정규식 패턴 |
| `emailRule(msg?)` | 이메일 형식 |
| `urlRule(msg?)` | URL 형식 (`new URL()` 기반) |
| `minItems(n, msg?)` | 배열 최소 항목 수 |
| `maxItems(n, msg?)` | 배열 최대 항목 수 |
| `oneOf(allowed, msg?)` | 허용 값 목록 |
| `custom(predicate, msg)` | 커스텀 조건 함수 |

```ts
import { validate, required, minLength, maxLength, emailRule, minValue, oneOf, custom } from "simple-ts-tools";

// 회원가입 폼 스키마 정의
const signupSchema = {
  username: [
    required(),
    minLength(3),
    maxLength(20),
    pattern(/^\w+$/, "영문·숫자·_만 사용 가능합니다"),
    custom(v => v !== "admin", "예약된 이름은 사용할 수 없습니다"),
  ],
  email:    [required(), emailRule()],
  password: [required(), minLength(8, "비밀번호는 8자 이상이어야 합니다")],
  role:     [oneOf(["user", "admin"])],
};

const result = validate(formData, signupSchema);

if (result.valid) {
  // 타입 좁혀짐: valid === true이면 errors 없음
  submitForm(formData);
} else {
  // errors 객체: 각 필드 → 첫 번째 실패 메시지
  setErrors(result.errors);
  // { username: "3자 이상 입력해주세요", email: "이메일 형식이 올바르지 않습니다" }
}

// 커스텀 규칙 조합 — 비밀번호 확인
const pwSchema = {
  password:        [required(), minLength(8)],
  passwordConfirm: [
    required(),
    custom(v => v === formData.password, "비밀번호가 일치하지 않습니다"),
  ],
};

// 배열 필드 검증
const tagSchema = {
  tags: [required(), minItems(1, "태그를 1개 이상 선택해주세요"), maxItems(5)],
};

// API 입력 검증에도 동일하게 사용
function createPost(body: unknown) {
  const result = validate(body as Record<string, unknown>, {
    title: [required(), minLength(1), maxLength(100)],
    content: [required(), minLength(10)],
  });
  if (!result.valid) throw new Error(JSON.stringify(result.errors));
}
```

---

## 개발

```bash
pnpm test          # 테스트 실행
pnpm test:watch    # 테스트 감시 모드
pnpm build         # 빌드 (dist/)
pnpm lint          # 타입 체크
```
