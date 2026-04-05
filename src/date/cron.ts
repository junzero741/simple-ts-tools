// Cron 표현식 파서.
//
// 5필드 cron 표현식 (분 시 일 월 요일)을 파싱하고,
// 다음 실행 시각 계산, 특정 시각 매칭 검사를 제공한다.
//
// parseCron("0 9 * * 1-5")  → 평일 오전 9시
// parseCron("0 0 1 * *")    → 매월 1일 자정
// parseCron("0 12 * * 0,6") → 주말 정오
//
// expr.matches(date) → boolean
// expr.next(after)   → Date
// expr.nextN(after, 5) → Date[]

export interface CronExpr {
  /** 특정 시각이 cron 표현식에 매칭되는지 확인한다. */
  matches(date: Date): boolean;

  /** 주어진 시각 이후 다음 실행 시각을 반환한다. */
  next(after?: Date): Date;

  /** 다음 N번 실행 시각을 반환한다. */
  nextN(after: Date, count: number): Date[];

  /** 원본 cron 문자열. */
  readonly expression: string;
}

interface Field {
  values: Set<number>;
}

function parseField(field: string, min: number, max: number): Field {
  const values = new Set<number>();

  for (const part of field.split(",")) {
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;
    const range = stepMatch ? stepMatch[1] : part;

    if (range === "*") {
      for (let i = min; i <= max; i += step) values.add(i);
      continue;
    }

    const rangeMatch = range.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i += step) values.add(i);
      continue;
    }

    const num = parseInt(range, 10);
    if (!isNaN(num)) {
      if (step === 1) {
        values.add(num);
      } else {
        for (let i = num; i <= max; i += step) values.add(i);
      }
    }
  }

  return { values };
}

export function parseCron(expression: string): CronExpr {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${parts.length}`);
  }

  const minute = parseField(parts[0], 0, 59);
  const hour = parseField(parts[1], 0, 23);
  const dayOfMonth = parseField(parts[2], 1, 31);
  const month = parseField(parts[3], 1, 12);
  const dayOfWeek = parseField(parts[4], 0, 6); // 0 = Sunday

  function matchesDate(date: Date): boolean {
    return (
      minute.values.has(date.getMinutes()) &&
      hour.values.has(date.getHours()) &&
      dayOfMonth.values.has(date.getDate()) &&
      month.values.has(date.getMonth() + 1) &&
      dayOfWeek.values.has(date.getDay())
    );
  }

  const expr: CronExpr = {
    matches(date: Date): boolean {
      return matchesDate(date);
    },

    next(after?: Date): Date {
      const start = after ? new Date(after.getTime()) : new Date();
      // 다음 분부터 시작
      start.setSeconds(0, 0);
      start.setMinutes(start.getMinutes() + 1);

      const limit = 366 * 24 * 60; // 최대 1년 탐색
      for (let i = 0; i < limit; i++) {
        if (matchesDate(start)) {
          return new Date(start.getTime());
        }
        start.setMinutes(start.getMinutes() + 1);
      }

      throw new Error("No matching date found within 1 year");
    },

    nextN(after: Date, count: number): Date[] {
      const results: Date[] = [];
      let current = after;
      for (let i = 0; i < count; i++) {
        const n = expr.next(current);
        results.push(n);
        current = n;
      }
      return results;
    },

    get expression() {
      return expression;
    },
  };

  return expr;
}
