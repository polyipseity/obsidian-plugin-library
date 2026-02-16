/**
 * Comprehensive tests for src/types.ts — type utilities and helpers
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  contravariant,
  correctType,
  deopaque,
  launderUnchecked,
  opaqueOrDefault,
  codePoint,
  semVerString,
  simplifyType,
  NULL_SEM_VER_STRING,
  type AnyObject,
  type ReadonlyTuple,
  type Unchecked,
  type CodePoint,
  type SemVerString,
  type Base64String,
} from "../../src/types.js";

describe("types.ts — type utilities and helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("NULL_SEM_VER_STRING constant", () => {
    it("is '0.0.0'", () => {
      expect(NULL_SEM_VER_STRING).toBe("0.0.0");
    });

    it("is a valid SemVerString", () => {
      const version: SemVerString = NULL_SEM_VER_STRING;
      expect(typeof version).toBe("string");
    });
  });

  describe("contravariant", () => {
    it("returns the same array reference", () => {
      const arr = [1, 2, 3];
      const result = contravariant(arr);
      expect(result).toBe(arr);
    });

    it("preserves array contents", () => {
      const arr = ["a", "b", "c"];
      const result = contravariant(arr);
      expect(result).toEqual(arr);
    });

    it("works with readonly arrays", () => {
      const arr: readonly number[] = [1, 2, 3];
      const result = contravariant(arr);
      expect(result).toBe(arr);
    });

    it("handles empty arrays", () => {
      const arr: readonly never[] = [];
      const result = contravariant(arr);
      expect(result).toEqual([]);
    });

    it("works with different types", () => {
      const strings = contravariant(["a", "b"]);
      expect(strings).toEqual(["a", "b"]);

      const numbers = contravariant([1, 2, 3]);
      expect(numbers).toEqual([1, 2, 3]);

      const mixed = contravariant([1, "a", true]);
      expect(mixed).toEqual([1, "a", true]);
    });
  });

  describe("correctType", () => {
    it("casts Window to Window & typeof globalThis", () => {
      const win = window;
      const result = correctType(win);
      expect(result).toBe(win);
    });

    it("preserves window properties", () => {
      const result = correctType(window);
      expect(result.document).toBeDefined();
      expect(result.location).toBeDefined();
    });

    it("returns the same reference", () => {
      const win = window;
      const result = correctType(win);
      expect(result).toBe(win);
    });
  });

  describe("deopaque", () => {
    it("removes opaque wrapper from value", () => {
      const semver = semVerString("1.2.3");
      const deopaqued = deopaque(semver);
      expect(deopaqued).toBe("1.2.3");
    });

    it("returns underlying string from Base64String", () => {
      const base64 = "SGVsbG8=" as Base64String;
      const result = deopaque(base64);
      expect(result).toBe("SGVsbG8=");
    });

    it("preserves value identity", () => {
      const value = "test" as Base64String;
      expect(deopaque(value)).toBe(value);
    });
  });

  describe("launderUnchecked", () => {
    it("creates unchecked version of object", () => {
      const obj = { name: "test", value: 42 };
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked.name).toBe("test");
      expect(unchecked.value).toBe(42);
    });

    it("returns new object reference", () => {
      const obj = { a: 1 };
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked).not.toBe(obj);
      expect(unchecked).toEqual(obj);
    });

    it("handles nested objects", () => {
      const obj = { nested: { value: "deep" } };
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked.nested).toBeDefined();
      expect(unchecked.nested).toEqual({ value: "deep" });
    });

    it("handles arrays in objects", () => {
      const obj = { items: [1, 2, 3] };
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked.items).toEqual([1, 2, 3]);
    });

    it("handles null and undefined properties", () => {
      const obj = { nullProp: null, undefProp: undefined };
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked.nullProp).toBe(null);
      expect(unchecked.undefProp).toBe(undefined);
    });

    it("handles empty objects", () => {
      const obj = {};
      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked).toEqual({});
    });

    it("copies enumerable properties only", () => {
      const obj = Object.create(null);
      obj.visible = "yes";
      Object.defineProperty(obj, "hidden", {
        value: "no",
        enumerable: false,
      });

      const unchecked = launderUnchecked<typeof obj>(obj);

      expect(unchecked.visible).toBe("yes");
      expect("hidden" in unchecked).toBe(false);
    });
  });

  describe("opaqueOrDefault", () => {
    it("returns opaque value when conversion succeeds", () => {
      const result = opaqueOrDefault(
        semVerString,
        "1.0.0" as string,
        "default",
      );
      expect(result).toBe("1.0.0");
    });

    it("returns default when conversion throws", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const result = opaqueOrDefault(
        semVerString,
        "invalid-version" as string,
        "fallback",
      );

      expect(result).toBe("fallback");
      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("invalid-version"),
        }),
      );
    });

    it("logs error on failure", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      opaqueOrDefault(semVerString, "bad" as string, "default");

      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("bad") }),
      );
    });

    it("works with different opaque types", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const makeOpaque = (value: string) => {
        if (value.length < 3) {
          throw new Error("Too short");
        }
        return value as Base64String;
      };

      expect(opaqueOrDefault(makeOpaque, "valid" as string, "default")).toBe(
        "valid",
      );
      expect(opaqueOrDefault(makeOpaque, "ab" as string, "default")).toBe(
        "default",
      );

      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Too short"),
        }),
      );
    });

    it("preserves type of default value", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const result = opaqueOrDefault(semVerString, "bad" as string, null);
      expect(result).toBe(null);

      const result2 = opaqueOrDefault(semVerString, "bad" as string, 0);
      expect(result2).toBe(0);

      expect(debugSpy).toHaveBeenCalledTimes(2);
      expect(debugSpy.mock.calls?.[0]?.[0]).toEqual(
        expect.objectContaining({ message: expect.stringContaining("bad") }),
      );
      expect(debugSpy.mock.calls?.[1]?.[0]).toEqual(
        expect.objectContaining({ message: expect.stringContaining("bad") }),
      );
    });
  });

  describe("codePoint", () => {
    it("creates CodePoint from single character", () => {
      const cp = codePoint("A");
      expect(cp).toBe("A");
    });

    it("works with ASCII characters", () => {
      expect(codePoint("a")).toBe("a");
      expect(codePoint("Z")).toBe("Z");
      expect(codePoint("0")).toBe("0");
    });

    it("works with Unicode characters", () => {
      expect(codePoint("日")).toBe("日");
      expect(codePoint("€")).toBe("€");
    });

    it("works with emojis", () => {
      // Note: Some emojis are multi-code-point and may not work
      expect(codePoint("😀")).toBe("😀");
    });

    it("throws for empty string", () => {
      expect(() => codePoint("")).toThrow(TypeError);
    });

    it("throws for multi-character strings", () => {
      expect(() => codePoint("ab")).toThrow(TypeError);
      expect(() => codePoint("hello")).toThrow(TypeError);
    });

    it("returns value with codePointAt method", () => {
      const cp = codePoint("X");
      expect(cp.codePointAt(0)).toBe(88); // 'X' is 88
    });

    it("handles special characters", () => {
      expect(codePoint(" ")).toBe(" ");
      expect(codePoint("\n")).toBe("\n");
      expect(codePoint("\t")).toBe("\t");
    });
  });

  describe("semVerString", () => {
    it("parses valid semantic versions", () => {
      expect(semVerString("1.0.0")).toBe("1.0.0");
      expect(semVerString("0.0.1")).toBe("0.0.1");
      expect(semVerString("2.3.4")).toBe("2.3.4");
    });

    it("requires normalized version strings", () => {
      expect(() => semVerString("1.0")).toThrowError(TypeError);
      expect(() => semVerString("2")).toThrowError(TypeError);
    });

    it("handles pre-release versions", () => {
      const version = semVerString("1.0.0-alpha");
      expect(version).toContain("1.0.0");
      expect(version).toContain("alpha");
    });

    it("handles build metadata", () => {
      const version = semVerString("1.0.0+build.123");
      expect(version).toContain("1.0.0");
    });

    it("throws for invalid versions", () => {
      expect(() => semVerString("not-a-version")).toThrow();
      expect(() => semVerString("")).toThrow();
      expect(() => semVerString("abc")).toThrow();
    });

    it("handles leading v", () => {
      expect(semVerString("v1.2.3")).toBe("1.2.3");
    });

    it("works with complex versions", () => {
      const complex = semVerString("1.2.3-beta.1+build.456");
      expect(complex).toBeTruthy();
      expect(typeof complex).toBe("string");
    });
  });

  describe("simplifyType", () => {
    it("returns the same value", () => {
      const value = { a: 1, b: "test" };
      const result = simplifyType(value);
      expect(result).toBe(value);
    });

    it("preserves object structure", () => {
      const obj = { nested: { value: 42 } };
      const result = simplifyType(obj);
      expect(result).toEqual(obj);
    });

    it("works with arrays", () => {
      const arr = [1, 2, 3];
      const result = simplifyType(arr);
      expect(result).toBe(arr);
    });

    it("works with primitives", () => {
      expect(simplifyType("string")).toBe("string");
      expect(simplifyType(42)).toBe(42);
      expect(simplifyType(true)).toBe(true);
      expect(simplifyType(null)).toBe(null);
    });

    it("handles readonly to writable conversion", () => {
      const readonly = { value: 1 } as const;
      const writable = simplifyType(readonly);
      expect(writable).toEqual({ value: 1 });
    });

    it("is identity function at runtime", () => {
      const input = { test: "value" };
      const output = simplifyType(input);
      expect(output).toBe(input);
    });
  });

  describe("Type definitions", () => {
    it("AnyObject accepts any object structure", () => {
      const obj1: AnyObject = { a: 1 };
      const obj2: AnyObject = { nested: { deep: true } };
      const obj3: AnyObject = { [Symbol("key")]: "value" };

      expect(obj1).toBeDefined();
      expect(obj2).toBeDefined();
      expect(obj3).toBeDefined();
    });

    it("ReadonlyTuple accepts tuples", () => {
      const tuple1: ReadonlyTuple<number> = [1, 2, 3];
      const tuple2: ReadonlyTuple<string> = ["a"];
      const tuple3: ReadonlyTuple = [];

      expect(tuple1).toHaveLength(3);
      expect(tuple2).toHaveLength(1);
      expect(tuple3).toHaveLength(0);
    });

    it("Unchecked allows partial/unknown properties", () => {
      interface TestType {
        name: string;
        value: number;
      }

      const unchecked: Unchecked<TestType> = {
        name: "test",
        // value is optional in Unchecked
      };

      expect(unchecked.name).toBe("test");
      expect(unchecked.value).toBeUndefined();
    });

    it("CodePoint is a string with codePointAt", () => {
      const cp: CodePoint = codePoint("A");
      expect(typeof cp).toBe("string");
      expect(cp.codePointAt(0)).toBe(65);
    });

    it("SemVerString is an opaque string", () => {
      const version: SemVerString = semVerString("1.0.0");
      expect(typeof version).toBe("string");
    });

    it("Base64String is an opaque string", () => {
      const base64: Base64String = "SGVsbG8=" as Base64String;
      expect(typeof base64).toBe("string");
    });
  });

  describe("Edge cases", () => {
    it("launderUnchecked handles non-object gracefully", () => {
      const result = launderUnchecked<{ value: number }>("not an object");
      expect(typeof result).toBe("object");
    });

    it("opaqueOrDefault handles throwing converter", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const thrower = () => {
        throw new Error("Always fails");
      };

      const result = opaqueOrDefault(thrower, "input", "fallback");
      expect(result).toBe("fallback");

      expect(debugSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Always fails"),
        }),
      );
    });

    it("contravariant preserves tuple types", () => {
      const tuple: readonly [number, string, boolean] = [1, "a", true];
      const result = contravariant(tuple);
      expect(result).toEqual([1, "a", true]);
    });

    it("codePoint validates single code point", () => {
      expect(() => codePoint("ab")).toThrow();
      expect(() => codePoint("")).toThrow();
    });
  });
});
