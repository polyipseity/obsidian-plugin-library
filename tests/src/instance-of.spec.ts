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

  it("recognizes an SVG element of another window", () => {
    const element = foreignWindow().document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    expect(element).not.toBeInstanceOf(SVGElement);
    expect(instanceOf(element, SVGElement)).toBe(true);
    expect(instanceOf(element, Element)).toBe(true);
    expect(instanceOf(element, HTMLElement)).toBe(false);
  });

  it("recognizes the document of another window", () => {
    const { document: foreignDocument } = foreignWindow();
    expect(foreignDocument).not.toBeInstanceOf(Document);
    expect(instanceOf(foreignDocument, Document)).toBe(true);
    expect(instanceOf(foreignDocument, Node)).toBe(true);
    expect(instanceOf(foreignDocument, HTMLElement)).toBe(false);
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

  it("recognizes a node of another window whose document has no window", () => {
    // Stands in for a node that outlived the popout window that created it
    const element = foreignWindow()
      .document.implementation.createHTMLDocument()
      .createElement("div");
    expect(element.ownerDocument.defaultView).toBeNull();
    expect(element).not.toBeInstanceOf(HTMLElement);
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

  it("rejects an object whose prototype only has a `constructor` of that name", () => {
    // The name alone must not be enough
    const pretender: unknown = Object.create(
      { constructor: function Node() {} },
      { ownerDocument: { value: null } },
    );
    expect(instanceOf(pretender, Node)).toBe(false);
  });

  it("accepts an instance of another class of that name with an `ownerDocument` key", () => {
    // The limit of a match by class name
    const lookalike = new (class Node {
      public readonly ownerDocument = null;
    })();
    expect(lookalike).not.toBeInstanceOf(Node);
    expect(instanceOf(lookalike, Node)).toBe(true);
  });

  it("ends the prototype chain step for a Proxy whose chain has no end", () => {
    // The second target also has a `constructor` of that name
    for (const target of [{}, { constructor: function Node() {} }]) {
      // A real chain without end would hang the run, so this one ends late
      const end = 1000;
      let fallback = false,
        steps = 0;
      const endless: object = new Proxy(target, {
        // No prototype for the plain `instanceof` checks, itself in the fallback
        getPrototypeOf: () => (fallback && ++steps <= end ? endless : null),
        has(_target, key): boolean {
          fallback = true;
          return key === "ownerDocument";
        },
      });
      expect(instanceOf(endless, Node)).toBe(false);
      expect(steps).toBeLessThan(end);
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

  it("recognizes a click dispatched in another window and its target", () => {
    const foreign = foreignWindow(),
      button = foreign.document.createElement("button"),
      listener = vi.fn<(event: Event) => void>();
    foreign.document.body.append(button);
    button.addEventListener("click", listener);
    button.click();
    const event = listener.mock.calls[0]?.[0];
    expect(event).not.toBeInstanceOf(UIEvent);
    expect(instanceOf(event, MouseEvent)).toBe(true);
    expect(instanceOf(event, UIEvent)).toBe(true);
    expect(instanceOf(event, KeyboardEvent)).toBe(false);
    expect(event?.target).toBe(button);
    expect(instanceOf(event?.target, HTMLElement)).toBe(true);
    expect(instanceOf(event?.target, Node)).toBe(true);
  });

  it("returns false by design for a UI event of another window without a view", () => {
    const event = new (foreignWindow().MouseEvent)("click");
    expect(event.view).toBeNull();
    expect(instanceOf(event, MouseEvent)).toBe(false);
    expect(instanceOf(event, UIEvent)).toBe(false);
  });

  it("returns false when the owner window cannot be read", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
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
    // One log per value, with the error its getter threw
    expect(debug.mock.calls).toEqual([
      [new Error("ownerDocument")],
      [new Error("defaultView")],
      [new Error("view")],
    ]);
  });

  it("catches a throwing Proxy trap inside the fallback only", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {}),
      trap = (): never => {
        throw new Error("trap");
      };
    // The lookup is the first to reach `has` and `get`
    expect(instanceOf(new Proxy({}, { has: trap }), Node)).toBe(false);
    expect(instanceOf(new Proxy({}, { get: trap }), Node)).toBe(false);
    expect(debug).toHaveBeenCalledTimes(2);
    // The prototype chain step, also in the fallback, asks a prototype for its `constructor`
    const prototype = new Proxy({}, { getOwnPropertyDescriptor: trap });
    expect(
      instanceOf(
        Object.create(prototype, { ownerDocument: { value: null } }),
        Node,
      ),
    ).toBe(false);
    expect(debug).toHaveBeenCalledTimes(3);
    // The plain `instanceof` checks before the lookup reach `getPrototypeOf`
    expect(() =>
      instanceOf(new Proxy({}, { getPrototypeOf: trap }), Node),
    ).toThrow("trap");
    expect(debug).toHaveBeenCalledTimes(3);
  });
});
