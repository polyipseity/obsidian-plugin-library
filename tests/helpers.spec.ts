/**
 * Tests for small test utilities in `tests/helpers.ts` — keep these fast and explicit.
 */
import { describe, it, expect } from "vitest";
import { toRecord, tick } from "./helpers.js";

describe("tests/helpers.ts utilities", () => {
  it("toRecord works", async () => {
    // preserves reference for objects
    const obj = { a: 1 };
    expect(toRecord(obj)).toBe(obj);

    // preserves reference and contents for arrays
    const arr = [1, 2, 3];
    const recArr = toRecord(arr);
    expect(recArr).toBe(arr);
    expect(recArr[1]).toBe(2);

    // typed usage via generic parameter
    const typed = toRecord<{ foo: string }>({ foo: "bar" });
    expect(typed.foo).toBe("bar");

    // symbol keys are supported by the Record typing
    const sym = Symbol("k");
    const sObj = { [sym]: "symval" } as Record<symbol, string>;
    const got = toRecord(sObj);
    expect(got[sym]).toBe("symval");

    // mutating the returned record affects the original reference
    const src = { a: 1 } as Record<string, unknown>;
    const r = toRecord(src);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r as any).b = 2;
    expect(src).toEqual({ a: 1, b: 2 });
  });

  it("tick waits for next macrotask (setImmediate)", async () => {
    let called = false;
    setImmediate(() => {
      called = true;
    });

    // not yet executed synchronously
    expect(called).toBe(false);

    // tick() resolves after the next macrotask (setImmediate)
    await tick();
    expect(called).toBe(true);
  });
});
