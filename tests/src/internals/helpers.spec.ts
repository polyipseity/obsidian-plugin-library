import { describe, expect, it } from "vitest";
import {
  constant,
  isEmpty,
  isObject,
  range,
} from "../../../src/internals/helpers.js";

describe("constant", () => {
  it("returns a function that always returns the given value", () => {
    const value = { a: 1 };
    expect(constant(value)()).toBe(value);
  });

  it("returns distinct closures for distinct values", () => {
    expect(constant(1)()).toBe(1);
    expect(constant(2)()).toBe(2);
  });
});

describe("isEmpty", () => {
  it("returns true for nullish values", () => {
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(null)).toBe(true);
  });

  it("checks strings and arrays by length", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("abc")).toBe(false);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty([1])).toBe(false);
  });

  it("checks Map and Set by size", () => {
    expect(isEmpty(new Map())).toBe(true);
    expect(isEmpty(new Map([[1, 2]]))).toBe(false);
    expect(isEmpty(new Set())).toBe(true);
    expect(isEmpty(new Set([1]))).toBe(false);
  });

  it("checks objects by own enumerable keys", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it("returns true for other values", () => {
    expect(isEmpty(42)).toBe(true);
    expect(isEmpty(new Date())).toBe(true);
    expect(isEmpty((): void => undefined)).toBe(true);
  });
});

describe("isObject", () => {
  it("returns true for objects, arrays, and functions", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
    expect(isObject((): void => undefined)).toBe(true);
  });

  it("returns false for non-objects", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject("str")).toBe(false);
    expect(isObject(42)).toBe(false);
  });
});

describe("range", () => {
  it("defaults to starting at 0", () => {
    expect(range(5)).toEqual([0, 1, 2, 3, 4]);
    expect(range(0)).toEqual([]);
    expect(range(-4)).toEqual([0, -1, -2, -3]);
  });

  it("ranges from start up to but not including end", () => {
    expect(range(2, 5)).toEqual([2, 3, 4]);
  });

  it("defaults to a negative step when start exceeds end", () => {
    expect(range(5, 2)).toEqual([5, 4, 3]);
  });

  it("honors an explicit step", () => {
    expect(range(1, 10, 3)).toEqual([1, 4, 7]);
    expect(range(0, -4, -1)).toEqual([0, -1, -2, -3]);
  });

  it("keeps a zero step producing repeated values", () => {
    expect(range(1, 4, 0)).toEqual([1, 1, 1]);
  });
});
