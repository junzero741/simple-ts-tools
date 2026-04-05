// 시퀀스 Diff (Sequence Diff / Myers Algorithm).
//
// 두 배열(또는 문자열)의 차이를 insert/delete/equal 연산 목록으로 반환.
// git diff, 텍스트 비교, 상태 변경 추적, 리스트 동기화에 활용.
//
// diffArrays([1, 2, 3], [1, 3, 4])
// → [{ type: "equal", value: 1 }, { type: "delete", value: 2 },
//    { type: "equal", value: 3 }, { type: "insert", value: 4 }]
//
// diffChars("abc", "adc")
// → [{ type: "equal", value: "a" }, { type: "delete", value: "b" },
//    { type: "insert", value: "d" }, { type: "equal", value: "c" }]

export interface DiffOp<T> {
  type: "equal" | "insert" | "delete";
  value: T;
}

/**
 * 두 배열의 차이를 계산한다 (LCS 기반).
 */
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  equals: (a: T, b: T) => boolean = Object.is,
): DiffOp<T>[] {
  const oldLen = oldArr.length;
  const newLen = newArr.length;

  // LCS 테이블 구축
  const dp: number[][] = Array.from({ length: oldLen + 1 }, () =>
    new Array(newLen + 1).fill(0),
  );

  for (let i = 1; i <= oldLen; i++) {
    for (let j = 1; j <= newLen; j++) {
      if (equals(oldArr[i - 1], newArr[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 역추적
  const ops: DiffOp<T>[] = [];
  let i = oldLen;
  let j = newLen;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && equals(oldArr[i - 1], newArr[j - 1])) {
      ops.push({ type: "equal", value: oldArr[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: "insert", value: newArr[j - 1] });
      j--;
    } else {
      ops.push({ type: "delete", value: oldArr[i - 1] });
      i--;
    }
  }

  return ops.reverse();
}

/**
 * 두 문자열의 문자 단위 차이를 계산한다.
 */
export function diffChars(oldStr: string, newStr: string): DiffOp<string>[] {
  return diffArrays(oldStr.split(""), newStr.split(""));
}

/**
 * 두 문자열의 줄 단위 차이를 계산한다.
 */
export function diffLines(oldStr: string, newStr: string): DiffOp<string>[] {
  return diffArrays(oldStr.split("\n"), newStr.split("\n"));
}

/**
 * diff 결과에서 변경이 있는지 확인한다.
 */
export function hasDiff<T>(ops: DiffOp<T>[]): boolean {
  return ops.some((op) => op.type !== "equal");
}

/**
 * diff 결과를 패치로 적용한다 (old → new 재구성).
 */
export function applyDiff<T>(ops: DiffOp<T>[]): T[] {
  return ops.filter((op) => op.type !== "delete").map((op) => op.value);
}

/**
 * diff 통계를 반환한다.
 */
export function diffStats<T>(
  ops: DiffOp<T>[],
): { equal: number; inserted: number; deleted: number } {
  let equal = 0;
  let inserted = 0;
  let deleted = 0;

  for (const op of ops) {
    if (op.type === "equal") equal++;
    else if (op.type === "insert") inserted++;
    else deleted++;
  }

  return { equal, inserted, deleted };
}
