// @vitest-environment jsdom
/**
 * Tests for `instanceOf` in src/utils.ts
 *
 * jsdom overrides the default happy-dom environment (see vitest.config.mts)
 * because happy-dom cannot produce a value from another realm: all of its
 * windows, iframes included, share one set of DOM classes, and its
 * `UIEvent.view` is an own property. jsdom gives each window its own DOM
 * classes and keeps `Document.defaultView` and `UIEvent.view` as inherited
 * accessors, as browsers do. An iframe's window then stands in for an Obsidian
 * popout window.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { correctType } from "../../src/types.js";
import { instanceOf } from "../../src/utils.js";

function foreignWindow(): typeof window {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);
  const { contentWindow } = iframe;
  if (contentWindow === null) {
    throw new Error("iframe has no window");
  }
  return correctType(contentWindow);
}

describe("instanceOf", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("rejects values that are not DOM objects", () => {
    for (const value of [null, undefined, 0, "div", true, {}, []]) {
      expect(instanceOf(value, Node)).toBe(false);
    }
  });

  it("recognizes a node of this window", () => {
    const element = document.createElement("div");
    expect(instanceOf(element, HTMLElement)).toBe(true);
    expect(instanceOf(element, Node)).toBe(true);
    expect(instanceOf(element, HTMLInputElement)).toBe(false);
  });

  it("recognizes a UI event of this window", () => {
    const event = new MouseEvent("click");
    expect(instanceOf(event, MouseEvent)).toBe(true);
    expect(instanceOf(event, UIEvent)).toBe(true);
    expect(instanceOf(event, KeyboardEvent)).toBe(false);
  });

  it("recognizes a node of another window", () => {
    const element = foreignWindow().document.createElement("div");
    expect(element).not.toBeInstanceOf(HTMLElement);
    expect(instanceOf(element, HTMLElement)).toBe(true);
    expect(instanceOf(element, Node)).toBe(true);
    expect(instanceOf(element, HTMLInputElement)).toBe(false);
  });

  it("recognizes a node of another window after it moved to this window", () => {
    const element = foreignWindow().document.createElement("textarea");
    document.body.append(element);
    expect(element.ownerDocument).toBe(document);
    expect(element).not.toBeInstanceOf(HTMLElement);
    expect(instanceOf(element, HTMLElement)).toBe(true);
    expect(instanceOf(element, Node)).toBe(true);
    expect(instanceOf(element, HTMLInputElement)).toBe(false);
  });

  it("recognizes a node that moved from one other window to another", () => {
    const element = foreignWindow().document.createElement("div"),
      destination = foreignWindow();
    destination.document.body.append(element);
    expect(element.ownerDocument).toBe(destination.document);
    expect(element).not.toBeInstanceOf(destination.HTMLElement);
    expect(instanceOf(element, HTMLElement)).toBe(true);
    expect(instanceOf(element, Node)).toBe(true);
    expect(instanceOf(element, HTMLInputElement)).toBe(false);
  });

  it("rejects a plain object that only has an `ownerDocument` key", () => {
    for (const ownerDocument of [null, document, foreignWindow().document]) {
      const pretender = { ownerDocument };
      expect(instanceOf(pretender, Node)).toBe(false);
      expect(instanceOf(pretender, HTMLElement)).toBe(false);
    }
  });

  it("recognizes a UI event of another window", () => {
    const foreign = foreignWindow(),
      event = new foreign.MouseEvent("click", { view: foreign });
    expect(event).not.toBeInstanceOf(UIEvent);
    expect(instanceOf(event, MouseEvent)).toBe(true);
    expect(instanceOf(event, UIEvent)).toBe(true);
    expect(instanceOf(event, KeyboardEvent)).toBe(false);
  });

  it("returns false when the owner window cannot be read", () => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    const hostile: readonly object[] = [
      {
        get ownerDocument(): never {
          throw new Error("ownerDocument");
        },
      },
      {
        ownerDocument: {
          get defaultView(): never {
            throw new Error("defaultView");
          },
        },
      },
      {
        get view(): never {
          throw new Error("view");
        },
      },
    ];
    for (const value of hostile) {
      expect(instanceOf(value, HTMLElement)).toBe(false);
    }
  });
});
