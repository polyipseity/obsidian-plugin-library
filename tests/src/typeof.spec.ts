/**
 * Comprehensive tests for src/typeof.ts — type guards and typeof utilities
 */
import { describe, it, expect } from "vitest";
import {
  PRIMITIVE_TYPES,
  PRIMITIVE_TYPES_E,
  genericTypeofGuard,
  genericTypeofGuardE,
  primitiveOf,
  primitiveOfE,
  typeofE,
  type PrimitiveType,
  type PrimitiveTypeE,
} from "../../src/typeof.js";

describe("typeof.ts — type guards and utilities", () => {
  describe("PRIMITIVE_TYPES constant", () => {
    it("contains all standard JavaScript primitive types", () => {
      expect(PRIMITIVE_TYPES).toEqual([
        "string",
        "number",
        "bigint",
        "boolean",
        "symbol",
        "undefined",
        "function",
        "object",
      ]);
    });

    it("is frozen (immutable)", () => {
      expect(Object.isFrozen(PRIMITIVE_TYPES)).toBe(true);
    });
  });

  describe("PRIMITIVE_TYPES_E constant", () => {
    it("extends PRIMITIVE_TYPES with null", () => {
      expect(PRIMITIVE_TYPES_E).toEqual([
        "string",
        "number",
        "bigint",
        "boolean",
        "symbol",
        "undefined",
        "function",
        "object",
        "null",
      ]);
    });

    it("is frozen (immutable)", () => {
      expect(Object.isFrozen(PRIMITIVE_TYPES_E)).toBe(true);
    });
  });

  describe("genericTypeofGuard", () => {
    it("guards string type correctly", () => {
      const value: unknown = "hello";
      expect(genericTypeofGuard(["string"], value)).toBe(true);
      if (genericTypeofGuard(["string"], value)) {
        // Type assertion check: value should be string
        const _typeCheck: string = value;
        expect(typeof _typeCheck).toBe("string");
      }
    });

    it("guards number type correctly", () => {
      const value: unknown = 42;
      expect(genericTypeofGuard(["number"], value)).toBe(true);
      expect(genericTypeofGuard(["number"], NaN)).toBe(true);
      expect(genericTypeofGuard(["number"], Infinity)).toBe(true);
    });

    it("guards bigint type correctly", () => {
      const value: unknown = BigInt(123);
      expect(genericTypeofGuard(["bigint"], value)).toBe(true);
    });

    it("guards boolean type correctly", () => {
      expect(genericTypeofGuard(["boolean"], true)).toBe(true);
      expect(genericTypeofGuard(["boolean"], false)).toBe(true);
    });

    it("guards symbol type correctly", () => {
      const value: unknown = Symbol("test");
      expect(genericTypeofGuard(["symbol"], value)).toBe(true);
    });

    it("guards undefined type correctly", () => {
      const value: unknown = undefined;
      expect(genericTypeofGuard(["undefined"], value)).toBe(true);
    });

    it("guards function type correctly", () => {
      const value: unknown = (): void => {};
      expect(genericTypeofGuard(["function"], value)).toBe(true);
      expect(genericTypeofGuard(["function"], function named() {})).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-extraneous-class
      expect(genericTypeofGuard(["function"], class Test {})).toBe(true);
    });

    it("guards object type correctly", () => {
      expect(genericTypeofGuard(["object"], {})).toBe(true);
      expect(genericTypeofGuard(["object"], [])).toBe(true);
      expect(genericTypeofGuard(["object"], null)).toBe(true);
      expect(genericTypeofGuard(["object"], new Date())).toBe(true);
    });

    it("guards multiple types with union", () => {
      const types: PrimitiveType[] = ["string", "number"];
      expect(genericTypeofGuard(types, "hello")).toBe(true);
      expect(genericTypeofGuard(types, 42)).toBe(true);
      expect(genericTypeofGuard(types, true)).toBe(false);
      expect(genericTypeofGuard(types, null)).toBe(false);
    });

    it("returns false for non-matching types", () => {
      expect(genericTypeofGuard(["string"], 42)).toBe(false);
      expect(genericTypeofGuard(["number"], "42")).toBe(false);
      expect(genericTypeofGuard(["boolean"], "true")).toBe(false);
    });

    it("handles empty type array", () => {
      expect(genericTypeofGuard([], "anything")).toBe(false);
      expect(genericTypeofGuard([], null)).toBe(false);
    });
  });

  describe("primitiveOf", () => {
    it("preserves string values", () => {
      const result = primitiveOf("test");
      expect(result).toBe("test");
      expect(typeof result).toBe("string");
    });

    it("preserves number values", () => {
      const result = primitiveOf(123);
      expect(result).toBe(123);
      expect(typeof result).toBe("number");
    });

    it("preserves boolean values", () => {
      const result = primitiveOf(true);
      expect(result).toBe(true);
      expect(typeof result).toBe("boolean");
    });

    it("preserves object references", () => {
      const obj = { key: "value" };
      const result = primitiveOf(obj);
      expect(result).toBe(obj);
    });

    it("preserves null", () => {
      const result = primitiveOf(null);
      expect(result).toBe(null);
    });
  });

  describe("typeofE", () => {
    it("returns 'null' for null values", () => {
      expect(typeofE(null)).toBe("null");
    });

    it("returns standard typeof for non-null values", () => {
      expect(typeofE("string")).toBe("string");
      expect(typeofE(42)).toBe("number");
      expect(typeofE(true)).toBe("boolean");
      expect(typeofE(undefined)).toBe("undefined");
      expect(typeofE(Symbol("s"))).toBe("symbol");
      expect(typeofE(BigInt(1))).toBe("bigint");
      expect(typeofE({})).toBe("object");
      expect(typeofE([])).toBe("object");
      expect(typeofE(() => {})).toBe("function");
    });
  });

  describe("genericTypeofGuardE", () => {
    it("guards null explicitly", () => {
      const value: unknown = null;
      expect(genericTypeofGuardE(["null"], value)).toBe(true);
      if (genericTypeofGuardE(["null"], value)) {
        // Type assertion check: value should be null
        const _typeCheck: null = value;
        expect(_typeCheck).toBe(null);
      }
    });

    it("distinguishes null from object", () => {
      expect(genericTypeofGuardE(["object"], null)).toBe(false);
      expect(genericTypeofGuardE(["null"], null)).toBe(true);
      expect(genericTypeofGuardE(["object"], {})).toBe(true);
    });

    it("guards string type correctly", () => {
      expect(genericTypeofGuardE(["string"], "test")).toBe(true);
      expect(genericTypeofGuardE(["string"], 123)).toBe(false);
    });

    it("guards multiple types including null", () => {
      const types: PrimitiveTypeE[] = ["string", "null"];
      expect(genericTypeofGuardE(types, "hello")).toBe(true);
      expect(genericTypeofGuardE(types, null)).toBe(true);
      expect(genericTypeofGuardE(types, 42)).toBe(false);
      expect(genericTypeofGuardE(types, undefined)).toBe(false);
    });

    it("handles all extended primitive types", () => {
      expect(genericTypeofGuardE(["string"], "str")).toBe(true);
      expect(genericTypeofGuardE(["number"], 42)).toBe(true);
      expect(genericTypeofGuardE(["bigint"], BigInt(10))).toBe(true);
      expect(genericTypeofGuardE(["boolean"], false)).toBe(true);
      expect(genericTypeofGuardE(["symbol"], Symbol())).toBe(true);
      expect(genericTypeofGuardE(["undefined"], undefined)).toBe(true);
      expect(genericTypeofGuardE(["function"], () => {})).toBe(true);
      expect(genericTypeofGuardE(["object"], {})).toBe(true);
      expect(genericTypeofGuardE(["null"], null)).toBe(true);
    });

    it("returns false for empty type array", () => {
      expect(genericTypeofGuardE([], "anything")).toBe(false);
      expect(genericTypeofGuardE([], null)).toBe(false);
    });
  });

  describe("primitiveOfE", () => {
    it("preserves all primitive values", () => {
      expect(primitiveOfE("string")).toBe("string");
      expect(primitiveOfE(123)).toBe(123);
      expect(primitiveOfE(true)).toBe(true);
      expect(primitiveOfE(null)).toBe(null);
      expect(primitiveOfE(undefined)).toBe(undefined);
    });

    it("preserves object and array references", () => {
      const obj = { a: 1 };
      expect(primitiveOfE(obj)).toBe(obj);

      const arr = [1, 2, 3];
      expect(primitiveOfE(arr)).toBe(arr);
    });

    it("preserves function references", () => {
      const fn = (): number => 42;
      expect(primitiveOfE(fn)).toBe(fn);
    });

    it("preserves symbol values", () => {
      const sym = Symbol("test");
      expect(primitiveOfE(sym)).toBe(sym);
    });

    it("preserves bigint values", () => {
      const big = BigInt(9007199254740991);
      expect(primitiveOfE(big)).toBe(big);
    });
  });
});
