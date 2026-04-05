import { describe, it, expect, vi } from "vitest";
import { createFeatureFlags } from "./featureFlags";

describe("createFeatureFlags", () => {
  describe("boolean 플래그", () => {
    it("true면 활성화", () => {
      const flags = createFeatureFlags({ darkMode: true, legacy: false });
      expect(flags.isEnabled("darkMode")).toBe(true);
      expect(flags.isEnabled("legacy")).toBe(false);
    });
  });

  describe("condition 플래그", () => {
    it("조건이 참이면 활성화", () => {
      const flags = createFeatureFlags({
        betaFeature: {
          enabled: true,
          condition: (ctx) => ctx.role === "beta",
        },
      });

      expect(flags.isEnabled("betaFeature", { role: "beta" })).toBe(true);
      expect(flags.isEnabled("betaFeature", { role: "user" })).toBe(false);
    });

    it("context 없으면 condition 플래그는 비활성화", () => {
      const flags = createFeatureFlags({
        feature: { enabled: true, condition: () => true },
      });
      expect(flags.isEnabled("feature")).toBe(false);
    });

    it("enabled: false면 condition 무시", () => {
      const flags = createFeatureFlags({
        off: { enabled: false, condition: () => true },
      });
      expect(flags.isEnabled("off", {})).toBe(false);
    });
  });

  describe("rollout 플래그", () => {
    it("rollout: 1이면 항상 활성화", () => {
      const flags = createFeatureFlags({
        full: { enabled: true, rollout: 1 },
      });

      for (let i = 0; i < 10; i++) {
        expect(flags.isEnabled("full")).toBe(true);
      }
    });

    it("rollout: 0이면 항상 비활성화", () => {
      const flags = createFeatureFlags({
        none: { enabled: true, rollout: 0 },
      });

      for (let i = 0; i < 10; i++) {
        expect(flags.isEnabled("none")).toBe(false);
      }
    });

    it("rollout: 0.5면 대략 절반 활성화", () => {
      const flags = createFeatureFlags({
        half: { enabled: true, rollout: 0.5 },
      });

      let enabled = 0;
      const trials = 1000;
      for (let i = 0; i < trials; i++) {
        if (flags.isEnabled("half")) enabled++;
      }

      // 30%~70% 범위 (충분히 넓은 허용 범위)
      expect(enabled).toBeGreaterThan(trials * 0.3);
      expect(enabled).toBeLessThan(trials * 0.7);
    });
  });

  describe("override", () => {
    it("플래그를 강제 활성화한다", () => {
      const flags = createFeatureFlags({ feature: false });
      flags.override("feature", true);
      expect(flags.isEnabled("feature")).toBe(true);
    });

    it("플래그를 강제 비활성화한다", () => {
      const flags = createFeatureFlags({ feature: true });
      flags.override("feature", false);
      expect(flags.isEnabled("feature")).toBe(false);
    });

    it("오버라이드가 condition/rollout보다 우선한다", () => {
      const flags = createFeatureFlags({
        gated: { enabled: true, condition: () => false },
      });
      flags.override("gated", true);
      expect(flags.isEnabled("gated")).toBe(true);
    });
  });

  describe("clearOverride / clearAllOverrides", () => {
    it("개별 오버라이드를 제거한다", () => {
      const flags = createFeatureFlags({ a: true });
      flags.override("a", false);
      flags.clearOverride("a");
      expect(flags.isEnabled("a")).toBe(true);
    });

    it("모든 오버라이드를 제거한다", () => {
      const flags = createFeatureFlags({ a: true, b: false });
      flags.override("a", false);
      flags.override("b", true);
      flags.clearAllOverrides();
      expect(flags.isEnabled("a")).toBe(true);
      expect(flags.isEnabled("b")).toBe(false);
    });
  });

  describe("getAll", () => {
    it("모든 플래그 상태를 반환한다", () => {
      const flags = createFeatureFlags({ a: true, b: false });
      expect(flags.getAll()).toEqual({ a: true, b: false });
    });

    it("오버라이드를 반영한다", () => {
      const flags = createFeatureFlags({ a: true, b: false });
      flags.override("b", true);
      expect(flags.getAll()).toEqual({ a: true, b: true });
    });
  });

  describe("subscribe", () => {
    it("override 시 알림한다", () => {
      const flags = createFeatureFlags({ a: true });
      const handler = vi.fn();

      flags.subscribe(handler);
      flags.override("a", false);

      expect(handler).toHaveBeenCalledWith("a", false);
    });

    it("해제 함수로 구독 취소", () => {
      const flags = createFeatureFlags({ a: true });
      const handler = vi.fn();

      const off = flags.subscribe(handler);
      off();
      flags.override("a", false);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("names", () => {
    it("플래그 이름 목록을 반환한다", () => {
      const flags = createFeatureFlags({ x: true, y: false, z: true });
      expect(flags.names.sort()).toEqual(["x", "y", "z"]);
    });
  });

  describe("미등록 플래그", () => {
    it("미등록 플래그는 false", () => {
      const flags = createFeatureFlags({ known: true });
      expect(flags.isEnabled("unknown" as any)).toBe(false);
    });
  });
});
