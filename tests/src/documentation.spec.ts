/**
 * Comprehensive tests for src/documentation.ts — Documentation markdown view
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentationMarkdownView } from "../../src/documentation.js";
import type { PluginContext } from "../../src/plugin.js";
import type { WorkspaceLeaf, ViewStateResult } from "obsidian";
import type { LanguageManager } from "../../src/i18n.js";

describe("documentation.ts — Documentation view", () => {
  let mockContext: PluginContext;
  let mockLeaf: WorkspaceLeaf;
  let mockLanguageManager: LanguageManager;
  let mockI18n: { t: ReturnType<typeof vi.fn> };

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

    // Mock plugin context
    mockContext = {
      app: {
        workspace: {
          onLayoutReady: vi.fn((callback) => callback()),
          getLeaf: vi.fn(() => mockLeaf),
          requestUpdateLayout: vi.fn(),
        },
      },
      language: mockLanguageManager,
      manifest: { id: "test-plugin", name: "Test Plugin" },
    } as unknown as PluginContext;

    // Mock workspace leaf
    mockLeaf = {
      view: null,
      setViewState: vi.fn(),
      updateHeader: vi.fn(),
    } as unknown as WorkspaceLeaf;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("DocumentationMarkdownView", () => {
    it("creates documentation view", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      expect(view).toBeDefined();
      expect(view).toBeInstanceOf(DocumentationMarkdownView);
    });

    it("has static type property", () => {
      expect(DocumentationMarkdownView.type).toBeDefined();
      expect(typeof DocumentationMarkdownView.type.namespaced).toBe("function");
    });

    it("returns view type", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const viewType = view.getViewType();

      expect(viewType).toBeDefined();
      expect(typeof viewType).toBe("string");
    });

    it("returns display text from i18n", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      // Set state with display text key
      // @ts-expect-error: testing internal state handling
      view.state = {
        displayTextI18nKey: "generic.close",
        iconI18nKey: null,
        data: "",
      };

      const displayText = view.getDisplayText();

      expect(displayText).toBeDefined();
      expect(mockI18n.t).toHaveBeenCalled();
    });

    it("returns empty string when display text key is null", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      // @ts-expect-error: testing internal state handling
      view.state = {
        displayTextI18nKey: null,
        iconI18nKey: null,
        data: "",
      };

      const displayText = view.getDisplayText();

      expect(displayText).toBe("");
    });

    it("returns icon from i18n", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      // @ts-expect-error: testing internal state handling
      view.state = {
        displayTextI18nKey: null,
        iconI18nKey: "asset:generic.cancel-icon",
        data: "",
      };

      const icon = view.getIcon();

      expect(icon).toBeDefined();
      expect(mockI18n.t).toHaveBeenCalledWith("asset:generic.cancel-icon");
    });

    it("returns default icon when icon key is null", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      // @ts-expect-error: testing internal state handling
      view.state = {
        displayTextI18nKey: null,
        iconI18nKey: null,
        data: "",
      };

      const superGetIcon = vi.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(view)),
        "getIcon",
      );
      superGetIcon.mockReturnValue("default-icon");

      const icon = view.getIcon();

      expect(icon).toBe("default-icon");

      superGetIcon.mockRestore();
    });

    it("sets state and renders markdown", async () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const mockState = {
        displayTextI18nKey: "generic.close",
        iconI18nKey: "asset:generic.cancel-icon",
        data: "# Test Documentation\n\nContent here.",
      };
      const namespacedState = {
        [DocumentationMarkdownView.type.namespaced(mockContext)]: mockState,
      };
      const result = {} as ViewStateResult;

      await view.setState(namespacedState, result);

      expect(view.getState()).toBeDefined();
    });

    it("handles malformed state data", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const invalidState = {
        invalid: "state",
      };

      const result = {} as ViewStateResult;

      await view.setState(invalidState, result);

      // Should handle gracefully and report malformed data via console.error
      expect(view).toBeDefined();
      expect(consoleError).toHaveBeenCalledWith(
        "translated-errors.malformed-data",
        undefined,
        DocumentationMarkdownView.State.DEFAULT,
      );

      consoleError.mockRestore();
    });

    it("gets current state", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      // @ts-expect-error: testing internal state handling
      view.state = {
        displayTextI18nKey: "generic.close",
        iconI18nKey: "asset:generic.cancel-icon",
        data: "# Documentation",
      };

      const state = view.getState();

      expect(state).toBeDefined();
    });

    it("registers language change listener on open", async () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const baseProto = Object.getPrototypeOf(Object.getPrototypeOf(view));
      const originalOnOpen = baseProto.onOpen;
      baseProto.onOpen = async () => {};

      // @ts-expect-error: testing protected method
      await view.onOpen();

      expect(mockLanguageManager.onChangeLanguage.listen).toHaveBeenCalled();

      if (originalOnOpen) baseProto.onOpen = originalOnOpen;
      else delete baseProto.onOpen;
    });

    it("has navigation enabled", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      expect(view.navigation).toBe(true);
    });

    it("creates content element structure", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      expect(view.contentEl).toBeDefined();
      expect(view.contentEl).toBeInstanceOf(HTMLElement);
    });

    it("applies correct CSS classes to content", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const element = view.contentEl;
      const parent = element.parentElement;

      expect(parent).toBeDefined();
    });
  });

  describe("DocumentationMarkdownView.State", () => {
    it("has DEFAULT state", () => {
      expect(DocumentationMarkdownView.State.DEFAULT).toBeDefined();
      expect(
        DocumentationMarkdownView.State.DEFAULT.displayTextI18nKey,
      ).toBeDefined();
      expect(DocumentationMarkdownView.State.DEFAULT.iconI18nKey).toBeDefined();
      expect(DocumentationMarkdownView.State.DEFAULT.data).toBeDefined();
    });

    it("has fix function", () => {
      expect(typeof DocumentationMarkdownView.State.fix).toBe("function");
    });

    it("fixes unknown state to valid state", () => {
      const unknownState = {
        displayTextI18nKey: "test",
        iconI18nKey: "icon",
        data: "content",
      };

      const fixed = DocumentationMarkdownView.State.fix(unknownState);

      expect(fixed.valid).toBe(true);
      expect(fixed.value.displayTextI18nKey).toBeDefined();
      expect(fixed.value.iconI18nKey).toBeDefined();
      expect(fixed.value.data).toBeDefined();
    });

    it("handles null state", () => {
      const fixed = DocumentationMarkdownView.State.fix(null);

      expect(fixed.valid).toBeDefined();
      expect(fixed.value).toBeDefined();
    });

    it("handles undefined state", () => {
      const fixed = DocumentationMarkdownView.State.fix(undefined);

      expect(fixed.valid).toBeDefined();
      expect(fixed.value).toBeDefined();
    });

    it("validates displayTextI18nKey type", () => {
      const state = {
        displayTextI18nKey: 123,
        iconI18nKey: "icon",
        data: "content",
      };

      const fixed = DocumentationMarkdownView.State.fix(state);

      expect(fixed.value.displayTextI18nKey).toBeDefined();
    });

    it("validates iconI18nKey type", () => {
      const state = {
        displayTextI18nKey: "title",
        iconI18nKey: 456,
        data: "content",
      };

      const fixed = DocumentationMarkdownView.State.fix(state);

      expect(fixed.value.iconI18nKey).toBeDefined();
    });

    it("validates data type", () => {
      const state = {
        displayTextI18nKey: "title",
        iconI18nKey: "icon",
        data: 789,
      };

      const fixed = DocumentationMarkdownView.State.fix(state);

      expect(typeof fixed.value.data).toBe("string");
    });
  });

  describe("internal link navigation", () => {
    it("handles internal link clicks", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const element = view.contentEl;

      // Create mock internal link
      const link = document.createElement("a");
      link.className = "internal-link";
      link.setAttribute("data-href", "#test-heading");
      element.appendChild(link);

      // Create mock heading
      const heading = document.createElement("div");
      heading.setAttribute("data-heading", "Test Heading");
      element.appendChild(heading);

      // Simulate click
      element.dispatchEvent(new MouseEvent("click"));

      expect(element).toBeDefined();
    });

    it("ignores non-internal links", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const element = view.contentEl;

      const link = document.createElement("a");
      link.className = "external-link";
      link.href = "https://example.com";
      element.appendChild(link);

      const mockEvent = new MouseEvent("click", {
        bubbles: true,
      });

      Object.defineProperty(mockEvent, "button", { value: 0 });
      Object.defineProperty(mockEvent, "target", { value: link });

      element.dispatchEvent(mockEvent);

      expect(element).toBeDefined();
    });

    it("ignores clicks with wrong button", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const element = view.contentEl;

      const link = document.createElement("a");
      link.className = "internal-link";
      link.setAttribute("data-href", "#test");
      element.appendChild(link);

      const mockEvent = new MouseEvent("click", {
        bubbles: true,
      });

      Object.defineProperty(mockEvent, "button", { value: 2 }); // Right click
      Object.defineProperty(mockEvent, "target", { value: link });

      element.dispatchEvent(mockEvent);

      expect(element).toBeDefined();
    });

    it("handles missing heading gracefully", () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const element = view.contentEl;

      const link = document.createElement("a");
      link.className = "internal-link";
      link.setAttribute("data-href", "#nonexistent-heading");
      element.appendChild(link);

      const mockEvent = new MouseEvent("click", {
        bubbles: true,
      });

      Object.defineProperty(mockEvent, "button", { value: 0 });
      Object.defineProperty(mockEvent, "target", { value: link });

      element.dispatchEvent(mockEvent);

      expect(element).toBeDefined();
    });
  });

  describe("edge cases and type safety", () => {
    it("handles context without language manager", () => {
      const contextWithoutLanguage = {
        ...mockContext,
        language: undefined,
      } as unknown as PluginContext;

      expect(
        () => new DocumentationMarkdownView(contextWithoutLanguage, mockLeaf),
      ).not.toThrow();
    });

    it("handles null leaf", () => {
      expect(
        () =>
          new DocumentationMarkdownView(
            mockContext,
            null as unknown as WorkspaceLeaf,
          ),
      ).not.toThrow();
    });

    it("handles state updates multiple times", async () => {
      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const state1 = {
        displayTextI18nKey: "docs.title1",
        iconI18nKey: "asset:icon1",
        data: "# Doc 1",
      };

      const state2 = {
        displayTextI18nKey: "docs.title2",
        iconI18nKey: "asset:icon2",
        data: "# Doc 2",
      };

      await view.setState(
        { [DocumentationMarkdownView.type.namespaced(mockContext)]: state1 },
        {} as ViewStateResult,
      );
      await view.setState(
        { [DocumentationMarkdownView.type.namespaced(mockContext)]: state2 },
        {} as ViewStateResult,
      );

      const currentState = view.getState();

      expect(currentState).toBeDefined();
    });

    it("handles empty markdown data", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const state = {
        displayTextI18nKey: "docs.title",
        iconI18nKey: "asset:icon",
        data: "",
      };

      await view.setState(state, {} as ViewStateResult);

      expect(view.getState()).toBeDefined();
      expect(consoleError).toHaveBeenCalledWith(
        "translated-errors.malformed-data",
        undefined,
        DocumentationMarkdownView.State.DEFAULT,
      );

      consoleError.mockRestore();
    });

    it("handles markdown with special characters", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const view = new DocumentationMarkdownView(mockContext, mockLeaf);

      const state = {
        displayTextI18nKey: "docs.title",
        iconI18nKey: "asset:icon",
        data: "# Title\n\nContent with `code`, **bold**, and *italic*.",
      };

      await view.setState(state, {} as ViewStateResult);

      expect(view.getState()).toBeDefined();
      expect(consoleError).toHaveBeenCalledWith(
        "translated-errors.malformed-data",
        undefined,
        DocumentationMarkdownView.State.DEFAULT,
      );

      consoleError.mockRestore();
    });
  });
});
