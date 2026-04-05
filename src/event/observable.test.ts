import { describe, it, expect, vi } from "vitest";
import { createObservable, of, merge, createSubject, Observable } from "./observable";

describe("Observable", () => {
  describe("기본 구독", () => {
    it("next로 값을 수신한다", () => {
      const values: number[] = [];
      of(1, 2, 3).subscribe((v) => values.push(v));
      expect(values).toEqual([1, 2, 3]);
    });

    it("complete가 호출된다", () => {
      const complete = vi.fn();
      of(1).subscribe({ next: () => {}, complete });
      expect(complete).toHaveBeenCalledOnce();
    });

    it("error가 전파된다", () => {
      const error = vi.fn();
      createObservable<number>((observer) => {
        observer.error!(new Error("boom"));
      }).subscribe({ next: () => {}, error });
      expect(error).toHaveBeenCalledOnce();
    });

    it("unsubscribe 후 값을 받지 않는다", () => {
      const values: number[] = [];
      const subject = createSubject<number>();

      const sub = subject.subscribe((v) => values.push(v));
      subject.next(1);
      sub.unsubscribe();
      subject.next(2);

      expect(values).toEqual([1]);
      expect(sub.closed).toBe(true);
    });
  });

  describe("map", () => {
    it("각 값을 변환한다", () => {
      const values: number[] = [];
      of(1, 2, 3).map((n) => n * 10).subscribe((v) => values.push(v));
      expect(values).toEqual([10, 20, 30]);
    });
  });

  describe("filter", () => {
    it("조건에 맞는 값만 통과시킨다", () => {
      const values: number[] = [];
      of(1, 2, 3, 4).filter((n) => n % 2 === 0).subscribe((v) => values.push(v));
      expect(values).toEqual([2, 4]);
    });
  });

  describe("take", () => {
    it("n개만 수신한다", () => {
      const values: number[] = [];
      const complete = vi.fn();
      of(1, 2, 3, 4, 5).take(3).subscribe({ next: (v) => values.push(v), complete });
      expect(values).toEqual([1, 2, 3]);
      expect(complete).toHaveBeenCalledOnce();
    });
  });

  describe("skip", () => {
    it("처음 n개를 건너뛴다", () => {
      const values: number[] = [];
      of(1, 2, 3, 4, 5).skip(2).subscribe((v) => values.push(v));
      expect(values).toEqual([3, 4, 5]);
    });
  });

  describe("tap", () => {
    it("부수 효과를 실행하되 값은 변경하지 않는다", () => {
      const side: number[] = [];
      const values: number[] = [];
      of(1, 2, 3)
        .tap((n) => side.push(n * 10))
        .subscribe((v) => values.push(v));
      expect(values).toEqual([1, 2, 3]);
      expect(side).toEqual([10, 20, 30]);
    });
  });

  describe("debounce", () => {
    it("마지막 값만 지연 후 emit한다", async () => {
      const subject = createSubject<number>();
      const values: number[] = [];

      subject.debounce(30).subscribe((v) => values.push(v));

      subject.next(1);
      subject.next(2);
      subject.next(3);

      expect(values).toEqual([]);
      await new Promise((r) => setTimeout(r, 50));
      expect(values).toEqual([3]);
    });
  });

  describe("distinctUntilChanged", () => {
    it("연속 중복 값을 제거한다", () => {
      const values: number[] = [];
      of(1, 1, 2, 2, 3, 1).distinctUntilChanged().subscribe((v) => values.push(v));
      expect(values).toEqual([1, 2, 3, 1]);
    });

    it("커스텀 비교 함수를 지원한다", () => {
      const values: { id: number }[] = [];
      of({ id: 1 }, { id: 1 }, { id: 2 })
        .distinctUntilChanged((a, b) => a.id === b.id)
        .subscribe((v) => values.push(v));
      expect(values).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe("scan", () => {
    it("누적 값을 emit한다", () => {
      const values: number[] = [];
      of(1, 2, 3).scan((acc, v) => acc + v, 0).subscribe((v) => values.push(v));
      expect(values).toEqual([1, 3, 6]);
    });
  });

  describe("switchMap", () => {
    it("내부 Observable로 전환한다", () => {
      const values: string[] = [];
      of(1, 2)
        .switchMap((n) => of(`${n}a`, `${n}b`))
        .subscribe((v) => values.push(v));
      // 동기 emit이므로 1의 inner가 완료 후 2의 inner가 실행
      expect(values).toEqual(["1a", "1b", "2a", "2b"]);
    });

    it("이전 inner를 취소한다", async () => {
      const subject = createSubject<number>();
      const inner1 = createSubject<string>();
      const inner2 = createSubject<string>();
      const values: string[] = [];

      subject
        .switchMap((n) => (n === 1 ? inner1 : inner2))
        .subscribe((v) => values.push(v));

      subject.next(1);
      inner1.next("a");

      subject.next(2); // inner1 취소
      inner1.next("b"); // 무시됨
      inner2.next("c");

      expect(values).toEqual(["a", "c"]);
    });
  });

  describe("toPromise", () => {
    it("마지막 값을 resolve한다", async () => {
      const result = await of(1, 2, 3).toPromise();
      expect(result).toBe(3);
    });
  });

  describe("merge", () => {
    it("여러 Observable을 합친다", () => {
      const values: number[] = [];
      merge(of(1, 2), of(3, 4)).subscribe((v) => values.push(v));
      expect(values).toEqual([1, 2, 3, 4]);
    });

    it("모든 소스가 complete되어야 complete", () => {
      const complete = vi.fn();
      const s1 = createSubject<number>();
      const s2 = createSubject<number>();

      merge(s1, s2).subscribe({ next: () => {}, complete });

      s1.complete();
      expect(complete).not.toHaveBeenCalled();

      s2.complete();
      expect(complete).toHaveBeenCalledOnce();
    });
  });

  describe("createSubject", () => {
    it("외부에서 next/complete를 호출할 수 있다", () => {
      const subject = createSubject<number>();
      const values: number[] = [];

      subject.subscribe((v) => values.push(v));
      subject.next(1);
      subject.next(2);

      expect(values).toEqual([1, 2]);
    });

    it("여러 구독자에게 멀티캐스트한다", () => {
      const subject = createSubject<number>();
      const a: number[] = [];
      const b: number[] = [];

      subject.subscribe((v) => a.push(v));
      subject.subscribe((v) => b.push(v));
      subject.next(42);

      expect(a).toEqual([42]);
      expect(b).toEqual([42]);
    });

    it("asObservable로 읽기 전용 Observable을 반환한다", () => {
      const subject = createSubject<number>();
      const obs = subject.asObservable();

      expect(obs).toBeInstanceOf(Observable);
      expect((obs as any).next).toBeUndefined();
    });
  });

  describe("체이닝 조합", () => {
    it("map → filter → take 체이닝", () => {
      const values: number[] = [];
      of(1, 2, 3, 4, 5, 6, 7, 8)
        .map((n) => n * 2)
        .filter((n) => n > 4)
        .take(3)
        .subscribe((v) => values.push(v));
      expect(values).toEqual([6, 8, 10]);
    });
  });
});
