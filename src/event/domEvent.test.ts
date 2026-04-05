// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { onEvent, onEvents, onceEvent, delegateEvent, onKeyCombo } from "./domEvent";

// jsdom 환경에서 테스트

describe("onEvent", () => {
  it("이벤트를 등록하고 해제한다", () => {
    const el = document.createElement("div");
    const handler = vi.fn();

    const off = onEvent(el, "click", handler);
    el.click();
    expect(handler).toHaveBeenCalledOnce();

    off();
    el.click();
    expect(handler).toHaveBeenCalledOnce(); // 해제 후 안 불림
  });
});

describe("onEvents", () => {
  it("여러 이벤트를 한 번에 등록/해제한다", () => {
    const el = document.createElement("div");
    const clickHandler = vi.fn();
    const mouseHandler = vi.fn();

    const off = onEvents(el, {
      click: clickHandler,
      mouseenter: mouseHandler,
    });

    el.click();
    expect(clickHandler).toHaveBeenCalledOnce();

    off();
    el.click();
    expect(clickHandler).toHaveBeenCalledOnce();
  });
});

describe("onceEvent", () => {
  it("한 번만 실행된다", () => {
    const el = document.createElement("div");
    const handler = vi.fn();

    onceEvent(el, "click", handler);
    el.click();
    el.click();

    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("delegateEvent", () => {
  it("자식 요소의 이벤트를 부모에서 위임 처리한다", () => {
    const parent = document.createElement("div");
    const child = document.createElement("button");
    child.className = "btn";
    parent.appendChild(child);
    document.body.appendChild(parent);

    const handler = vi.fn();
    const off = delegateEvent(parent, "click", ".btn", handler);

    child.click();
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][1]).toBe(child);

    off();
    child.click();
    expect(handler).toHaveBeenCalledOnce();

    document.body.removeChild(parent);
  });

  it("매칭되지 않는 자식은 무시", () => {
    const parent = document.createElement("div");
    const other = document.createElement("span");
    parent.appendChild(other);
    document.body.appendChild(parent);

    const handler = vi.fn();
    delegateEvent(parent, "click", ".btn", handler);

    other.click();
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(parent);
  });
});

describe("onKeyCombo", () => {
  it("단일 키를 감지한다", () => {
    const handler = vi.fn();
    const target = new EventTarget();

    const off = onKeyCombo("escape", handler, target);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handler).toHaveBeenCalledOnce();

    off();
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("ctrl+키 조합을 감지한다", () => {
    const handler = vi.fn();
    const target = new EventTarget();

    onKeyCombo("ctrl+s", handler, target);

    // ctrl 없이
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(handler).not.toHaveBeenCalled();

    // ctrl+s
    target.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("shift+키 조합", () => {
    const handler = vi.fn();
    const target = new EventTarget();

    onKeyCombo("shift+enter", handler, target);

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(handler).not.toHaveBeenCalled();

    target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("ctrl+shift+키 조합", () => {
    const handler = vi.fn();
    const target = new EventTarget();

    onKeyCombo("ctrl+shift+p", handler, target);

    target.dispatchEvent(new KeyboardEvent("keydown", {
      key: "p", ctrlKey: true, shiftKey: true,
    }));
    expect(handler).toHaveBeenCalledOnce();
  });
});
