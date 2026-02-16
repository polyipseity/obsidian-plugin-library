/**
 * Comprehensive tests for src/private.ts — private API access utilities
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  revealPrivate,
  revealPrivateAsync,
  type HasPrivate,
  type PrivateKeys,
} from "../../src/private.js";
import type { PluginContext } from "../../src/plugin.js";

describe("private.ts — private API access", () => {
  // Create a mock plugin context
  const createMockContext = (): PluginContext => {
    // keep this lightweight for tests and assert to PluginContext to avoid a huge literal
    return {
      language: { value: { t: (key: string) => `translated:${key}` } },
    } as unknown as PluginContext;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test helper: construct a value that satisfies the library's internal `HasPrivate` type.
  // Centralises the unavoidable assertion so individual tests remain readable.
  function makeHasPrivate<const T extends object>(value: T): T & HasPrivate {
    return value as unknown as T & HasPrivate;
  }

  describe("revealPrivate", () => {
    it("executes function with revealed private properties", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ public: "visible", private: "hidden" });

      const result = revealPrivate(
        context,
        [obj],
        (revealed) => {
          return revealed.public;
        },
        () => "fallback",
      );

      expect(result).toBe("visible");
    });

    it("returns result from function execution", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ value: 42 });

      const result = revealPrivate(
        context,
        [obj],
        (revealed) => revealed.value * 2,
        () => 0,
      );

      expect(result).toBe(84);
    });

    it("calls fallback on error", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = revealPrivate(
        context,
        [obj],
        () => {
          throw new Error("Test error");
        },
        (error) => {
          expect(error).toBeInstanceOf(Error);
          return "fallback-value";
        },
      );

      expect(result).toBe("fallback-value");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it("logs warning when fallback is used", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      revealPrivate(
        context,
        [obj],
        () => {
          throw new Error("API changed");
        },
        () => null,
      );

      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("handles multiple arguments", () => {
      const context = createMockContext();
      const obj1 = makeHasPrivate({ a: 1 });
      const obj2 = makeHasPrivate({ b: 2 });

      const result = revealPrivate(
        context,
        [obj1, obj2],
        (r1, r2) => r1.a + r2.b,
        () => 0,
      );

      expect(result).toBe(3);
    });

    it("preserves return type", () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ data: "test" });

      const stringResult: string = revealPrivate(
        context,
        [obj],
        (revealed) => revealed.data,
        () => "fallback",
      );

      expect(typeof stringResult).toBe("string");

      const numberResult: number = revealPrivate(
        context,
        [obj],
        () => 42,
        () => 0,
      );

      expect(typeof numberResult).toBe("number");
    });

    it("does not call fallback when function succeeds", () => {
      const context = createMockContext();
      const fallback = vi.fn(() => "fallback");
      const obj = makeHasPrivate({});

      revealPrivate(context, [obj], () => "success", fallback);

      expect(fallback).not.toHaveBeenCalled();
    });

    it("handles empty args array", () => {
      const context = createMockContext();

      const result = revealPrivate(
        context,
        [],
        () => "no-args",
        () => "fallback",
      );

      expect(result).toBe("no-args");
    });

    it("provides error to fallback", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const testError = new Error("Specific error");
      const obj = makeHasPrivate({});

      revealPrivate(
        context,
        [obj],
        () => {
          throw testError;
        },
        (error) => {
          expect(error).toBe(testError);
        },
      );

      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        testError,
      );
    });
  });

  describe("revealPrivateAsync", () => {
    it("executes async function with revealed properties", async () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ value: "async-test" });

      const result = await revealPrivateAsync(
        context,
        [obj],
        async (revealed) => {
          await Promise.resolve();
          return revealed.value;
        },
        async () => "fallback",
      );

      expect(result).toBe("async-test");
    });

    it("returns promise that resolves to result", async () => {
      const context = createMockContext();
      const obj = makeHasPrivate({ count: 10 });

      const promise = revealPrivateAsync(
        context,
        [obj],
        async (revealed) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return revealed.count * 3;
        },
        async () => 0,
      );

      expect(promise).toBeInstanceOf(Promise);
      await expect(promise).resolves.toBe(30);
    });

    it("calls async fallback on error", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw new Error("Async error");
        },
        async (error) => {
          expect(error).toBeInstanceOf(Error);
          return "async-fallback";
        },
      );

      expect(result).toBe("async-fallback");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("logs warning on async error", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = {} as HasPrivate;

      await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw new Error("Async API error");
        },
        async () => null,
      );

      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("handles multiple async arguments", async () => {
      const context = createMockContext();
      const obj1 = makeHasPrivate({ x: 5 });
      const obj2 = makeHasPrivate({ y: 7 });

      const result = await revealPrivateAsync(
        context,
        [obj1, obj2],
        async (r1, r2) => {
          await Promise.resolve();
          return r1.x * r2.y;
        },
        async () => 0,
      );

      expect(result).toBe(35);
    });

    it("fallback can be synchronous or asynchronous", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      // Sync fallback
      const syncResult = await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw new Error("Error");
        },
        () => "sync-fallback", // Synchronous fallback
      );

      expect(syncResult).toBe("sync-fallback");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );

      // Async fallback
      debugSpy.mockClear();
      warnSpy.mockClear();
      const asyncResult = await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw new Error("Error");
        },
        async () => {
          await Promise.resolve();
          return "async-fallback";
        },
      );

      expect(asyncResult).toBe("async-fallback");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("does not call fallback when async function succeeds", async () => {
      const context = createMockContext();
      const fallback = vi.fn(async () => "fallback");
      const obj = makeHasPrivate({});

      await revealPrivateAsync(context, [obj], async () => "success", fallback);

      expect(fallback).not.toHaveBeenCalled();
    });

    it("handles rejected promises", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsync(
        context,
        [obj],
        async () => Promise.reject(new Error("Rejected")),
        async () => "handled",
      );

      expect(result).toBe("handled");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });

    it("provides error to async fallback", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const testError = new Error("Specific async error");
      const obj = makeHasPrivate({});

      await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw testError;
        },
        async (error) => {
          expect(error).toBe(testError);
        },
      );

      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        testError,
      );
    });
  });

  describe("Type system", () => {
    it("PrivateKeys interface allows extension", () => {
      // This is a compile-time check
      // PrivateKeys should be extendable via declaration merging
      type TestPrivateKeys = PrivateKeys;
      const _typeCheck: TestPrivateKeys = {} as PrivateKeys;
      expect(_typeCheck).toBeDefined();
    });

    it("HasPrivate type represents objects with private properties", () => {
      // Compile-time type check
      const obj = makeHasPrivate({});
      expect(obj).toBeDefined();
    });
  });

  describe("Error scenarios", () => {
    it("handles null/undefined in function", () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = null as unknown as HasPrivate;

      const result = revealPrivate(
        context,
        [obj],
        () => {
          throw new TypeError("Cannot access property");
        },
        () => "handled-null",
      );

      expect(result).toBe("handled-null");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(TypeError),
      );
    });

    it("handles synchronous throw in async context", async () => {
      const context = createMockContext();
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const obj = makeHasPrivate({});

      const result = await revealPrivateAsync(
        context,
        [obj],
        async () => {
          throw new Error("Sync throw in async");
        },
        async () => "recovered",
      );

      expect(result).toBe("recovered");
      expect(debugSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        "translated:errors.private-API-changed",
        expect.any(Error),
      );
    });
  });
});
