// Glob 패턴 매칭 (Path Matcher).
//
// 파일 경로/문자열에 대한 glob 패턴 매칭을 순수 TypeScript로 구현.
// *, **, ?, {a,b}, [abc] 패턴을 지원한다.
//
// globMatch("src/*.ts", "src/index.ts")        → true
// globMatch("src/**/*.test.ts", "src/a/b.test.ts") → true
// globMatch("*.{js,ts}", "app.ts")             → true
// globMatch("[abc].txt", "a.txt")              → true
//
// const matcher = createGlobMatcher("src/**/*.ts", "!**/*.test.ts");
// matcher("src/utils/helper.ts")       → true
// matcher("src/utils/helper.test.ts")  → false

/**
 * glob 패턴을 정규식으로 변환한다.
 */
function globToRegex(pattern: string): RegExp {
  let regex = "";
  let i = 0;

  while (i < pattern.length) {
    const c = pattern[i];

    if (c === "*") {
      if (pattern[i + 1] === "*") {
        // ** — 디렉토리 경계를 넘어 매칭
        if (pattern[i + 2] === "/") {
          regex += "(?:.+/)?";
          i += 3;
        } else {
          regex += ".*";
          i += 2;
        }
      } else {
        // * — 슬래시를 제외한 모든 문자
        regex += "[^/]*";
        i++;
      }
    } else if (c === "?") {
      regex += "[^/]";
      i++;
    } else if (c === "[") {
      const close = pattern.indexOf("]", i);
      if (close === -1) {
        regex += "\\[";
        i++;
      } else {
        const content = pattern.slice(i + 1, close);
        regex += `[${content}]`;
        i = close + 1;
      }
    } else if (c === "{") {
      const close = pattern.indexOf("}", i);
      if (close === -1) {
        regex += "\\{";
        i++;
      } else {
        const content = pattern.slice(i + 1, close);
        const alternatives = content.split(",").map((s) => s.trim());
        regex += `(?:${alternatives.map(escapeForRegex).join("|")})`;
        i = close + 1;
      }
    } else if (c === ".") {
      regex += "\\.";
      i++;
    } else if (c === "/") {
      regex += "/";
      i++;
    } else {
      regex += escapeChar(c);
      i++;
    }
  }

  return new RegExp(`^${regex}$`);
}

function escapeChar(c: string): string {
  return /[\\^$+(){}|]/.test(c) ? `\\${c}` : c;
}

function escapeForRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 문자열이 glob 패턴에 매칭되는지 확인한다.
 */
export function globMatch(pattern: string, input: string): boolean {
  const regex = globToRegex(pattern);
  return regex.test(input);
}

/**
 * 여러 패턴과 제외 패턴(! 접두사)으로 매처를 생성한다.
 */
export function createGlobMatcher(
  ...patterns: string[]
): (input: string) => boolean {
  const includes: RegExp[] = [];
  const excludes: RegExp[] = [];

  for (const p of patterns) {
    if (p.startsWith("!")) {
      excludes.push(globToRegex(p.slice(1)));
    } else {
      includes.push(globToRegex(p));
    }
  }

  return (input: string): boolean => {
    // 제외 패턴에 매칭되면 false
    for (const re of excludes) {
      if (re.test(input)) return false;
    }
    // 포함 패턴 중 하나라도 매칭되면 true
    for (const re of includes) {
      if (re.test(input)) return true;
    }
    return false;
  };
}
