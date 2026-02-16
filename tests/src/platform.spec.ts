/**
 * Comprehensive tests for src/platform.ts — platform detection
 */
import { describe, it, expect } from "vitest";
import { Platform } from "../../src/platform.js";

describe("platform.ts — platform detection", () => {
  describe("Platform constants", () => {
    it("DESKTOP contains expected platforms", () => {
      expect(Platform.DESKTOP).toEqual(["darwin", "linux", "win32"]);
    });

    it("MOBILE contains expected platforms", () => {
      expect(Platform.MOBILE).toEqual(["android", "ios"]);
    });

    it("ALL contains all platforms plus unknown", () => {
      expect(Platform.ALL).toEqual([
        "darwin",
        "linux",
        "win32",
        "android",
        "ios",
        "unknown",
      ]);
    });

    it("platform arrays are frozen", () => {
      expect(Object.isFrozen(Platform.DESKTOP)).toBe(true);
      expect(Object.isFrozen(Platform.MOBILE)).toBe(true);
      expect(Object.isFrozen(Platform.ALL)).toBe(true);
    });
  });

  describe("Platform.CURRENT", () => {
    it("is one of the defined platforms", () => {
      expect(Platform.ALL).toContain(Platform.CURRENT);
    });

    it("has a string value", () => {
      expect(typeof Platform.CURRENT).toBe("string");
    });

    it("is not empty", () => {
      expect(Platform.CURRENT.length).toBeGreaterThan(0);
    });
  });

  describe("Platform detection logic", () => {
    // Note: We can't easily mock the Platform module since it's evaluated at import time
    // These tests verify the structure is correct
    it("CURRENT is a valid platform identifier", () => {
      const validPlatforms: string[] = [
        "darwin",
        "linux",
        "win32",
        "android",
        "ios",
        "unknown",
      ];
      expect(validPlatforms).toContain(Platform.CURRENT);
    });

    it("desktop platforms are subset of all", () => {
      Platform.DESKTOP.forEach((platform) => {
        expect(Platform.ALL).toContain(platform);
      });
    });

    it("mobile platforms are subset of all", () => {
      Platform.MOBILE.forEach((platform) => {
        expect(Platform.ALL).toContain(platform);
      });
    });

    it("desktop and mobile platforms don't overlap", () => {
      const desktopSet = new Set(Platform.DESKTOP);
      Platform.MOBILE.forEach((mobile) => {
        // @ts-expect-error - intentional test of set membership
        expect(desktopSet.has(mobile)).toBe(false);
      });
    });
  });

  describe("Type exports", () => {
    it("Platform namespace exports type utilities", () => {
      // TypeScript compile-time checks
      type Desktop = Platform.Desktop;
      type Mobile = Platform.Mobile;
      type All = Platform.All;
      type Current = Platform.Current;

      // Runtime verification that constants match types
      const desktop: Desktop = "darwin";
      const mobile: Mobile = "ios";
      const all: All = "unknown";
      const current: Current = Platform.CURRENT;

      expect(Platform.DESKTOP).toContain(desktop);
      expect(Platform.MOBILE).toContain(mobile);
      expect(Platform.ALL).toContain(all);
      expect(current).toBe(Platform.CURRENT);
    });
  });
});
