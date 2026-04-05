// DOM 이벤트 유틸 (DOM Event Utilities).
//
// === 예상 사용처 ===
// - React/Vue 외부에서 바닐라 이벤트 리스너 관리 (자동 정리)
// - 이벤트 위임 — 부모에 한 번 등록으로 자식 이벤트 처리 (리스트/테이블)
// - 키보드 단축키 등록 (Ctrl+S, Cmd+K 등)
// - 외부 클릭 감지 (모달/드롭다운 닫기)
// - 미디어 쿼리 변경 감지 (다크 모드/반응형)
// - IntersectionObserver 래핑 (무한 스크롤, 지연 로딩)
// - 스크롤/리사이즈 최적화 (passive + throttle)
//
// const cleanup = onClickOutside(dropdownEl, () => close());
// const off = onKeyCombo("ctrl+s", (e) => { e.preventDefault(); save(); });
// const off2 = onMediaChange("(prefers-color-scheme: dark)", (dark) => setTheme(dark));

export type CleanupFn = () => void;

/**
 * 이벤트 리스너를 등록하고 해제 함수를 반환한다.
 * addEventListener의 반환값 없는 문제를 해결.
 */
export function onEvent<K extends keyof HTMLElementEventMap>(
  target: EventTarget,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): CleanupFn {
  target.addEventListener(event, handler as EventListener, options);
  return () => target.removeEventListener(event, handler as EventListener, options);
}

/**
 * 여러 이벤트를 한 번에 등록하고 일괄 해제 함수를 반환한다.
 */
export function onEvents(
  target: EventTarget,
  events: Record<string, EventListener>,
  options?: AddEventListenerOptions,
): CleanupFn {
  const cleanups: CleanupFn[] = [];
  for (const [event, handler] of Object.entries(events)) {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  }
  return () => cleanups.forEach((fn) => fn());
}

/**
 * 한 번만 실행되는 이벤트 리스너.
 */
export function onceEvent<K extends keyof HTMLElementEventMap>(
  target: EventTarget,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
): CleanupFn {
  return onEvent(target, event, handler, { once: true });
}

/**
 * 이벤트 위임. 부모에 한 번 등록하고 selector 매칭하는 자식만 처리.
 * 동적 추가 요소도 자동 처리.
 */
export function delegateEvent(
  parent: EventTarget,
  event: string,
  selector: string,
  handler: (e: Event, target: Element) => void,
): CleanupFn {
  const listener = (e: Event) => {
    const eventTarget = e.target as Element | null;
    if (!eventTarget) return;

    const matched = eventTarget.closest(selector);
    if (matched && (parent as Element).contains?.(matched)) {
      handler(e, matched);
    }
  };

  parent.addEventListener(event, listener);
  return () => parent.removeEventListener(event, listener);
}

/**
 * 요소 바깥 클릭을 감지한다.
 */
export function onClickOutside(
  element: Element,
  handler: (e: Event) => void,
): CleanupFn {
  const listener = (e: Event) => {
    const target = e.target as Node | null;
    if (target && !element.contains(target)) {
      handler(e);
    }
  };

  // 약간의 지연으로 현재 클릭 이벤트 무시
  const timer = setTimeout(() => {
    document.addEventListener("click", listener, true);
  }, 0);

  return () => {
    clearTimeout(timer);
    document.removeEventListener("click", listener, true);
  };
}

/**
 * 키보드 단축키를 등록한다.
 * "ctrl+s", "cmd+k", "shift+enter", "escape" 등.
 */
export function onKeyCombo(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  target: EventTarget = typeof document !== "undefined" ? document : new EventTarget(),
): CleanupFn {
  const parts = combo.toLowerCase().split("+").map((s) => s.trim());
  const key = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));

  const listener = (e: Event) => {
    const ke = e as KeyboardEvent;
    const pressed = ke.key.toLowerCase();

    const ctrlMatch = modifiers.has("ctrl") === (ke.ctrlKey || ke.metaKey);
    const shiftMatch = modifiers.has("shift") === ke.shiftKey;
    const altMatch = modifiers.has("alt") === ke.altKey;

    // ctrl 없는데 ctrl이 눌린 경우 방지
    if (!modifiers.has("ctrl") && (ke.ctrlKey || ke.metaKey)) return;
    if (!modifiers.has("shift") && ke.shiftKey) return;
    if (!modifiers.has("alt") && ke.altKey) return;

    if (pressed === key && ctrlMatch && shiftMatch && altMatch) {
      handler(ke);
    }
  };

  target.addEventListener("keydown", listener);
  return () => target.removeEventListener("keydown", listener);
}

/**
 * 미디어 쿼리 변경을 감지한다.
 */
export function onMediaChange(
  query: string,
  handler: (matches: boolean) => void,
): CleanupFn {
  const mql = window.matchMedia(query);
  handler(mql.matches); // 즉시 현재 상태 전달

  const listener = (e: MediaQueryListEvent) => handler(e.matches);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}
