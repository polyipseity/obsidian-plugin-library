import { describe, it, expect } from "vitest";
import { FindComponent } from "../../../src/components";
import type { FindComponent$ } from "../../../src/components";

// The public index exports a named value `FindComponent` and a namespace
// `FindComponent$` containing the raw module (types, constants, helpers).

// alias a couple of type members to keep the assertions succinct.
type Params = FindComponent$.Params;
type Direction = FindComponent$.Direction;

describe("FindComponent exports", () => {
  it("provides a runtime component value", () => {
    expect(FindComponent).toBeDefined();
    // Under Vitest the `.svelte` file is an asset, so the export becomes a
    // string path. our interest here is not the exact runtime shape; just that
    // the named export exists.
    const t = typeof FindComponent;
    expect(t === "function" || t === "string").toBe(true);
  });

  it("exports usable interfaces", () => {
    const params: Params = {
      caseSensitive: false,
      findText: "",
      regex: false,
      wholeWord: false,
    };
    const direction: Direction = "next";

    expect(params.findText).toBe("");
    expect(direction).toBe("next");
  });
});
