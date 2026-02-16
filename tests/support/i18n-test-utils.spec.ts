/**
 * Tests for tests/support/i18n-test-utils.ts (moved from `tests/src/support`).
 *
 * Placed under `tests/support` so imports resolve the same way as other
 * support helpers in this repo.
 */

import { vi, describe, it, expect } from "vitest";
import {
  createI18n as createI18nBase,
  type I18nResources,
} from "../../src/i18n.js";
import { asUntypedI18n } from "./i18n-test-utils.js";

describe("tests/support/i18n-test-utils — asUntypedI18n (support)", () => {
  const makeI18n = async (resources: I18nResources) => {
    const defaultLng = Object.keys(resources)[0];
    const options = { showSupportNotice: false } as Record<string, unknown>;
    if (
      defaultLng &&
      options.lng === undefined &&
      options.fallbackLng === undefined
    ) {
      options.lng = defaultLng;
    }
    return createI18nBase(resources, {}, options);
  };

  it("returns the same runtime instance and preserves behavior", async () => {
    const resources: I18nResources = {
      en: { translation: async () => ({ hello: "Hello" }) },
      fr: { translation: async () => ({ hello: "Bonjour" }) },
    };

    const inst = await makeI18n(resources);
    const untyped = asUntypedI18n(inst);

    expect(untyped).toBe(inst);
    expect(untyped.t("hello")).toBe("Hello");

    await untyped.changeLanguage("fr");
    expect(untyped.t("hello")).toBe("Bonjour");

    untyped.addResource("fr", "translation", "dynamic", "Dynamique");
    expect(untyped.t("dynamic")).toBe("Dynamique");
  });

  it("allows calling `t` with arbitrary string keys at runtime", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const resources: I18nResources = {
      en: { translation: async () => ({ exist: "present" }) },
    };

    const inst = await makeI18n(resources);
    const untyped = asUntypedI18n(inst);

    const unknown = untyped.t("some:nonexistent:key");
    expect(typeof unknown).toBe("string");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing-translation"),
    );
    warnSpy.mockRestore();
  });

  it("widens `t` at the type level so a `string` key is accepted (compile-time check)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const resources: I18nResources = {
      en: { translation: async () => ({ ok: "value" }) },
    };

    const inst = await makeI18n(resources);
    const untyped = asUntypedI18n(inst);

    // compile-time assertion: should be assignable
    const acceptsStringKey: (k: string, opts?: unknown) => string = untyped.t;

    const result = acceptsStringKey("i:am:just:a:string");
    expect(typeof result).toBe("string");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("missing-translation"),
    );
    warnSpy.mockRestore();
  });
});
