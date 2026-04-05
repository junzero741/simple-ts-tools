/**
 * 안전한 템플릿 엔진 (Template Engine).
 *
 * 기존 `template`이 단순 문자열 치환이라면, 이건 조건문, 반복문,
 * 파이프(필터), 기본값을 지원하는 로직 템플릿 엔진.
 * eval/new Function 없이 안전하게 동작한다.
 *
 * @example
 * // 기본 보간
 * render("Hello, {{name}}!", { name: "Alice" });
 * // "Hello, Alice!"
 *
 * @example
 * // 파이프 (필터)
 * render("{{name | upper}}", { name: "alice" });
 * // "ALICE"
 *
 * render("{{price | currency}}", { price: 1234.5 });
 * // "$1,234.50"
 *
 * @example
 * // 기본값
 * render("{{name | default:'anonymous'}}", {});
 * // "anonymous"
 *
 * @example
 * // 조건문
 * render("{{#if admin}}Admin{{/if}}", { admin: true });
 * // "Admin"
 *
 * render("{{#if vip}}VIP{{#else}}Regular{{/if}}", { vip: false });
 * // "Regular"
 *
 * @example
 * // 반복문
 * render("{{#each items}}{{.}}, {{/each}}", { items: ["a", "b", "c"] });
 * // "a, b, c, "
 *
 * render("{{#each users}}{{name}}({{age}}) {{/each}}", {
 *   users: [{ name: "A", age: 1 }, { name: "B", age: 2 }],
 * });
 * // "A(1) B(2) "
 *
 * @complexity Time: O(n) 템플릿 길이. Space: O(n).
 */

export type FilterFn = (value: unknown, ...args: string[]) => unknown;

export interface RenderOptions {
  filters?: Record<string, FilterFn>;
}

const BUILT_IN_FILTERS: Record<string, FilterFn> = {
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  trim: (v) => String(v).trim(),
  capitalize: (v) => { const s = String(v); return s.charAt(0).toUpperCase() + s.slice(1); },
  currency: (v) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v)),
  json: (v) => JSON.stringify(v),
  default: (v, fallback) => (v === undefined || v === null || v === "" ? fallback : v),
};

function resolve(path: string, data: Record<string, unknown>): unknown {
  if (path === ".") return data["."] !== undefined ? data["."] : data;
  const keys = path.split(".");
  let current: unknown = data;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function applyFilters(
  value: unknown,
  filterChain: string,
  filters: Record<string, FilterFn>,
): unknown {
  const parts = filterChain.split("|").map((s) => s.trim());
  let result = value;

  for (let i = 1; i < parts.length; i++) {
    const filterExpr = parts[i];
    const colonIdx = filterExpr.indexOf(":");
    let name: string;
    let args: string[] = [];

    if (colonIdx !== -1) {
      name = filterExpr.slice(0, colonIdx).trim();
      args = filterExpr
        .slice(colonIdx + 1)
        .split(",")
        .map((a) => a.trim().replace(/^['"]|['"]$/g, ""));
    } else {
      name = filterExpr.trim();
    }

    const fn = filters[name] ?? BUILT_IN_FILTERS[name];
    if (fn) {
      result = fn(result, ...args);
    }
  }

  return result;
}

function renderBlock(
  template: string,
  data: Record<string, unknown>,
  filters: Record<string, FilterFn>,
): string {
  let result = "";
  let i = 0;

  while (i < template.length) {
    const openIdx = template.indexOf("{{", i);
    if (openIdx === -1) {
      result += template.slice(i);
      break;
    }

    result += template.slice(i, openIdx);

    const closeIdx = template.indexOf("}}", openIdx);
    if (closeIdx === -1) {
      result += template.slice(openIdx);
      break;
    }

    const tag = template.slice(openIdx + 2, closeIdx).trim();

    // {{#if expr}}...{{#else}}...{{/if}}
    if (tag.startsWith("#if ")) {
      const expr = tag.slice(4).trim();
      const endTag = "{{/if}}";
      const endIdx = findMatchingEnd(template, closeIdx + 2, "#if", "/if");
      if (endIdx === -1) {
        result += template.slice(openIdx);
        break;
      }

      const inner = template.slice(closeIdx + 2, endIdx);
      const elseIdx = findElse(inner);
      const condition = resolve(expr, data);

      if (condition) {
        const trueBranch = elseIdx !== -1 ? inner.slice(0, elseIdx) : inner;
        result += renderBlock(trueBranch, data, filters);
      } else if (elseIdx !== -1) {
        const falseBranch = inner.slice(elseIdx + "{{#else}}".length);
        result += renderBlock(falseBranch, data, filters);
      }

      i = endIdx + endTag.length;
      continue;
    }

    // {{#each expr}}...{{/each}}
    if (tag.startsWith("#each ")) {
      const expr = tag.slice(6).trim();
      const endTag = "{{/each}}";
      const endIdx = findMatchingEnd(template, closeIdx + 2, "#each", "/each");
      if (endIdx === -1) {
        result += template.slice(openIdx);
        break;
      }

      const inner = template.slice(closeIdx + 2, endIdx);
      const items = resolve(expr, data);

      if (Array.isArray(items)) {
        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          const itemData: Record<string, unknown> =
            typeof item === "object" && item !== null
              ? { ...data, ...(item as Record<string, unknown>), ".": item, "@index": j }
              : { ...data, ".": item, "@index": j };
          result += renderBlock(inner, itemData, filters);
        }
      }

      i = endIdx + endTag.length;
      continue;
    }

    // {{expr | filter}}
    const value = resolve(tag.split("|")[0].trim(), data);
    const filtered = tag.includes("|") ? applyFilters(value, tag, filters) : value;
    result += filtered !== undefined && filtered !== null ? String(filtered) : "";

    i = closeIdx + 2;
  }

  return result;
}

function findMatchingEnd(
  template: string,
  start: number,
  openTag: string,
  closeTag: string,
): number {
  let depth = 1;
  let i = start;
  while (i < template.length) {
    const nextOpen = template.indexOf(`{{#${openTag.slice(1)}`, i);
    const nextClose = template.indexOf(`{{${closeTag}}}`, i);

    if (nextClose === -1) return -1;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 3;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + 3;
    }
  }
  return -1;
}

function findElse(inner: string): number {
  let depth = 0;
  let i = 0;
  while (i < inner.length) {
    const nextIf = inner.indexOf("{{#if ", i);
    const nextEndIf = inner.indexOf("{{/if}}", i);
    const nextElse = inner.indexOf("{{#else}}", i);

    const positions = [
      nextIf !== -1 ? nextIf : Infinity,
      nextEndIf !== -1 ? nextEndIf : Infinity,
      nextElse !== -1 ? nextElse : Infinity,
    ];
    const minPos = Math.min(...positions);

    if (minPos === Infinity) return -1;

    if (minPos === nextIf) { depth++; i = nextIf + 6; }
    else if (minPos === nextEndIf) { depth--; i = nextEndIf + 7; }
    else if (minPos === nextElse && depth === 0) { return nextElse; }
    else { i = nextElse + 9; }
  }
  return -1;
}

/**
 * 템플릿을 렌더링한다.
 */
export function render(
  template: string,
  data: Record<string, unknown>,
  options: RenderOptions = {},
): string {
  const filters = { ...BUILT_IN_FILTERS, ...options.filters };
  return renderBlock(template, data, filters);
}
