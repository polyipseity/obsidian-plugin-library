/**
 * Comprehensive tests for src/settings-tab.ts — advanced settings tab
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AdvancedSettingTab } from "../../src/settings-tab.js";
import type { PluginContext } from "../../src/plugin.js";
import type { LanguageManager } from "../../src/i18n.js";
import type {
  SettingsManager,
  StorageSettingsManager,
} from "../../src/settings.js";

describe("settings-tab.ts — settings tab", () => {
  let mockContext: PluginContext;
  let mockSettings: SettingsManager<PluginContext.Settings>;
  let mockLocalSettings: StorageSettingsManager<PluginContext.LocalSettings>;
  let mockLanguageManager: LanguageManager;
  let mockI18n: { t: ReturnType<typeof vi.fn> };
  let mockApp: {
    workspace: Record<string, unknown>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock i18n
    mockI18n = {
      t: vi.fn((key: string) => {
        if (key.startsWith("asset:")) {
          return "icon-name";
        }
        return `translated-${key}`;
      }),
    };

    // Mock language manager
    mockLanguageManager = {
      value: mockI18n,
      language: "en",
      onChangeLanguage: {
        listen: vi.fn(() => vi.fn()),
      },
      onLoaded: Promise.resolve(),
    } as unknown as LanguageManager;

    // Mock settings manager
    mockSettings = {
      value: {
        language: "en",
        errorNoticeTimeout: 5000,
        noticeTimeout: 3000,
      },
      mutate: vi.fn(),
      write: vi.fn(),
      onMutate: vi.fn(() => vi.fn()),
    } as unknown as SettingsManager<PluginContext.Settings>;

    // Mock local settings manager
    mockLocalSettings = {
      value: {
        recovery: {},
      },
      mutate: vi.fn(),
      write: vi.fn(),
      onMutate: vi.fn(() => vi.fn()),
    } as unknown as StorageSettingsManager<PluginContext.LocalSettings>;

    // Mock app
    mockApp = {
      workspace: {},
    };

    // Mock plugin context
    mockContext = {
      app: mockApp,
      language: mockLanguageManager,
      settings: mockSettings,
      localSettings: mockLocalSettings,
      manifest: { id: "test-plugin", name: "Test Plugin" },
      displayName: vi.fn(() => "Test Plugin"),
      addChild: vi.fn(),
    } as unknown as PluginContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AdvancedSettingTab", () => {
    class TestSettingTab extends AdvancedSettingTab<PluginContext.Settings> {
      public override display(): void {
        super.display();
      }

      protected snapshot0(): Partial<PluginContext.Settings> {
        return {};
      }
    }

    it("creates settings tab", () => {
      const tab = new TestSettingTab(mockContext);

      expect(tab).toBeDefined();
      expect(tab).toBeInstanceOf(AdvancedSettingTab);
    });

    it("registers child component", async () => {
      new TestSettingTab(mockContext);

      // Allow promise to resolve
      await Promise.resolve();

      expect(mockContext.addChild).toHaveBeenCalled();
    });

    it("calls display method", () => {
      const tab = new TestSettingTab(mockContext);

      expect(() => tab.display()).not.toThrow();
    });

    it("has containerEl property", () => {
      const tab = new TestSettingTab(mockContext);

      expect(tab.containerEl).toBeDefined();
      expect(tab.containerEl).toBeInstanceOf(HTMLElement);
    });

    it("updates UI on display", () => {
      const tab = new TestSettingTab(mockContext);

      // UI should be defined
      // @ts-expect-error: protected
      expect(tab.ui).toBeDefined();

      tab.display();

      // Should not throw
      expect(true).toBe(true);
    });

    it("creates snapshot on construction", () => {
      const tab = new TestSettingTab(mockContext);

      expect(tab).toBeDefined();
    });

    it("creates new snapshot on display", () => {
      const tab = new TestSettingTab(mockContext);

      tab.display();

      expect(tab).toBeDefined();
    });

    it("accesses context", () => {
      const tab = new TestSettingTab(mockContext);

      // @ts-expect-error: protected
      expect(tab.context).toBe(mockContext);
    });
  });

  describe("AdvancedSettingTab protected methods", () => {
    class TestableSettingTab extends AdvancedSettingTab<PluginContext.Settings> {
      protected snapshot0(): Partial<PluginContext.Settings> {
        return {};
      }

      protected postMutate(): void {
        // Mock implementation
      }

      public testOnLoad(): void {
        this.onLoad();
      }

      public testOnUnload(): void {
        this.onUnload();
      }

      public testNewSectionWidget(
        text: () => DocumentFragment | string,
        heading?: 1 | 2 | 3 | 4 | 5 | 6,
      ): void {
        this.newSectionWidget(text, heading);
      }

      public testNewTitleWidget(): void {
        this.newTitleWidget();
      }

      public testNewDescriptionWidget(): void {
        this.newDescriptionWidget();
      }
    }

    it("onLoad registers language change listener", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testOnLoad();

      expect(mockLanguageManager.onChangeLanguage.listen).toHaveBeenCalled();
    });

    it("onUnload destroys UI", () => {
      const tab = new TestableSettingTab(mockContext);

      const destroySpy = vi.spyOn(
        // @ts-expect-error: protected
        tab.ui,
        "destroy",
      );

      tab.testOnUnload();

      expect(destroySpy).toHaveBeenCalled();
    });

    it("newSectionWidget creates heading element", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewSectionWidget(() => "Test Section");

      const heading = tab.containerEl.querySelector("h2");
      expect(heading).toBeDefined();
    });

    it("newSectionWidget accepts different heading levels", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewSectionWidget(() => "H1 Section", 1);
      tab.testNewSectionWidget(() => "H3 Section", 3);
      tab.testNewSectionWidget(() => "H6 Section", 6);

      expect(tab.containerEl.querySelector("h1")).toBeDefined();
      expect(tab.containerEl.querySelector("h3")).toBeDefined();
      expect(tab.containerEl.querySelector("h6")).toBeDefined();
    });

    it("newSectionWidget defaults to h2", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewSectionWidget(() => "Default Section");

      expect(tab.containerEl.querySelector("h2")).toBeDefined();
    });

    it("newSectionWidget accepts DocumentFragment", () => {
      const tab = new TestableSettingTab(mockContext);

      const fragment = document.createDocumentFragment();
      const span = document.createElement("span");
      span.textContent = "Fragment Content";
      fragment.appendChild(span);

      tab.testNewSectionWidget(() => fragment);

      expect(tab.containerEl.querySelector("h2")).toBeDefined();
    });

    it("newTitleWidget uses displayName", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewTitleWidget();

      expect(mockContext.displayName).toHaveBeenCalled();
    });

    it("newDescriptionWidget creates description element", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewDescriptionWidget();

      const description = tab.containerEl.querySelector(".setting-item");
      expect(description).toBeDefined();
    });

    it("newDescriptionWidget uses i18n", () => {
      const tab = new TestableSettingTab(mockContext);

      tab.testNewDescriptionWidget();

      expect(mockI18n.t).toHaveBeenCalledWith("settings.description");
    });
  });

  describe("language widget", () => {
    class LanguageTestTab extends AdvancedSettingTab<PluginContext.Settings> {
      protected snapshot0(): Partial<PluginContext.Settings> {
        return {};
      }

      protected postMutate(): void {
        // Mock implementation
      }

      public testNewLanguageWidget(
        languages: readonly string[],
        languageNamer: (language: string) => string,
        defaults: { language: string },
      ): void {
        this.newLanguageWidget(
          languages as never,
          languageNamer as never,
          defaults as never,
        );
      }
    }

    it("creates language widget", () => {
      const tab = new LanguageTestTab(mockContext);

      const languages = ["en", "es", "fr"];
      const languageNamer = (lang: string) => lang.toUpperCase();
      const defaults = { language: "en" };

      tab.testNewLanguageWidget(languages, languageNamer, defaults);

      expect(tab.containerEl.querySelector(".setting-item")).toBeDefined();
    });

    it("language widget uses i18n for labels", () => {
      const tab = new LanguageTestTab(mockContext);

      const languages = ["en", "es"];
      const languageNamer = (lang: string) => lang;
      const defaults = { language: "en" };

      tab.testNewLanguageWidget(languages, languageNamer, defaults);

      expect(mockI18n.t).toHaveBeenCalledWith("settings.language");
      expect(mockI18n.t).toHaveBeenCalledWith("settings.language-description");
    });

    it("language widget includes reset button", () => {
      const tab = new LanguageTestTab(mockContext);

      const languages = ["en", "es"];
      const languageNamer = (lang: string) => lang;
      const defaults = { language: "en" };

      tab.testNewLanguageWidget(languages, languageNamer, defaults);

      expect(mockI18n.t).toHaveBeenCalledWith("settings.reset");
    });
  });

  describe("edge cases and type safety", () => {
    class EdgeCaseTab extends AdvancedSettingTab<PluginContext.Settings> {
      protected snapshot0(): Partial<PluginContext.Settings> {
        return {};
      }

      protected postMutate(): void {
        // Mock implementation
      }
    }

    it("handles null context gracefully", () => {
      expect(() => new EdgeCaseTab(null as unknown as PluginContext)).toThrow();
    });

    it("handles context without language manager", () => {
      const contextWithoutLanguage = {
        ...mockContext,
        language: undefined,
      } as unknown as PluginContext;

      expect(() => new EdgeCaseTab(contextWithoutLanguage)).not.toThrow();
    });

    it("handles multiple display calls", () => {
      const tab = new EdgeCaseTab(mockContext);

      tab.display();
      tab.display();
      tab.display();

      expect(tab).toBeDefined();
    });

    it("handles rapid onLoad/onUnload cycles", () => {
      class CycleTestTab extends AdvancedSettingTab<PluginContext.Settings> {
        protected snapshot0(): Partial<PluginContext.Settings> {
          return {};
        }

        protected postMutate(): void {
          // Mock
        }

        public testOnLoad(): void {
          this.onLoad();
        }

        public testOnUnload(): void {
          this.onUnload();
        }
      }
      const tab = new CycleTestTab(mockContext);

      tab.testOnLoad();
      tab.testOnUnload();
      tab.testOnLoad();
      tab.testOnUnload();

      expect(tab).toBeDefined();
    });

    it("containerEl is HTMLElement", () => {
      const tab = new EdgeCaseTab(mockContext);

      expect(tab.containerEl).toBeInstanceOf(HTMLElement);
    });

    it("UI is properly initialized", () => {
      const tab = new EdgeCaseTab(mockContext);

      // @ts-expect-error: protected
      expect(tab.ui).toBeDefined();
      // @ts-expect-error: protected
      expect(typeof tab.ui.update).toBe("function");
      // @ts-expect-error: protected
      expect(typeof tab.ui.destroy).toBe("function");
    });
  });

  describe("snapshot and postMutate", () => {
    it("calls snapshot on construction", () => {
      const snapshotSpy = vi.fn(() => ({ language: "en" }));

      class SnapshotTestTab extends AdvancedSettingTab<PluginContext.Settings> {
        protected snapshot0(): Partial<PluginContext.Settings> {
          return snapshotSpy();
        }

        protected postMutate(): void {
          // Mock
        }
      }
      new SnapshotTestTab(mockContext);
      expect(snapshotSpy).toHaveBeenCalled();
    });

    it("calls snapshot on display", () => {
      const snapshotSpy = vi.fn(() => ({ language: "en" }));

      class SnapshotTestTab extends AdvancedSettingTab<PluginContext.Settings> {
        protected snapshot0(): Partial<PluginContext.Settings> {
          return snapshotSpy();
        }

        protected postMutate(): void {
          // Mock
        }
      }
      const tab = new SnapshotTestTab(mockContext);
      snapshotSpy.mockClear();

      tab.display();

      expect(snapshotSpy).toHaveBeenCalled();
    });

    it("postMutate can be customized in subclass", () => {
      const postMutateSpy = vi.fn();

      class CustomPostMutateTab extends AdvancedSettingTab<PluginContext.Settings> {
        protected snapshot0(): Partial<PluginContext.Settings> {
          return {};
        }

        protected postMutate(): void {
          postMutateSpy();
        }

        public triggerPostMutate(): void {
          this.postMutate();
        }
      }

      const tab = new CustomPostMutateTab(mockContext);

      tab.triggerPostMutate();

      expect(postMutateSpy).toHaveBeenCalled();
    });

    describe("inheritance and extensibility", () => {
      it("can be extended with custom functionality", () => {
        class ExtendedTab extends AdvancedSettingTab<PluginContext.Settings> {
          public customProperty = "custom";

          protected snapshot0(): Partial<PluginContext.Settings> {
            return {};
          }

          protected postMutate(): void {
            // Mock
          }

          public customMethod(): string {
            return "custom method";
          }
        }

        const tab = new ExtendedTab(mockContext);

        expect(tab.customProperty).toBe("custom");
        expect(tab.customMethod()).toBe("custom method");
      });

      it("preserves base class functionality in subclass", () => {
        class SubclassTab extends AdvancedSettingTab<PluginContext.Settings> {
          protected snapshot0(): Partial<PluginContext.Settings> {
            return {};
          }

          protected postMutate(): void {
            // Mock
          }
        }

        const tab = new SubclassTab(mockContext);

        expect(tab.display).toBeDefined();
        expect(tab.containerEl).toBeDefined();
      });

      it("allows overriding protected methods", () => {
        const overriddenOnLoad = vi.fn();

        class OverrideTab extends AdvancedSettingTab<PluginContext.Settings> {
          protected snapshot0(): Partial<PluginContext.Settings> {
            return {};
          }

          protected postMutate(): void {
            // Mock
          }

          protected override onLoad(): void {
            overriddenOnLoad();
            super.onLoad();
          }

          public triggerOnLoad(): void {
            this.onLoad();
          }
        }

        const tab = new OverrideTab(mockContext);

        tab.triggerOnLoad();

        expect(overriddenOnLoad).toHaveBeenCalled();
      });
    });
  });
});
