/**
 * Comprehensive tests for src/import.ts — dynamic import utilities
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  dynamicRequire,
  dynamicRequireLazy,
  dynamicRequireSync,
  importable,
  type Bundle,
} from "../../src/import.js";

describe("import.ts — dynamic import utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("dynamicRequireSync", () => {
    it("loads module from bundle when available", () => {
      const bundle: Bundle = new Map([["test-module", () => ({ value: 42 })]]);

      const result = dynamicRequireSync<{ value: number }>(
        bundle,
        "test-module",
      );
      expect(result.value).toBe(42);
    });

    it("falls back to require when module not in bundle", () => {
      const bundle: Bundle = new Map();
      const mockRequire = vi.fn(() => ({
        loaded: true,
      })) as unknown as typeof require;

      const result = dynamicRequireSync<{ loaded: boolean }>(
        bundle,
        "external-module",
        mockRequire,
      );

      expect(mockRequire).toHaveBeenCalledWith("external-module");
      expect(result.loaded).toBe(true);
    });

    it("throws when module returns null", () => {
      const bundle: Bundle = new Map([["null-module", () => null]]);

      expect(() => {
        dynamicRequireSync(bundle, "null-module");
      }).toThrow();
    });

    it("throws when module returns undefined", () => {
      const bundle: Bundle = new Map([["undefined-module", () => undefined]]);

      expect(() => {
        dynamicRequireSync(bundle, "undefined-module");
      }).toThrow();
    });

    it("calls bundle factory each time", () => {
      const factory = vi.fn(() => ({ count: 0 }));
      const bundle: Bundle = new Map([["test", factory]]);

      dynamicRequireSync(bundle, "test");
      dynamicRequireSync(bundle, "test");

      expect(factory).toHaveBeenCalledTimes(2);
    });

    it("preserves module exports structure", () => {
      const moduleExports = {
        default: "defaultExport",
        namedExport: "namedValue",
        nested: { deep: { value: 123 } },
      };

      const bundle: Bundle = new Map([["complex-module", () => moduleExports]]);

      const result = dynamicRequireSync<typeof moduleExports>(
        bundle,
        "complex-module",
      );

      expect(result.default).toBe("defaultExport");
      expect(result.namedExport).toBe("namedValue");
      expect(result.nested.deep.value).toBe(123);
    });
  });

  describe("dynamicRequire", () => {
    it("loads module asynchronously from bundle", async () => {
      const bundle: Bundle = new Map([
        ["async-module", () => ({ async: true })],
      ]);

      const result = await dynamicRequire<{ async: boolean }>(
        bundle,
        "async-module",
      );
      expect(result.async).toBe(true);
    });

    it("returns a promise", () => {
      const bundle: Bundle = new Map([["test", () => ({ value: 1 })]]);

      const result = dynamicRequire(bundle, "test");
      expect(result).toBeInstanceOf(Promise);
    });

    it("resolves with module exports", async () => {
      const exports = { name: "test", version: "1.0" };
      const bundle: Bundle = new Map([["module", () => exports]]);

      await expect(dynamicRequire(bundle, "module")).resolves.toEqual(exports);
    });

    it("rejects when module is nil", async () => {
      const bundle: Bundle = new Map([["nil-module", () => null]]);

      await expect(dynamicRequire(bundle, "nil-module")).rejects.toThrow();
    });

    it("works with custom require function", async () => {
      const bundle: Bundle = new Map();
      const customRequire = vi.fn(() => ({
        custom: true,
      })) as unknown as typeof require;

      const result = await dynamicRequire<{ custom: boolean }>(
        bundle,
        "custom-module",
        customRequire,
      );

      expect(customRequire).toHaveBeenCalledWith("custom-module");
      expect(result.custom).toBe(true);
    });
  });

  describe("dynamicRequireLazy", () => {
    it("returns a proxy that loads module lazily", () => {
      const factory = vi.fn(() => ({ value: 42, method: () => "result" }));
      const bundle: Bundle = new Map([["lazy-module", factory]]);

      const lazyModule = dynamicRequireLazy<{
        value: number;
        method: () => string;
      }>(bundle, "lazy-module");

      // Module should not be loaded yet
      expect(factory).not.toHaveBeenCalled();

      // Access property triggers load
      expect(lazyModule.value).toBe(42);
      expect(factory).toHaveBeenCalledTimes(1);

      // Subsequent access should not reload
      expect(lazyModule.value).toBe(42);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("lazy loads methods", () => {
      const factory = vi.fn(() => ({
        greet: (name: string) => `Hello, ${name}!`,
      }));
      const bundle: Bundle = new Map([["greeter", factory]]);

      const lazyModule = dynamicRequireLazy<{
        greet: (name: string) => string;
      }>(bundle, "greeter");

      expect(factory).not.toHaveBeenCalled();

      const result = lazyModule.greet("World");
      expect(result).toBe("Hello, World!");
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("caches the loaded module", () => {
      const factory = vi.fn(() => ({ counter: 0 }));
      const bundle: Bundle = new Map([["counter", factory]]);

      const lazyModule = dynamicRequireLazy<{ counter: number }>(
        bundle,
        "counter",
      );

      // Accessing the property multiple times should only call factory once
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      lazyModule.counter;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      lazyModule.counter;
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      lazyModule.counter;

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("handles nested property access", () => {
      const factory = vi.fn(() => ({
        nested: { deep: { value: "found" } },
      }));
      const bundle: Bundle = new Map([["nested-module", factory]]);

      const lazyModule = dynamicRequireLazy<{
        nested: { deep: { value: string } };
      }>(bundle, "nested-module");

      expect(factory).not.toHaveBeenCalled();
      expect(lazyModule.nested.deep.value).toBe("found");
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe("importable", () => {
    it("returns true when module can be loaded", () => {
      const bundle: Bundle = new Map([
        ["available-module", () => ({ exists: true })],
      ]);

      expect(importable(bundle, "available-module")).toBe(true);
    });

    it("returns false when module is nil", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const bundle: Bundle = new Map([["nil-module", () => null]]);

      const result = importable(bundle, "nil-module");

      expect(result).toBe(false);
      expect(debugSpy).toHaveBeenCalled();
      const err = debugSpy.mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("nil-module");

      debugSpy.mockRestore();
    });

    it("returns false when module throws", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const bundle: Bundle = new Map([
        [
          "error-module",
          () => {
            throw new Error("Module load error");
          },
        ],
      ]);

      const result = importable(bundle, "error-module");

      expect(result).toBe(false);
      expect(debugSpy).toHaveBeenCalled();
      const err = debugSpy.mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Module load error");

      debugSpy.mockRestore();
    });

    it("returns false when require fails", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const bundle: Bundle = new Map();
      const failingRequire = vi.fn(() => {
        throw new Error("Module not found");
      }) as unknown as typeof require;

      const result = importable(bundle, "missing-module", failingRequire);

      expect(result).toBe(false);
      expect(debugSpy).toHaveBeenCalled();
      const err = debugSpy.mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Module not found");

      debugSpy.mockRestore();
    });

    it("does not throw on errors", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const bundle: Bundle = new Map([
        [
          "throw-module",
          () => {
            throw new Error("Critical error");
          },
        ],
      ]);

      expect(() => importable(bundle, "throw-module")).not.toThrow();
      expect(debugSpy).toHaveBeenCalled();
      const err = debugSpy.mock.calls[0]?.[0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Critical error");

      debugSpy.mockRestore();
    });

    it("checks require fallback when not in bundle", () => {
      const bundle: Bundle = new Map();
      const workingRequire = vi.fn(() => ({
        works: true,
      })) as unknown as typeof require;

      expect(importable(bundle, "external", workingRequire)).toBe(true);
      expect(workingRequire).toHaveBeenCalledWith("external");
    });
  });

  describe("Bundle type", () => {
    it("Bundle is a Map with correct types", () => {
      const bundle: Bundle = new Map();
      bundle.set("module1", () => ({ value: 1 }));
      bundle.set("module2", () => ({ value: 2 }));

      expect(bundle.size).toBe(2);
      expect(bundle.has("module1")).toBe(true);
      expect(bundle.get("module1")).toBeInstanceOf(Function);
    });

    it("Bundle factories return unknown", () => {
      const bundle: Bundle = new Map<string, () => unknown>([
        ["any-type", () => "string"],
        ["numbers", () => 42],
        ["objects", () => ({ key: "value" })],
      ]);

      expect(typeof dynamicRequireSync(bundle, "any-type")).toBe("string");
      expect(typeof dynamicRequireSync(bundle, "numbers")).toBe("number");
      expect(typeof dynamicRequireSync(bundle, "objects")).toBe("object");
    });
  });

  describe("Error handling", () => {
    it("dynamicRequireSync throws with module name", () => {
      const bundle: Bundle = new Map([["bad-module", () => null]]);

      expect(() => {
        dynamicRequireSync(bundle, "bad-module");
      }).toThrow("bad-module");
    });

    it("dynamicRequire rejects with module name", async () => {
      const bundle: Bundle = new Map([["bad-async", () => undefined]]);

      await expect(dynamicRequire(bundle, "bad-async")).rejects.toThrow(
        "bad-async",
      );
    });

    it("importable suppresses errors and logs to console", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const bundle: Bundle = new Map([
        [
          "error-module",
          () => {
            throw new Error("Test error");
          },
        ],
      ]);

      const result = importable(bundle, "error-module");

      expect(result).toBe(false);
      expect(debugSpy).toHaveBeenCalled();
    });
  });
});
