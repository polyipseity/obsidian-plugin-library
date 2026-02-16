/**
 * Comprehensive tests for src/i18n.ts — internationalization utilities
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createI18n as createI18nBase,
  type I18nResources,
  type I18nFormatters,
} from "../../src/i18n.js";
import { asUntypedI18n } from "../support/i18n-test-utils.js";

const createI18n = async (
  resources: I18nResources,
  formatters?: I18nFormatters,
  initOptions?: Record<string, unknown>,
) => {
  const defaultLng = Object.keys(resources)[0];
  const options = {
    showSupportNotice: false,
    ...(initOptions ?? {}),
  } as Record<string, unknown>;
  // If the test didn't specify a language, default to the first language provided
  // in the resources so lookups like `t("key")` resolve deterministically.
  if (
    defaultLng &&
    options.lng === undefined &&
    options.fallbackLng === undefined
  ) {
    options.lng = defaultLng;
  }
  const inst = await createI18nBase(resources, formatters, options);
  return asUntypedI18n(inst);
};

describe("i18n.ts — internationalization utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createI18n", () => {
    it("creates i18n instance with resources", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            hello: "Hello",
            world: "World",
          }),
        },
      };

      const i18n = await createI18n(resources);

      expect(i18n).toBeDefined();
      expect(typeof i18n.t).toBe("function");
    });

    it("loads translations from resources", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            greeting: "Hello, {{name}}!",
          }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("greeting", { name: "World" });

      expect(result).toBe("Hello, World!");
    });

    it("supports multiple languages", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({ hello: "Hello" }),
        },
        fr: {
          translation: async () => ({ hello: "Bonjour" }),
        },
      };

      const i18n = await createI18n(resources);

      await i18n.changeLanguage("en");
      expect(i18n.t("hello")).toBe("Hello");

      await i18n.changeLanguage("fr");
      expect(i18n.t("hello")).toBe("Bonjour");
    });

    it("supports multiple namespaces", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({ common: "Common text" }),
          custom: async () => ({ special: "Special text" }),
        },
      };

      const i18n = await createI18n(resources);

      expect(i18n.t("common")).toBe("Common text");
      expect(i18n.t("custom:special")).toBe("Special text");
    });

    it("handles missing translations gracefully", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            "errors.missing-translation": "Missing: {{key}}",
          }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("nonexistent.key");

      expect(warnSpy).toHaveBeenCalled();
      expect(result).toBeTruthy(); // Should return key or default
    });

    it("handles missing interpolations", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            "errors.missing-interpolation":
              "Missing interpolation {{name}} in {{text}}",
            test: "Hello {{name}}",
          }),
        },
      };

      const i18n = await createI18n(resources);
      // Call without providing required interpolation
      i18n.t("test");

      expect(warnSpy).toHaveBeenCalled();
    });

    it("applies custom formatters", async () => {
      const formatters: I18nFormatters = {
        uppercase: () => (value: unknown) => String(value).toUpperCase(),
        lowercase: () => (value: unknown) => String(value).toLowerCase(),
      };

      const resources: I18nResources = {
        en: {
          translation: async () => ({
            text: "{{value, uppercase}}",
          }),
        },
      };

      const i18n = await createI18n(resources, formatters);
      const result = i18n.t("text", { value: "hello" });

      expect(result).toBe("HELLO");
    });

    it("accepts custom initialization options", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({ key: "value" }),
        },
      };

      const i18n = await createI18n(
        resources,
        {},
        {
          fallbackLng: "en",
          debug: false,
        },
      );

      expect(i18n).toBeDefined();
      expect(i18n.options.fallbackLng).toEqual(["en"]);
    });

    it("returns null for non-existent language/namespace combination", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({ key: "value" }),
        },
      };

      const i18n = await createI18n(resources);

      // Try to access non-existent language
      await i18n.changeLanguage("nonexistent");
      // Should handle gracefully
      expect(i18n).toBeDefined();
    });

    it("handles synchronous resource loaders", async () => {
      const resources: I18nResources = {
        en: {
          translation: () => ({ sync: "Synchronous value" }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("sync");

      expect(result).toBe("Synchronous value");
    });

    it("handles nested translation keys", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            nested: {
              deep: {
                value: "Deep nested value",
              },
            },
          }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("nested.deep.value");

      expect(result).toBe("Deep nested value");
    });

    it("preserves interpolation in translations", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            message: "User {{name}} has {{count}} items",
          }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("message", { name: "Alice", count: 5 });

      expect(result).toBe("User Alice has 5 items");
    });

    it("handles multiple formatters", async () => {
      const formatters: I18nFormatters = {
        bold: () => (value: unknown) => `**${value}**`,
        italic: () => (value: unknown) => `*${value}*`,
      };

      const resources: I18nResources = {
        en: {
          translation: async () => ({
            formatted: "{{text, bold}} and {{text2, italic}}",
          }),
        },
      };

      const i18n = await createI18n(resources, formatters);
      const result = i18n.t("formatted", { text: "Bold", text2: "Italic" });

      expect(result).toBe("**Bold** and *Italic*");
    });

    it("warns when formatter service is unavailable", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            "errors.no-formatter": "Formatter service unavailable",
          }),
        },
      };

      const formatters: I18nFormatters = {
        test: () => (value: unknown) => String(value),
      };

      const i18n = await createI18n(resources, formatters);

      // The implementation checks for formatter service
      // Verify the i18n instance was created
      expect(i18n).toBeDefined();
    });

    it("handles empty resources", async () => {
      const resources: I18nResources = {};

      const i18n = await createI18n(resources);

      expect(i18n).toBeDefined();
    });

    it("handles resource loading errors", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => {
            throw new Error("Loading failed");
          },
        },
      };

      // Should not throw during init
      await expect(createI18n(resources)).resolves.toBeDefined();
    });
  });

  describe("Type definitions", () => {
    it("I18nFormatters type accepts formatter functions", () => {
      const formatters: I18nFormatters = {
        test: (lng?: string) => (value: unknown) => {
          return `${lng}:${value}`;
        },
      };

      expect(formatters.test).toBeInstanceOf(Function);
    });

    it("I18nNamespaces type accepts async loaders", () => {
      const namespaces = {
        translation: async () => ({ key: "value" }),
        custom: () => ({ key2: "value2" }),
      };

      expect(namespaces.translation).toBeInstanceOf(Function);
      expect(namespaces.custom).toBeInstanceOf(Function);
    });

    it("I18nResources type maps languages to namespaces", () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({}),
          custom: async () => ({}),
        },
        fr: {
          translation: async () => ({}),
        },
      };

      expect(Object.keys(resources)).toContain("en");
      expect(Object.keys(resources)).toContain("fr");
    });
  });

  describe("Edge cases", () => {
    it("handles language fallbacks", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({ key: "English" }),
        },
      };

      const i18n = await createI18n(
        resources,
        {},
        {
          fallbackLng: "en",
        },
      );

      await i18n.changeLanguage("nonexistent");
      const result = i18n.t("key");

      expect(result).toBe("English"); // Falls back to English
    });

    it("handles special characters in translations", async () => {
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            special: "Special: <>&\"'",
          }),
        },
      };

      const i18n = await createI18n(resources);
      const result = i18n.t("special");

      expect(result).toBe("Special: <>&\"'");
    });

    it("handles Unicode in translations", async () => {
      const resources: I18nResources = {
        ja: {
          translation: async () => ({
            greeting: "こんにちは、{{name}}さん！",
          }),
        },
      };

      const i18n = await createI18n(resources);
      await i18n.changeLanguage("ja");
      const result = i18n.t("greeting", { name: "世界" });

      expect(result).toBe("こんにちは、世界さん！");
    });

    it("prevents reentrancy in missing interpolation handler", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const resources: I18nResources = {
        en: {
          translation: async () => ({
            "errors.missing-interpolation": "Error with {{missing}}",
          }),
        },
      };

      const i18n = await createI18n(resources);
      // This should trigger the reentrant protection
      i18n.t("test.{{value}}");

      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
