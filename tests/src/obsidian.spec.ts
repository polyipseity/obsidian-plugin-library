/**
 * Comprehensive tests for src/obsidian.ts — Obsidian API utilities and components
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LambdaComponent,
  ResourceComponent,
  UpdatableUI,
  statusUI,
  cleanFrontmatterCache,
  printError,
  printMalformedData,
} from "../../src/obsidian.js";
import { toJSONOrString } from "../../src/util.js";
import type { FrontMatterCache, Notice } from "obsidian";
import type { PluginContext } from "../../src/plugin.js";

describe("obsidian.ts — Obsidian API utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("LambdaComponent", () => {
    it("creates component with default callbacks", () => {
      const component = new LambdaComponent();

      expect(component).toBeDefined();
      expect(component).toBeInstanceOf(LambdaComponent);
    });

    it("calls onLoad callback when component loads", () => {
      const onLoad = vi.fn();
      const component = new LambdaComponent(onLoad);

      component.load();

      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledWith();
    });

    it("calls onUnload callback when component unloads", () => {
      const onUnload = vi.fn();
      const component = new LambdaComponent(undefined, onUnload);

      component.load();
      component.unload();

      expect(onUnload).toHaveBeenCalledTimes(1);
      expect(onUnload).toHaveBeenCalledWith();
    });

    it("calls both callbacks in lifecycle", () => {
      const onLoad = vi.fn();
      const onUnload = vi.fn();
      const component = new LambdaComponent(onLoad, onUnload);

      component.load();
      expect(onLoad).toHaveBeenCalledTimes(1);
      expect(onUnload).not.toHaveBeenCalled();

      component.unload();
      expect(onUnload).toHaveBeenCalledTimes(1);
    });

    it("allows multiple load/unload cycles", () => {
      const onLoad = vi.fn();
      const onUnload = vi.fn();
      const component = new LambdaComponent(onLoad, onUnload);

      component.load();
      component.unload();
      component.load();
      component.unload();

      expect(onLoad).toHaveBeenCalledTimes(2);
      expect(onUnload).toHaveBeenCalledTimes(2);
    });

    it("handles errors in onLoad callback", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });
      const onLoad = vi.fn(() => {
        throw new Error("Load error");
      });
      const component = new LambdaComponent(onLoad);

      expect(() => component.load()).toThrow("Load error");

      consoleError.mockRestore();
    });

    it("handles errors in onUnload callback", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });
      const onUnload = vi.fn(() => {
        throw new Error("Unload error");
      });
      const component = new LambdaComponent(undefined, onUnload);

      component.load();
      expect(() => component.unload()).toThrow("Unload error");

      consoleError.mockRestore();
    });

    it("uses 'this' context in callbacks", () => {
      let capturedThis: unknown;
      const onLoad = function fn(this: LambdaComponent): void {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        capturedThis = this;
      };
      const component = new LambdaComponent(onLoad);

      component.load();

      expect(capturedThis).toBe(component);
    });

    it("handles undefined callbacks gracefully", () => {
      const component = new LambdaComponent(undefined, undefined);

      expect(() => {
        component.load();
        component.unload();
      }).not.toThrow();
    });
  });

  describe("ResourceComponent", () => {
    class TestResourceComponent extends ResourceComponent<string> {
      protected override load0(): string {
        return "test-value";
      }
    }

    class AsyncResourceComponent extends ResourceComponent<number> {
      protected override async load0(): Promise<number> {
        return Promise.resolve(42);
      }
    }

    class ErrorResourceComponent extends ResourceComponent<string> {
      protected override load0(): string {
        throw new Error("Load failed");
      }
    }

    it("loads resource synchronously", async () => {
      const component = new TestResourceComponent();

      component.load();
      await component.onLoaded;

      expect(component.value).toBe("test-value");
    });

    it("loads resource asynchronously", async () => {
      const component = new AsyncResourceComponent();

      component.load();
      const value = await component.onLoaded;

      expect(value).toBe(42);
      expect(component.value).toBe(42);
    });

    it("throws when accessing value before load", () => {
      const component = new TestResourceComponent();

      expect(() => component.value).toThrow();
    });

    it("provides onLoaded promise", async () => {
      const component = new TestResourceComponent();

      component.load();
      const loadedPromise = component.onLoaded;

      expect(loadedPromise).toBeInstanceOf(Promise);
      await expect(loadedPromise).resolves.toBe("test-value");
    });

    it("handles load errors", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });
      const component = new ErrorResourceComponent();

      component.load();

      // The error is caught and logged, not re-thrown
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it("allows unload and reload", async () => {
      const component = new TestResourceComponent();

      component.load();
      await component.onLoaded;
      expect(component.value).toBe("test-value");

      component.unload();
      expect(() => component.value).toThrow();

      component.load();
      await component.onLoaded;
      expect(component.value).toBe("test-value");
    });

    it("resets value on unload", async () => {
      const component = new TestResourceComponent();

      component.load();
      await component.onLoaded;
      expect(component.value).toBe("test-value");

      component.unload();

      expect(() => component.value).toThrow();
    });

    it("allows setting value after load", async () => {
      class MutableResourceComponent extends ResourceComponent<string> {
        protected override load0(): string {
          return "initial";
        }

        public setValue(newValue: string): void {
          this.value = newValue;
        }
      }

      const component = new MutableResourceComponent();

      component.load();
      await component.onLoaded;
      expect(component.value).toBe("initial");

      component.setValue("updated");
      expect(component.value).toBe("updated");
    });

    it("throws when setting value before load", () => {
      class MutableResourceComponent extends ResourceComponent<string> {
        protected override load0(): string {
          return "initial";
        }

        public setValue(newValue: string): void {
          this.value = newValue;
        }
      }

      const component = new MutableResourceComponent();

      expect(() => component.setValue("value")).toThrow();
    });
  });

  describe("UpdatableUI", () => {
    it("creates updatable UI instance", () => {
      const ui = new UpdatableUI();

      expect(ui).toBeDefined();
      expect(ui).toBeInstanceOf(UpdatableUI);
    });

    it("creates and configures UI element", () => {
      const ui = new UpdatableUI();
      const create = vi.fn(() => ({ value: 0 }));
      const configure = vi.fn();

      ui.new(create, configure, null);

      expect(create).toHaveBeenCalledTimes(1);
      expect(configure).toHaveBeenCalledTimes(1);
      expect(configure).toHaveBeenCalledWith({ value: 0 });
    });

    it("creates UI element without configure", () => {
      const ui = new UpdatableUI();
      const create = vi.fn(() => ({ value: 1 }));

      ui.new(create, null, null);

      expect(create).toHaveBeenCalledTimes(1);
    });

    it("creates UI element with destroy callback", () => {
      const ui = new UpdatableUI();
      const create = vi.fn(() => ({ value: 2 }));
      const destroy = vi.fn();

      ui.new(create, null, destroy);

      expect(create).toHaveBeenCalledTimes(1);
      expect(destroy).not.toHaveBeenCalled();
    });

    it("updates UI when update is called", () => {
      const ui = new UpdatableUI();
      const configure = vi.fn();
      const create = () => ({ value: 3 });

      ui.new(create, configure, null);
      expect(configure).toHaveBeenCalledTimes(1);

      ui.update();
      expect(configure).toHaveBeenCalledTimes(2);
    });

    it("finalizes UI when destroy is called", () => {
      const ui = new UpdatableUI();
      const destroy = vi.fn();
      const create = () => ({ value: 4 });

      ui.new(create, null, destroy);
      expect(destroy).not.toHaveBeenCalled();

      ui.destroy();
      expect(destroy).toHaveBeenCalledTimes(1);
      expect(destroy).toHaveBeenCalledWith({ value: 4 });
    });

    it("supports multiple UI elements", () => {
      const ui = new UpdatableUI();
      const configure1 = vi.fn();
      const configure2 = vi.fn();

      ui.new(() => ({ id: 1 }), configure1, null);
      ui.new(() => ({ id: 2 }), configure2, null);

      expect(configure1).toHaveBeenCalledTimes(1);
      expect(configure2).toHaveBeenCalledTimes(1);

      ui.update();

      expect(configure1).toHaveBeenCalledTimes(2);
      expect(configure2).toHaveBeenCalledTimes(2);
    });

    it("destroys all elements when destroy is called", () => {
      const ui = new UpdatableUI();
      const destroy1 = vi.fn();
      const destroy2 = vi.fn();

      ui.new(() => ({ id: 1 }), null, destroy1);
      ui.new(() => ({ id: 2 }), null, destroy2);

      ui.destroy();

      expect(destroy1).toHaveBeenCalledTimes(1);
      expect(destroy2).toHaveBeenCalledTimes(1);
    });

    it("handles errors in create gracefully", () => {
      const ui = new UpdatableUI();
      const create = (): never => {
        throw new Error("Create error");
      };

      expect(() => ui.new(create, null, null)).toThrow("Create error");
    });

    it("handles errors in configure gracefully", () => {
      const ui = new UpdatableUI();
      const configure = (): never => {
        throw new Error("Configure error");
      };
      const destroy = vi.fn();

      expect(() => ui.new(() => ({}), configure, destroy)).toThrow(
        "Configure error",
      );

      // Destroy should be called on error
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it("returns this for chaining", () => {
      const ui = new UpdatableUI();

      const result = ui.new(() => ({}), null, null);

      expect(result).toBe(ui);
    });
  });

  describe("statusUI", () => {
    it("creates status UI wrapper", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");

      const status = statusUI(mockUI, element);

      expect(status).toBeDefined();
      expect(typeof status.report).toBe("function");
    });

    it("forwards report calls to element textContent", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");

      const status = statusUI(mockUI, element);
      status.report("test status");

      expect(element.textContent).toBe(toJSONOrString("test status"));
    });

    it("handles undefined status", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");

      const status = statusUI(mockUI, element);
      status.report();

      expect(element.textContent).toBe("");
    });

    it("clears element textContent on destroy", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");
      element.textContent = "initial";

      statusUI(mockUI, element);
      mockUI.destroy();

      expect(element.textContent).toBe("");
    });

    it("handles multiple status updates", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");

      const status = statusUI(mockUI, element);

      status.report("status 1");
      expect(element.textContent).toBe(toJSONOrString("status 1"));

      status.report("status 2");
      expect(element.textContent).toBe(toJSONOrString("status 2"));

      status.report();
      expect(element.textContent).toBe("");
    });

    it("handles object status", () => {
      const mockUI = new UpdatableUI();
      const element = document.createElement("div");

      const status = statusUI(mockUI, element);
      status.report({ key: "value" });

      expect(element.textContent).toBe(toJSONOrString({ key: "value" }));
    });
  });

  describe("cleanFrontmatterCache", () => {
    it("returns empty frozen object when cache is undefined", () => {
      const result = cleanFrontmatterCache(undefined);

      expect(result).toEqual({});
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("returns empty frozen object when cache is null", () => {
      const result = cleanFrontmatterCache(null as unknown as FrontMatterCache);

      expect(result).toEqual({});
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("removes top-level 'position' key and preserves other properties", () => {
      const cache: FrontMatterCache = {
        position: { start: 1, end: 2 },
        title: "My Title",
        tags: ["a", "b"],
        nested: { position: 99, inner: { x: 1 } },
      };

      const cleaned = cleanFrontmatterCache(cache);

      expect(cleaned).not.toHaveProperty("position");
      expect(cleaned).toEqual({
        title: "My Title",
        tags: ["a", "b"],
        nested: { position: 99, inner: { x: 1 } },
      });

      expect(Object.isFrozen(cleaned)).toBe(true);
      expect(Object.isFrozen(cleaned["nested"])).toBe(true);
    });

    it("does not mutate the input and returns a cloned object", () => {
      const cache: FrontMatterCache = { position: { start: 0 }, name: "A" };
      const cleaned = cleanFrontmatterCache(cache);

      expect(cleaned).not.toBe(cache);

      // mutating original should not affect cleaned result
      cache.name = "B";
      expect(cleaned).toHaveProperty("name", "A");
    });

    it("preserves nested 'position' properties (only removes top-level)", () => {
      const cache: FrontMatterCache = {
        meta: { position: 3 },
        position: { start: 0 },
      };
      const cleaned = cleanFrontmatterCache(cache);

      expect(cleaned).toHaveProperty("meta.position", 3);
      expect(cleaned).not.toHaveProperty("position");
    });

    it("returns a deeply frozen object that resists mutation", () => {
      const cache: FrontMatterCache = { a: { b: 2 } };
      const cleaned = cleanFrontmatterCache(cache);

      expect(Object.isFrozen(cleaned)).toBe(true);
      expect(Object.isFrozen(cleaned["a"])).toBe(true);

      // deep equality ensures nested value unchanged
      expect(cleaned).toEqual({ a: { b: 2 } });
    });
  });

  describe("printError", () => {
    it("prints error with context", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const ob = await import("../../src/obsidian.js");
      const util = await import("../../src/util.js");
      const notice2Spy = vi.spyOn(ob, "notice2").mockImplementation(
        () =>
          ({
            noticeEl: document.createElement("div"),
            setMessage: () => {},
            hide: () => {},
          }) as unknown as Notice,
      );
      const activeSelfSpy = vi
        .spyOn(util, "activeSelf")
        .mockImplementation(() => window);

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        settings: { value: { errorNoticeTimeout: 0 } },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      const error = new Error("Test error");

      // correct argument order: (error, message, context)
      printError(error, () => "operation failed", mockContext);

      expect(consoleError).toHaveBeenCalled();

      notice2Spy.mockRestore();
      activeSelfSpy.mockRestore();
      consoleError.mockRestore();
    });

    it("handles string errors", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const ob = await import("../../src/obsidian.js");
      const util = await import("../../src/util.js");
      const notice2Spy = vi.spyOn(ob, "notice2").mockImplementation(
        () =>
          ({
            noticeEl: document.createElement("div"),
            setMessage: () => {},
            hide: () => {},
          }) as unknown as Notice,
      );
      const activeSelfSpy = vi
        .spyOn(util, "activeSelf")
        .mockImplementation(() => window);

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        settings: { value: { errorNoticeTimeout: 0 } },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      // @ts-expect-error intentionally passing a non-Error value
      printError("string error", () => "operation", mockContext);

      expect(consoleError).toHaveBeenCalled();

      notice2Spy.mockRestore();
      activeSelfSpy.mockRestore();
      consoleError.mockRestore();
    });

    it("handles unknown error types", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const ob = await import("../../src/obsidian.js");
      const util = await import("../../src/util.js");
      const notice2Spy = vi.spyOn(ob, "notice2").mockImplementation(
        () =>
          ({
            noticeEl: document.createElement("div"),
            setMessage: () => {},
            hide: () => {},
          }) as unknown as Notice,
      );
      const activeSelfSpy = vi
        .spyOn(util, "activeSelf")
        .mockImplementation(() => window);

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        settings: { value: { errorNoticeTimeout: 0 } },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      // @ts-expect-error intentionally passing unknown type as Error
      printError({ custom: "error" }, () => "operation", mockContext);

      expect(consoleError).toHaveBeenCalled();

      notice2Spy.mockRestore();
      activeSelfSpy.mockRestore();
      consoleError.mockRestore();
    });
  });

  describe("printMalformedData", () => {
    it("prints malformed data warning", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      printMalformedData(mockContext, { invalid: "data" }, { valid: "data" });

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("malformed-data"),
        { invalid: "data" },
        { valid: "data" },
      );

      consoleError.mockRestore();
    });

    it("handles undefined data values", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      printMalformedData(mockContext, undefined, { default: "config" });

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it("handles null data values", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock
      });

      const mockContext = {
        manifest: { id: "test-plugin", name: "Test Plugin" },
        language: {
          value: { t: vi.fn((k: string) => `translated-${k}`) },
          onChangeLanguage: { listen: vi.fn(() => vi.fn()) },
          language: "en",
          onLoaded: Promise.resolve(),
        },
      } as unknown as PluginContext;

      printMalformedData(mockContext, null, { default: "state" });

      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe("edge cases and type safety", () => {
    it("handles ResourceComponent with undefined return type", () => {
      class UndefinedResourceComponent extends ResourceComponent<undefined> {
        protected override load0(): undefined {
          return undefined;
        }
      }

      const component = new UndefinedResourceComponent();

      expect(() => {
        component.load();
      }).not.toThrow();
    });

    it("handles ResourceComponent with null return type", async () => {
      class NullResourceComponent extends ResourceComponent<null> {
        protected override load0(): null {
          return null;
        }
      }

      const component = new NullResourceComponent();
      component.load();
      await component.onLoaded;

      expect(component.value).toBeNull();
    });

    it("handles UpdatableUI with async configure", () => {
      const ui = new UpdatableUI();
      const configure = vi.fn(async () => {
        await Promise.resolve();
      });

      ui.new(() => ({}), configure as never, null);

      expect(configure).toHaveBeenCalled();
    });

    it("handles LambdaComponent with async callbacks", async () => {
      let resolved = false;
      const onLoad = async (): Promise<void> => {
        await Promise.resolve();
        resolved = true;
      };

      const component = new LambdaComponent(onLoad as never);

      component.load();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(resolved).toBe(true);
    });
  });
});
