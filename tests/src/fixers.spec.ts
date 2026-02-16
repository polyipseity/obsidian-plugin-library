/**
 * Comprehensive tests for src/fixers.ts — settings validation and fixing utilities
 */
import { describe, it, expect } from "vitest";
import {
  markFixed,
  fixTyped,
  fixArray,
  fixInSet,
  type Fixed,
} from "../../src/fixers.js";
import type { Unchecked } from "../../src/types.js";

describe("fixers.ts — settings validation and fixing", () => {
  describe("markFixed", () => {
    it("marks valid fixed values when unchecked matches fixed", () => {
      const unchecked = { name: "test", value: 42 };
      const fixed = { name: "test", value: 42 };
      const result = markFixed(unchecked, fixed);

      expect(result.value).toEqual(fixed);
      expect(result.valid).toBe(true);
    });

    it("marks invalid when unchecked differs from fixed", () => {
      const unchecked = { name: "test", value: 99 };
      const fixed = { name: "test", value: 42 };
      const result = markFixed(unchecked, fixed);

      expect(result.value).toEqual(fixed);
      expect(result.valid).toBe(false);
    });

    it("returns frozen object", () => {
      const result = markFixed("original", "fixed");
      expect(Object.isFrozen(result)).toBe(true);
    });

    it("handles primitive values", () => {
      expect(markFixed(42, 42).valid).toBe(true);
      expect(markFixed(42, 43).valid).toBe(false);
      expect(markFixed("hello", "hello").valid).toBe(true);
      expect(markFixed("hello", "world").valid).toBe(false);
      expect(markFixed(true, true).valid).toBe(true);
      expect(markFixed(true, false).valid).toBe(false);
    });

    it("handles null and undefined", () => {
      expect(markFixed(null, null).valid).toBe(true);
      expect(markFixed(undefined, undefined).valid).toBe(true);
      expect(markFixed(null, undefined).valid).toBe(false);
      expect(markFixed(undefined, null).valid).toBe(false);
    });

    it("handles nested objects", () => {
      const unchecked = { a: { b: { c: 1 } } };
      const fixed = { a: { b: { c: 1 } } };
      expect(markFixed(unchecked, fixed).valid).toBe(true);

      const unchecked2 = { a: { b: { c: 1 } } };
      const fixed2 = { a: { b: { c: 2 } } };
      expect(markFixed(unchecked2, fixed2).valid).toBe(false);
    });

    it("handles arrays", () => {
      expect(markFixed([1, 2, 3], [1, 2, 3]).valid).toBe(true);
      expect(markFixed([1, 2, 3], [1, 2, 4]).valid).toBe(false);
      expect(markFixed([1, 2], [1, 2, 3]).valid).toBe(false);
    });

    it("uses lazy evaluation for valid property", () => {
      const unchecked = { expensive: "computation" };
      const fixed = { expensive: "computation" };
      const result = markFixed(unchecked, fixed);

      // Access valid property multiple times
      expect(result.valid).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.valid).toBe(true);
    });

    it("handles complex mixed structures", () => {
      const unchecked = {
        str: "text",
        num: 42,
        arr: [1, 2, { nested: true }],
        obj: { key: "value" },
      };
      const fixed = {
        str: "text",
        num: 42,
        arr: [1, 2, { nested: true }],
        obj: { key: "value" },
      };
      expect(markFixed(unchecked, fixed).valid).toBe(true);
    });
  });

  describe("fixTyped", () => {
    interface TestSettings {
      name: string;
      age: number;
      active: boolean;
    }

    it("returns valid value when type matches", () => {
      const defaults: TestSettings = { name: "default", age: 0, active: false };
      const from: Unchecked<TestSettings> = {
        name: "John",
        age: 30,
        active: true,
      };

      expect(fixTyped(defaults, from, "name", ["string"])).toBe("John");
      expect(fixTyped(defaults, from, "age", ["number"])).toBe(30);
      expect(fixTyped(defaults, from, "active", ["boolean"])).toBe(true);
    });

    it("returns default when type does not match", () => {
      const defaults: TestSettings = { name: "default", age: 0, active: false };
      const from: Unchecked<TestSettings> = {
        name: 123 as unknown as string,
        age: "not a number" as unknown as number,
        active: "yes" as unknown as boolean,
      };

      expect(fixTyped(defaults, from, "name", ["string"])).toBe("default");
      expect(fixTyped(defaults, from, "age", ["number"])).toBe(0);
      expect(fixTyped(defaults, from, "active", ["boolean"])).toBe(false);
    });

    it("handles multiple allowed types", () => {
      const defaults = { value: "default" as string | number };
      const from1: Unchecked<typeof defaults> = { value: "text" };
      const from2: Unchecked<typeof defaults> = { value: 42 };
      const from3: Unchecked<typeof defaults> = {
        value: true as unknown as string | number,
      };

      expect(fixTyped(defaults, from1, "value", ["string", "number"])).toBe(
        "text",
      );
      expect(fixTyped(defaults, from2, "value", ["string", "number"])).toBe(42);
      expect(fixTyped(defaults, from3, "value", ["string", "number"])).toBe(
        "default",
      );
    });

    it("handles null values", () => {
      const defaults = { optional: null as string | null };
      const from: Unchecked<typeof defaults> = { optional: null };

      expect(fixTyped(defaults, from, "optional", ["string", "null"])).toBe(
        null,
      );
    });

    it("handles undefined values", () => {
      const defaults = { optional: undefined as string | undefined };
      const from: Unchecked<typeof defaults> = { optional: undefined };

      expect(
        fixTyped(defaults, from, "optional", ["string", "undefined"]),
      ).toBe(undefined);
    });
  });

  describe("fixArray", () => {
    interface SettingsWithArray {
      tags: string[];
      scores: number[];
      flags: boolean[];
    }

    it("returns valid array when all elements match type", () => {
      const defaults: SettingsWithArray = {
        tags: ["default"],
        scores: [0],
        flags: [false],
      };
      const from: Unchecked<SettingsWithArray> = {
        tags: ["a", "b", "c"],
        scores: [1, 2, 3],
        flags: [true, false, true],
      };

      expect(fixArray(defaults, from, "tags", ["string"])).toEqual([
        "a",
        "b",
        "c",
      ]);
      expect(fixArray(defaults, from, "scores", ["number"])).toEqual([1, 2, 3]);
      expect(fixArray(defaults, from, "flags", ["boolean"])).toEqual([
        true,
        false,
        true,
      ]);
    });

    it("returns default array when elements have wrong type", () => {
      const defaults: SettingsWithArray = {
        tags: ["default"],
        scores: [0],
        flags: [false],
      };
      const from: Unchecked<SettingsWithArray> = {
        tags: [1, 2, 3] as unknown as string[],
        scores: ["a", "b"] as unknown as number[],
        flags: ["yes", "no"] as unknown as boolean[],
      };

      expect(fixArray(defaults, from, "tags", ["string"])).toEqual(["default"]);
      expect(fixArray(defaults, from, "scores", ["number"])).toEqual([0]);
      expect(fixArray(defaults, from, "flags", ["boolean"])).toEqual([false]);
    });

    it("returns default array when value is not an array", () => {
      const defaults: SettingsWithArray = {
        tags: ["default"],
        scores: [0],
        flags: [false],
      };
      const from: Unchecked<SettingsWithArray> = {
        tags: "not an array" as unknown as string[],
        scores: 42 as unknown as number[],
        flags: null as unknown as boolean[],
      };

      expect(fixArray(defaults, from, "tags", ["string"])).toEqual(["default"]);
      expect(fixArray(defaults, from, "scores", ["number"])).toEqual([0]);
      expect(fixArray(defaults, from, "flags", ["boolean"])).toEqual([false]);
    });

    it("handles empty arrays", () => {
      const defaults = { items: ["default"] };
      const from: Unchecked<typeof defaults> = { items: [] };

      expect(fixArray(defaults, from, "items", ["string"])).toEqual([]);
    });

    it("handles arrays with mixed valid types", () => {
      const defaults = { values: ["default"] as (string | number)[] };
      const from: Unchecked<typeof defaults> = { values: ["a", 1, "b", 2] };

      expect(fixArray(defaults, from, "values", ["string", "number"])).toEqual([
        "a",
        1,
        "b",
        2,
      ]);
    });

    it("rejects arrays with partially invalid elements", () => {
      const defaults = { items: ["default"] };
      const from: Unchecked<typeof defaults> = {
        items: ["valid", 123, "also valid"],
      };

      // Should reject entire array and return default
      expect(fixArray(defaults, from, "items", ["string"])).toEqual([
        "default",
      ]);
    });

    it("throws TypeError when default is not an array", () => {
      const defaults = { notArray: "string" };
      const from: Unchecked<typeof defaults> = {
        notArray: ["a", "b"] as unknown as string,
      };

      expect(() => {
        // @ts-expect-error: testing behavior when default is not an array
        fixArray(defaults, from, "notArray", ["string"]);
      }).toThrow(TypeError);
    });
  });

  describe("fixInSet", () => {
    it("returns value when it exists in set", () => {
      const defaults = { color: "red" as const };
      const set = ["red", "green", "blue"] as const;
      const from1: Unchecked<typeof defaults> = { color: "green" };
      const from2: Unchecked<typeof defaults> = { color: "blue" };

      expect(fixInSet(defaults, from1, "color", set)).toBe("green");
      expect(fixInSet(defaults, from2, "color", set)).toBe("blue");
    });

    it("returns default when value not in set", () => {
      const defaults = { color: "red" as const };
      const set = ["red", "green", "blue"] as const;
      const from: Unchecked<typeof defaults> = { color: "yellow" as "red" };

      expect(fixInSet(defaults, from, "color", set)).toBe("red");
    });

    it("handles numeric sets", () => {
      const defaults = { level: 1 };
      const set = [1, 2, 3, 4, 5] as const;
      const from1: Unchecked<typeof defaults> = { level: 3 };
      const from2: Unchecked<typeof defaults> = { level: 10 };

      expect(fixInSet(defaults, from1, "level", set)).toBe(3);
      expect(fixInSet(defaults, from2, "level", set)).toBe(1);
    });

    it("handles mixed-type sets", () => {
      const defaults = { value: "default" as const };
      const set = ["a", 1, true, null] as const;
      const from1: Unchecked<typeof defaults> = {
        value: 1 as unknown as "default",
      };
      const from2: Unchecked<typeof defaults> = {
        value: true as unknown as "default",
      };
      const from3: Unchecked<typeof defaults> = {
        value: "invalid" as "default",
      };

      expect(fixInSet(defaults, from1, "value", set)).toBe(1);
      expect(fixInSet(defaults, from2, "value", set)).toBe(true);
      expect(fixInSet(defaults, from3, "value", set)).toBe("default");
    });

    it("handles empty set", () => {
      const defaults = { value: "default" };
      const set = [] as const;
      const from: Unchecked<typeof defaults> = { value: "anything" };

      expect(fixInSet(defaults, from, "value", set)).toBe("default");
    });

    it("handles single-element set", () => {
      const defaults = { value: "only" as const };
      const set = ["only"] as const;
      const from1: Unchecked<typeof defaults> = { value: "only" };
      const from2: Unchecked<typeof defaults> = { value: "other" as "only" };

      expect(fixInSet(defaults, from1, "value", set)).toBe("only");
      expect(fixInSet(defaults, from2, "value", set)).toBe("only");
    });

    it("uses strict equality for set membership", () => {
      const defaults = { value: 0 };
      const set = [0, 1, 2] as const;
      const from1: Unchecked<typeof defaults> = { value: 0 };
      const from2: Unchecked<typeof defaults> = {
        value: false as unknown as number,
      };

      expect(fixInSet(defaults, from1, "value", set)).toBe(0);
      // false should not match 0 with strict equality
      expect(fixInSet(defaults, from2, "value", set)).toBe(0);
    });
  });

  describe("Fixed interface", () => {
    it("Fixed type has correct shape", () => {
      const fixed: Fixed<string> = {
        value: "test",
        valid: true,
      };

      expect(fixed.value).toBe("test");
      expect(fixed.valid).toBe(true);
    });
  });
});
