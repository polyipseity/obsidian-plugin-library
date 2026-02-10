import { describe, it, expect } from "vitest";
import { LibraryLocales } from "../../assets/locales.js";

describe("LibraryLocales", () => {
  it("exports defaults from library and namespaces", () => {
    expect(LibraryLocales.DEFAULT_LANGUAGE).toBe("en");
    expect(LibraryLocales.DEFAULT_NAMESPACE).toBe("translation");

    // NAMESPACES should include the three expected namespaces
    const namespaces = Array.from(LibraryLocales.NAMESPACES);
    expect(namespaces).toEqual(
      expect.arrayContaining(["translation", "language", "asset"]),
    );
  });

  it("provides en resources (translation, asset, language)", async () => {
    const enRes = LibraryLocales.RESOURCES[LibraryLocales.DEFAULT_LANGUAGE];

    const translation = await enRes[LibraryLocales.DEFAULT_NAMESPACE]();
    // Check a known translation key and a settings-related key
    expect(translation.generic.cancel).toBe("cancel");
    expect(translation.settings.language).toBe(
      "$t(generic.language, capitalize)",
    );

    const asset = await enRes.asset();
    expect(asset.settings["language-icon"]).toBe("languages");

    const language = await enRes.language();
    expect(language.en).toBe("English");
  });

  it("lists languages and includes expected entries", () => {
    const langs = Array.from(LibraryLocales.LANGUAGES);
    expect(langs).toEqual(expect.arrayContaining(["en", "pt", "pt-BR"]));
  });

  it("loads translation resources for all declared languages", async () => {
    const languages = Array.from(LibraryLocales.LANGUAGES);

    // Prepare loaders: each language should expose a default namespace loader
    const loaders = languages.map((lang) => {
      const res = LibraryLocales.RESOURCES[lang];
      expect(res).toBeDefined();
      const loader = res[LibraryLocales.DEFAULT_NAMESPACE];
      expect(typeof loader).toBe("function");
      return loader();
    });

    const results = await Promise.all(loaders);
    for (const r of results) {
      const record = r;
      expect(typeof record).toBe("object");
      expect(record).not.toBeNull();
    }

    // Sanity checks for special keys
    const ptBr = LibraryLocales.RESOURCES["pt-BR"].translation;
    expect(typeof ptBr).toBe("function");
    const ptBrRes = await ptBr();
    expect(typeof ptBrRes).toBe("object");

    const zhHans = LibraryLocales.RESOURCES["zh-Hans"].translation;
    expect(typeof zhHans).toBe("function");
    const zhHansRes = await zhHans();
    expect(typeof zhHansRes).toBe("object");
  });
});
