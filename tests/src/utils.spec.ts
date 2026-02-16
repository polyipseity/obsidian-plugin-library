/**
 * Comprehensive tests for src/utils.ts — utility functions
 * This file tests core utilities like EventEmitterLite, Functions, and various helper functions
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  EventEmitterLite,
  Functions,
  alternativeRegExp,
  anyToError,
  assignExact,
  asyncDebounce,
  base64ToBytes,
  base64ToString,
  basename,
  bigIntReplacer,
  bracket,
  bytesToBase64,
  capitalize,
  cartesianProduct,
  clear,
  clearProperties,
  cloneAsFrozen,
  cloneAsWritable,
  consumeEvent,
  copyOnWrite,
  copyOnWriteAsync,
  deepFreeze,
  escapeJavaScriptString,
  escapeQuerySelectorAttribute,
  extname,
  getKeyModifiers,
  inSet,
  insertAt,
  isHomogenousArray,
  isNonNil,
  lazyInit,
  mapFirstCodePoint,
  multireplace,
  promisePromise,
  randomNotIn,
  rangeCodePoint,
  remove,
  removeAt,
  replaceAllRegex,
  splitLines,
  startCase,
  stringToBase64,
  toJSONOrString,
  sleep2,
  swap,
  uncapitalize,
  unexpected,
  typedIn,
  typedOwnKeys,
} from "../../src/utils.js";
import { codePoint } from "../../src/types.js";
import { JSON_STRINGIFY_SPACE } from "../../src/magic.js";

describe("utils.ts — utility functions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("EventEmitterLite", () => {
    it("emits to registered listeners", async () => {
      const emitter = new EventEmitterLite<[string, number]>();
      const listener = vi.fn();

      emitter.listen(listener);
      await emitter.emit("test", 42);

      expect(listener).toHaveBeenCalledWith("test", 42);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("emits to multiple listeners", async () => {
      const emitter = new EventEmitterLite<[string]>();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      emitter.listen(listener1);
      emitter.listen(listener2);
      await emitter.emit("event");

      expect(listener1).toHaveBeenCalledWith("event");
      expect(listener2).toHaveBeenCalledWith("event");
    });

    it("removes listener when unlisten is called", async () => {
      const emitter = new EventEmitterLite<[number]>();
      const listener = vi.fn();

      const unlisten = emitter.listen(listener);
      await emitter.emit(1);
      expect(listener).toHaveBeenCalledTimes(1);

      unlisten();
      await emitter.emit(2);
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });

    it("handles async listeners", async () => {
      const emitter = new EventEmitterLite<[string]>();
      let resolved = false;
      const asyncListener = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        resolved = true;
      });

      emitter.listen(asyncListener);
      await emitter.emit("test");

      expect(asyncListener).toHaveBeenCalled();
      expect(resolved).toBe(true);
    });

    it("propagates listener errors", async () => {
      const emitter = new EventEmitterLite<[string]>();
      const errorListener = vi.fn(() => {
        throw new Error("Listener error");
      });
      const goodListener = vi.fn();

      emitter.listen(errorListener);
      emitter.listen(goodListener);

      // Emit should throw if a listener throws
      await expect(emitter.emit("test")).rejects.toThrow("Listener error");
      expect(errorListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });

    it("prevents concurrent modification issues", async () => {
      const emitter = new EventEmitterLite<[number]>();
      const callCount = vi.fn();

      const listener1 = vi.fn(() => {
        callCount();
      });
      const listener2 = vi.fn(() => {
        callCount();
      });

      emitter.listen(listener1);
      emitter.listen(listener2);

      await emitter.emit(1);
      expect(callCount).toHaveBeenCalledTimes(2);
    });
  });

  describe("Functions", () => {
    describe("sync mode", () => {
      it("calls all functions synchronously", () => {
        const fn1 = vi.fn();
        const fn2 = vi.fn();
        const functions = new Functions<false, [string, number]>(
          { async: false },
          fn1,
          fn2,
        );

        functions.call("arg1", 123);

        expect(fn1).toHaveBeenCalledWith("arg1", 123);
        expect(fn2).toHaveBeenCalledWith("arg1", 123);
      });

      it("handles errors in settled mode", () => {
        const errorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const fn1 = vi.fn(() => {
          throw new Error("Test error");
        });
        const fn2 = vi.fn();

        const functions = new Functions(
          { async: false, settled: true },
          fn1,
          fn2,
        );
        functions.call();

        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalled();
      });

      it("propagates errors in non-settled mode", () => {
        const fn = vi.fn(() => {
          throw new Error("Test error");
        });
        const functions = new Functions({ async: false }, fn);

        expect(() => functions.call()).toThrow("Test error");
      });

      it("transforms function array", () => {
        const fn1 = vi.fn();
        const fn2 = vi.fn();
        const functions = new Functions<false, [string]>(
          { async: false },
          fn1,
          fn2,
        );

        const transformed = functions.transform((fns) => {
          const first = fns[0];
          if (first === undefined) {
            throw new Error("expected at least one function");
          }
          return [first];
        });
        transformed.call("test");

        expect(fn1).toHaveBeenCalledWith("test");
        expect(fn2).not.toHaveBeenCalled();
      });
    });

    describe("async mode", () => {
      it("calls all functions asynchronously", async () => {
        const fn1 = vi.fn(async () => {
          await Promise.resolve();
        });
        const fn2 = vi.fn(async () => {
          await Promise.resolve();
        });
        const functions = new Functions<true, [string, number]>(
          { async: true },
          fn1,
          fn2,
        );

        await functions.call("arg1", 123);

        expect(fn1).toHaveBeenCalledWith("arg1", 123);
        expect(fn2).toHaveBeenCalledWith("arg1", 123);
      });

      it("waits for all promises in non-settled mode", async () => {
        let order = "";
        const fn1 = vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          order += "1";
        });
        const fn2 = vi.fn(async () => {
          await new Promise((resolve) => setTimeout(resolve, 5));
          order += "2";
        });
        const functions = new Functions({ async: true }, fn1, fn2);

        await functions.call();

        expect(order).toBe("21"); // fn2 finishes first but all wait
        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
      });

      it("handles errors in settled mode", async () => {
        const fn1 = vi.fn(async () => {
          throw new Error("Async error");
        });
        const fn2 = vi.fn(async () => {
          await Promise.resolve();
        });
        const functions = new Functions(
          { async: true, settled: true },
          fn1,
          fn2,
        );

        await expect(functions.call()).resolves.toBeUndefined();
        expect(fn1).toHaveBeenCalled();
        expect(fn2).toHaveBeenCalled();
      });
    });

    it("uses call0 with thisArg", () => {
      const context = { value: 42 };
      const fn = vi.fn(function (this: unknown) {
        return this;
      });
      const functions = new Functions({ async: false }, fn);

      functions.call0(context);

      expect(fn).toHaveBeenCalled();
    });
  });

  describe("alternativeRegExp", () => {
    it("creates regex matching any of the strings", () => {
      const regex = alternativeRegExp(["cat", "dog", "bird"]);
      expect("I have a cat").toMatch(regex);
      expect("I have a dog").toMatch(regex);
      expect("I have a fish").not.toMatch(regex);
    });

    it("sorts by length (longest first) for correct matching", () => {
      const regex = alternativeRegExp(["test", "testing"]);
      const match = "testing".match(regex);
      expect(match?.[0]).toBe("testing"); // Should match full word, not prefix
    });

    it("returns never-matching regex for empty array", () => {
      const regex = alternativeRegExp([]);
      expect("anything").not.toMatch(regex);
    });

    it("escapes special regex characters", () => {
      const regex = alternativeRegExp(["a.b", "c*d", "e+f"]);
      expect("a.b").toMatch(regex);
      expect("aXb").not.toMatch(regex);
    });
  });

  describe("anyToError", () => {
    it("returns Error objects unchanged", () => {
      const error = new Error("Test error");
      expect(anyToError(error)).toBe(error);
    });

    it("converts strings to Error", () => {
      const result = anyToError("Error message");
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Error message");
    });

    it("converts numbers to Error", () => {
      const result = anyToError(404);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("404");
    });

    it("converts objects to Error", () => {
      const result = anyToError({ code: 500 });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("code");
    });

    it("handles null and undefined", () => {
      expect(anyToError(null)).toBeInstanceOf(Error);
      expect(anyToError(undefined)).toBeInstanceOf(Error);
    });
  });

  describe("assignExact", () => {
    it("assigns value when defined", () => {
      const obj: Record<string, unknown> = { a: 1 };
      const result = assignExact(obj, "b", "value");

      expect(obj.b).toBe("value");
      expect(result).toBe("value");
    });

    it("deletes key when value is undefined", () => {
      const obj = { a: 1, b: 2 };
      const result = assignExact(obj, "b", undefined);

      expect("b" in obj).toBe(false);
      expect(result).toBe(undefined);
    });

    it("returns the value", () => {
      const obj: Record<string, unknown> = {};
      expect(assignExact(obj, "key", 42)).toBe(42);
      expect(assignExact(obj, "key", undefined)).toBe(undefined);
    });
  });

  describe("asyncDebounce", () => {
    it("debounces async operations", async () => {
      const executor = vi.fn((resolve: (value: string) => void) => {
        resolve("result");
      });
      const debounced = asyncDebounce<[string], string>(executor);

      const promise1 = debounced("arg1");
      const promise2 = debounced("arg2");

      const results = await Promise.all([promise1, promise2]);

      expect(results).toEqual(["result", "result"]);
      expect(executor).toHaveBeenCalledTimes(2);
    });

    it("resolves all pending promises together", async () => {
      let resolveCount = 0;
      const debounced = asyncDebounce((resolve: (value: number) => void) => {
        setTimeout(() => {
          resolveCount++;
          resolve(resolveCount);
        }, 10);
      });

      const p1 = debounced();
      const p2 = debounced();
      const p3 = debounced();

      const results = await Promise.all([p1, p2, p3]);

      // All should resolve with the same value
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });

    it("handles rejections", async () => {
      const debounced = asyncDebounce((_, reject: (reason: string) => void) => {
        reject("error");
      });

      await expect(debounced()).rejects.toBe("error");
    });
  });

  describe("base64 functions", () => {
    it("converts bytes to base64 and back", () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = bytesToBase64(bytes);
      const decoded = base64ToBytes(base64);

      expect(decoded).toEqual(bytes);
    });

    it("converts string to base64 and back", () => {
      const original = "Hello, World! 🌍";
      const base64 = stringToBase64(original);
      const decoded = base64ToString(base64);

      expect(decoded).toBe(original);
    });

    it("handles empty strings", () => {
      const base64 = stringToBase64("");
      expect(base64ToString(base64)).toBe("");
    });

    it("handles Unicode properly", () => {
      const unicode = "日本語 中文 한국어";
      const base64 = stringToBase64(unicode);
      expect(base64ToString(base64)).toBe(unicode);
    });
  });

  describe("basename", () => {
    it("extracts filename from path", () => {
      expect(basename("/path/to/file.txt")).toBe("file.txt");
      expect(basename("C:\\Users\\file.txt")).toBe("file.txt");
    });

    it("removes extension when provided", () => {
      expect(basename("/path/to/file.txt", ".txt")).toBe("file");
      expect(basename("document.md", ".md")).toBe("document");
    });

    it("handles paths without separators", () => {
      expect(basename("file.txt")).toBe("file.txt");
    });

    it("handles empty path", () => {
      expect(basename("")).toBe("");
    });

    it("handles paths ending with separator", () => {
      expect(basename("/path/to/")).toBe("");
    });
  });

  describe("bigIntReplacer", () => {
    it("converts bigint to string in JSON", () => {
      const replacer = bigIntReplacer();
      const obj = { big: BigInt(123), normal: 456 };

      const json = JSON.stringify(obj, replacer);
      expect(json).toContain('"big":"123"');
      expect(json).toContain('"normal":456');
    });

    it("preserves other types", () => {
      const replacer = bigIntReplacer();
      expect(replacer("key", "string")).toBe("string");
      expect(replacer("key", 123)).toBe(123);
      expect(replacer("key", null)).toBe(null);
      expect(replacer("key", true)).toBe(true);
    });
  });

  describe("bracket", () => {
    it("returns valid result when key exists", () => {
      const obj = { name: "test", value: 42 };
      const result = bracket(obj, "name");

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value).toBe("test");
      }
    });

    it("returns invalid result when key does not exist", () => {
      const obj = { name: "test" };
      const result = bracket(obj, "missing" as keyof typeof obj);

      expect(result.valid).toBe(false);
    });

    it("is frozen", () => {
      const obj = { key: "value" };
      const result = bracket(obj, "key");

      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe("capitalize", () => {
    it("capitalizes first letter", () => {
      expect(capitalize("hello")).toBe("Hello");
      expect(capitalize("world")).toBe("World");
    });

    it("preserves rest of string", () => {
      expect(capitalize("hELLO")).toBe("HELLO");
    });

    it("handles empty string", () => {
      expect(capitalize("")).toBe("");
    });

    it("handles single character", () => {
      expect(capitalize("a")).toBe("A");
    });

    it("handles Unicode", () => {
      expect(capitalize("école")).toBe("École");
    });
  });

  describe("cartesianProduct", () => {
    it("computes cartesian product of two arrays", () => {
      const result = cartesianProduct([1, 2], ["a", "b"]);
      expect(result).toEqual([
        [1, "a"],
        [1, "b"],
        [2, "a"],
        [2, "b"],
      ]);
    });

    it("computes cartesian product of three arrays", () => {
      const result = cartesianProduct([1, 2], ["a"], [true]);
      expect(result).toEqual([
        [1, "a", true],
        [2, "a", true],
      ]);
    });

    it("returns frozen result", () => {
      const result = cartesianProduct([1], ["a"]);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("handles empty array", () => {
      const result = cartesianProduct([], [1, 2]);
      expect(result).toEqual([]);
    });
  });

  describe("clear", () => {
    it("clears array", () => {
      const arr = [1, 2, 3];
      clear(arr);
      expect(arr).toEqual([]);
      expect(arr.length).toBe(0);
    });

    it("maintains array reference", () => {
      const arr = [1, 2, 3];
      const ref = arr;
      clear(arr);
      expect(ref).toBe(arr);
    });
  });

  describe("clearProperties", () => {
    it("removes all own properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      clearProperties(obj);
      expect(Object.keys(obj)).toEqual([]);
    });

    it("maintains object reference", () => {
      const obj = { a: 1 };
      const ref = obj;
      clearProperties(obj);
      expect(ref).toBe(obj);
    });

    it("handles symbol keys", () => {
      const sym = Symbol("test");
      const obj = { [sym]: "value", regular: 42 };
      clearProperties(obj);
      expect(Object.getOwnPropertySymbols(obj)).toEqual([]);
      expect(Object.keys(obj)).toEqual([]);
    });
  });

  describe("cloneAsFrozen and cloneAsWritable", () => {
    it("creates frozen deep clone", () => {
      const obj = { nested: { value: 42 } };
      const clone = cloneAsFrozen(obj);

      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(Object.isFrozen(clone)).toBe(true);
      expect(Object.isFrozen(clone.nested)).toBe(true);
    });

    it("creates writable deep clone", () => {
      const obj = Object.freeze({ nested: Object.freeze({ value: 42 }) });
      const clone = cloneAsWritable(obj);

      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
      expect(Object.isFrozen(clone)).toBe(false);
    });
  });

  describe("consumeEvent", () => {
    it("prevents default and stops propagation", () => {
      const event = new Event("click");
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      const stopPropagationSpy = vi.spyOn(event, "stopPropagation");

      consumeEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe("copyOnWrite", () => {
    it("clones and mutates object", () => {
      const original = Object.freeze<{ value: number }>({ value: 1 });
      const result = copyOnWrite(original, (obj) => {
        obj.value = 2;
      });

      expect(original.value).toBe(1);
      expect(result.value).toBe(2);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("handles nested mutations", () => {
      const original = Object.freeze<{ nested: { value: number } }>({
        nested: { value: 1 },
      });
      const result = copyOnWrite(original, (obj) => {
        obj.nested.value = 2;
      });

      expect(result.nested.value).toBe(2);
    });
  });

  describe("copyOnWriteAsync", () => {
    it("clones and mutates object asynchronously", async () => {
      const original = Object.freeze<{ value: number }>({ value: 1 });
      const result = await copyOnWriteAsync(original, async (obj) => {
        await Promise.resolve();
        obj.value = 2;
      });

      expect(original.value).toBe(1);
      expect(result.value).toBe(2);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe("deepFreeze", () => {
    it("freezes object deeply", () => {
      const obj = { a: { b: { c: 1 } } };
      const frozen = deepFreeze(obj);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.a)).toBe(true);
      expect(Object.isFrozen(frozen.a.b)).toBe(true);
    });

    it("handles circular references", () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;

      expect(() => deepFreeze(obj)).not.toThrow();
      expect(Object.isFrozen(obj)).toBe(true);
    });

    it("freezes arrays", () => {
      const arr = [1, [2, [3]]];
      const frozen = deepFreeze(arr);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen[1])).toBe(true);
    });
  });

  describe("escapeJavaScriptString", () => {
    it("escapes backticks", () => {
      expect(escapeJavaScriptString("hello`world")).toBe("`hello\\`world`");
    });

    it("escapes backslashes", () => {
      expect(escapeJavaScriptString("path\\to\\file")).toBe(
        "`path\\\\to\\\\file`",
      );
    });

    it("escapes dollar signs", () => {
      expect(escapeJavaScriptString("price: $50")).toBe("`price: \\$50`");
    });
  });

  describe("escapeQuerySelectorAttribute", () => {
    it("escapes quotes", () => {
      expect(escapeQuerySelectorAttribute('value"with"quotes')).toBe(
        'value\\"with\\"quotes',
      );
    });

    it("escapes backslashes", () => {
      expect(escapeQuerySelectorAttribute("path\\to\\file")).toBe(
        "path\\\\to\\\\file",
      );
    });
  });

  describe("extname", () => {
    it("extracts file extension", () => {
      expect(extname("file.txt")).toBe(".txt");
      expect(extname("archive.tar.gz")).toBe(".gz");
    });

    it("returns empty string for no extension", () => {
      expect(extname("file")).toBe("");
      expect(extname("README")).toBe("");
    });

    it("handles hidden files", () => {
      expect(extname(".gitignore")).toBe("");
      expect(extname(".config.json")).toBe(".json");
    });
  });

  describe("getKeyModifiers", () => {
    it("extracts all modifiers", () => {
      const event = new KeyboardEvent("keydown", {
        altKey: true,
        ctrlKey: true,
        metaKey: true,
        shiftKey: true,
      });

      const modifiers = getKeyModifiers(event);
      expect(modifiers).toContain("Alt");
      expect(modifiers).toContain("Ctrl");
      expect(modifiers).toContain("Meta");
      expect(modifiers).toContain("Shift");
    });

    it("returns empty for no modifiers", () => {
      const event = new KeyboardEvent("keydown");
      const modifiers = getKeyModifiers(event);
      expect(modifiers).toEqual([]);
    });

    it("returns frozen array", () => {
      const event = new KeyboardEvent("keydown", { ctrlKey: true });
      const modifiers = getKeyModifiers(event);
      expect(Object.isFrozen(modifiers)).toBe(true);
    });
  });

  describe("inSet", () => {
    it("checks if value is in set", () => {
      const set = ["a", "b", "c"] as const;
      expect(inSet(set, "a")).toBe(true);
      expect(inSet(set, "b")).toBe(true);
      expect(inSet(set, "d")).toBe(false);
    });

    it("uses strict equality", () => {
      const set = [1, 2, 3] as const;
      expect(inSet(set, 1)).toBe(true);
      expect(inSet(set, "1")).toBe(false);
    });
  });

  describe("insertAt", () => {
    it("inserts items at index", () => {
      const arr = [1, 2, 5];
      insertAt(arr, 2, 3, 4);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    it("inserts at beginning", () => {
      const arr = [2, 3];
      insertAt(arr, 0, 1);
      expect(arr).toEqual([1, 2, 3]);
    });

    it("inserts at end", () => {
      const arr = [1, 2];
      insertAt(arr, 2, 3);
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe("isHomogenousArray", () => {
    it("validates homogenous string array", () => {
      expect(isHomogenousArray(["string"], ["a", "b", "c"])).toBe(true);
    });

    it("rejects mixed array", () => {
      expect(isHomogenousArray(["string"], ["a", 1, "c"])).toBe(false);
    });

    it("rejects non-array", () => {
      expect(isHomogenousArray(["string"], "not array")).toBe(false);
      expect(isHomogenousArray(["number"], 42)).toBe(false);
    });

    it("handles empty array", () => {
      expect(isHomogenousArray(["string"], [])).toBe(true);
    });

    it("allows multiple types", () => {
      expect(isHomogenousArray(["string", "number"], ["a", 1, "b", 2])).toBe(
        true,
      );
      expect(isHomogenousArray(["string", "number"], ["a", true])).toBe(false);
    });
  });

  describe("isNonNil", () => {
    it("returns true for non-null/undefined values", () => {
      expect(isNonNil("string" as string | null)).toBe(true);
      expect(isNonNil(0 as number | null)).toBe(true);
      expect(isNonNil(false as boolean | null)).toBe(true);
      expect(isNonNil({} as object | null)).toBe(true);
    });

    it("returns false for null and undefined", () => {
      expect(isNonNil(null as string | null)).toBe(false);
      expect(isNonNil(undefined as number | undefined)).toBe(false);
    });
  });

  describe("lazyInit", () => {
    it("initializes lazily", () => {
      const initializer = vi.fn(() => 42);
      const lazy = lazyInit(initializer);

      expect(initializer).not.toHaveBeenCalled();
      expect(lazy()).toBe(42);
      expect(initializer).toHaveBeenCalledTimes(1);
    });

    it("caches result", () => {
      const initializer = vi.fn(() => Math.random());
      const lazy = lazyInit(initializer);

      const first = lazy();
      const second = lazy();

      expect(first).toBe(second);
      expect(initializer).toHaveBeenCalledTimes(1);
    });
  });

  describe("mapFirstCodePoint", () => {
    it("maps first code point", () => {
      const result = mapFirstCodePoint("hello", (c) => c.toUpperCase());
      expect(result).toBe("Hello");
    });

    it("maps rest with mapRest", () => {
      const result = mapFirstCodePoint(
        "hello",
        (c) => c.toUpperCase(),
        (rest) => rest.toUpperCase(),
      );
      expect(result).toBe("HELLO");
    });

    it("handles empty string", () => {
      const result = mapFirstCodePoint("", (c) => c.toUpperCase());
      expect(result).toBe("");
    });

    it("handles Unicode code points", () => {
      const result = mapFirstCodePoint("🌍world", () => "🌎");
      expect(result).toBe("🌎world");
    });
  });

  describe("multireplace", () => {
    it("replaces multiple patterns", () => {
      const replacements = new Map([
        ["cat", "dog"],
        ["bird", "fish"],
      ]);
      const result = multireplace("I have a cat and a bird", replacements);
      expect(result).toBe("I have a dog and a fish");
    });

    it("handles overlapping patterns", () => {
      const replacements = new Map([
        ["test", "TEST"],
        ["testing", "TESTING"],
      ]);
      const result = multireplace("testing", replacements);
      expect(result).toBe("TESTING"); // Should match longest
    });
  });

  describe("promisePromise", () => {
    it("creates resolvable promise", async () => {
      const pp = await promisePromise<number>();
      pp.resolve(42);
      await expect(pp.promise).resolves.toBe(42);
    });

    it("creates rejectable promise", async () => {
      const pp = await promisePromise<number>();
      pp.reject(new Error("test"));
      await expect(pp.promise).rejects.toThrow("test");
    });
  });

  describe("randomNotIn", () => {
    it("generates value not in array", () => {
      const existing = ["a", "b", "c"];
      const generator = vi
        .fn()
        .mockReturnValueOnce("a")
        .mockReturnValueOnce("b")
        .mockReturnValueOnce("d");

      const result = randomNotIn(existing, generator);
      expect(result).toBe("d");
      expect(generator).toHaveBeenCalledTimes(3);
    });
  });

  describe("rangeCodePoint", () => {
    it("generates range of code points", () => {
      const result = rangeCodePoint(codePoint("a"), codePoint("d"));
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("is frozen", () => {
      const result = rangeCodePoint(codePoint("a"), codePoint("c"));
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe("remove and removeAt", () => {
    it("removes item from array", () => {
      const arr = [1, 2, 3, 4];
      const removed = remove(arr, 3);
      expect(removed).toBe(3);
      expect(arr).toEqual([1, 2, 4]);
    });

    it("removes item at index", () => {
      const arr = [1, 2, 3, 4];
      const removed = removeAt(arr, 2);
      expect(removed).toBe(3);
      expect(arr).toEqual([1, 2, 4]);
    });

    it("returns undefined for non-existent item", () => {
      const arr = [1, 2, 3];
      expect(remove(arr, 999)).toBeUndefined();
      expect(arr).toEqual([1, 2, 3]);
    });
  });

  describe("replaceAllRegex", () => {
    it("creates regex for replacing all occurrences", () => {
      const regex = replaceAllRegex("test");
      const result = "test test test".replace(regex, "TEST");
      expect(result).toBe("TEST TEST TEST");
    });

    it("escapes special characters", () => {
      const regex = replaceAllRegex("a.b");
      const result = "a.b aXb".replace(regex, "X");
      expect(result).toBe("X aXb");
    });
  });

  describe("splitLines", () => {
    it("splits on various line delimiters", () => {
      expect(splitLines("a\nb\nc")).toEqual(["a", "b", "c"]);
      expect(splitLines("a\r\nb\r\nc")).toEqual(["a", "b", "c"]);
    });

    it("handles single line", () => {
      expect(splitLines("single")).toEqual(["single"]);
    });
  });

  describe("startCase", () => {
    it("capitalizes each word", () => {
      expect(startCase("hello world")).toBe("Hello World");
      expect(startCase("the quick brown fox")).toBe("The Quick Brown Fox");
    });
  });

  describe("toJSONOrString", () => {
    it("converts to JSON", () => {
      expect(toJSONOrString({ a: 1 })).toBe(
        `{\n${JSON_STRINGIFY_SPACE}"a": 1\n}`,
      );
    });

    it("falls back to String for circular references", () => {
      const obj: Record<string, unknown> = { a: 1 };
      obj.self = obj;

      // capture and suppress the stringify error logged by toJSONOrString
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const result = toJSONOrString(obj);
      expect(result).toContain("object");

      expect(debugSpy).toHaveBeenCalled();
      const logged = debugSpy.mock.calls[0]?.[0] as Error | undefined;
      expect(logged).toBeInstanceOf(Error);
      expect(logged?.message).toContain(
        "Converting circular structure to JSON",
      );
    });
  });

  describe("sleep2", () => {
    it("sleeps for specified time", async () => {
      vi.useFakeTimers();
      const promise = sleep2(globalThis, 0.1);
      vi.advanceTimersByTime(100);
      await promise;
      vi.useRealTimers();
    });
  });

  describe("swap", () => {
    it("swaps array elements", () => {
      const arr = [1, 2, 3];
      swap(arr, 0, 2);
      expect(arr).toEqual([3, 2, 1]);
    });
  });

  describe("uncapitalize", () => {
    it("uncapitalizes first letter", () => {
      expect(uncapitalize("Hello")).toBe("hello");
      expect(uncapitalize("WORLD")).toBe("wORLD");
    });
  });

  describe("unexpected", () => {
    it("throws Error", () => {
      expect(() => unexpected()).toThrow(Error);
    });
  });

  describe("typedIn", () => {
    it("returns accessor for existing key", () => {
      const obj = { name: "test", value: 42 };
      const accessor = typedIn(obj, "name");

      expect(accessor).not.toBeNull();
      expect(accessor?.()).toBe("test");
    });

    it("returns null for non-existent key", () => {
      const obj = { name: "test" };
      const accessor = typedIn(obj, "missing");

      expect(accessor).toBeNull();
    });
  });

  describe("typedOwnKeys", () => {
    it("returns all own keys", () => {
      const obj = { a: 1, b: 2 };
      const keys = typedOwnKeys(obj);

      expect(keys).toContain("a");
      expect(keys).toContain("b");
      expect(keys).toHaveLength(2);
    });

    it("includes symbol keys", () => {
      const sym = Symbol("test");
      const obj = { [sym]: "value", regular: 42 };
      const keys = typedOwnKeys(obj);

      expect(keys).toContain(sym);
      expect(keys).toContain("regular");
    });
  });
});
