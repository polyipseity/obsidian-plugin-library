// @vitest-environment jsdom
/**
 * Tests for the sanitized innerHTML utilities in src/utils.ts
 *
 * jsdom overrides the default happy-dom environment (see vitest.config.mts)
 * because happy-dom does not implement the DOM semantics that DOMPurify relies
 * on for sanitization: script tags, event handler attributes, and dangerous
 * URL schemes survive happy-dom's parsing, so these tests would not exercise
 * any real sanitization there. jsdom matches browser behavior, letting the
 * tests assert that DOMPurify actually strips the unsafe content.
 */
import { describe, expect, it } from "vitest";
import {
  createChildElement,
  sanitizeHTML,
  setSanitizedInnerHTML,
} from "../../src/utils.js";

describe("sanitizeHTML", () => {
  it("strips scripts, event handlers, and dangerous URLs", () => {
    const html = `<b>bold</b><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">js</a><a href="https://obsidian.md">ok</a><iframe src="x"></iframe>`;
    const clean = sanitizeHTML(window, html);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("<iframe");
  });

  it("preserves benign markup and safe links", () => {
    expect(
      sanitizeHTML(window, '<b>bold</b><a href="https://obsidian.md">ok</a>'),
    ).toBe('<b>bold</b><a href="https://obsidian.md">ok</a>');
  });

  it("applies DOMPurify configuration", () => {
    expect(
      sanitizeHTML(window, "<b>bold</b><i>it</i>", {
        ALLOWED_TAGS: ["b"],
      }),
    ).toBe("<b>bold</b>it");
  });
});

describe("setSanitizedInnerHTML", () => {
  it("replaces the element's content with sanitized HTML", () => {
    const element = document.createElement("span");
    setSanitizedInnerHTML(
      element,
      "<b>bold</b><script>alert(1)</script><img src=x onerror=alert(1)>",
    );
    expect(element.querySelector("script")).toBeNull();
    expect(element.querySelector("[onerror]")).toBeNull();
    expect(element.querySelector("b")?.textContent).toBe("bold");
  });

  it("strips dangerous URL schemes", () => {
    const element = document.createElement("span");
    setSanitizedInnerHTML(
      element,
      '<a href="javascript:alert(1)">js</a><a href="https://obsidian.md">ok</a><a href="data:text/html,x">data</a>',
    );
    const links = [...element.querySelectorAll("a")];
    expect(links.map((link) => link.textContent)).toEqual(["js", "ok", "data"]);
    expect(
      links.some((link) =>
        link.getAttribute("href")?.startsWith("javascript:"),
      ),
    ).toBe(false);
    expect(
      links.some((link) => link.getAttribute("href")?.startsWith("data:")),
    ).toBe(false);
    expect(
      element.querySelector('a[href="https://obsidian.md"]'),
    ).not.toBeNull();
  });

  it("applies DOMPurify configuration", () => {
    const element = document.createElement("span");
    setSanitizedInnerHTML(element, "<b>bold</b><i>it</i>", {
      ALLOWED_TAGS: ["b"],
    });
    expect(element.querySelector("b")?.textContent).toBe("bold");
    expect(element.querySelector("i")).toBeNull();
    expect(element.textContent).toBe("boldit");
  });

  it("clears the element when given empty HTML", () => {
    const element = document.createElement("span");
    element.textContent = "Before";
    setSanitizedInnerHTML(element, "");
    expect(element.childNodes.length).toBe(0);
  });

  it("returns the element for chaining", () => {
    const element = document.createElement("span");
    expect(setSanitizedInnerHTML(element, "<b>bold</b>")).toBe(element);
  });

  it("works with non-HTML elements", () => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    setSanitizedInnerHTML(element, "<b>bold</b>");
    expect(element.querySelector("b")?.textContent).toBe("bold");
  });

  it("works inside a createChildElement callback", () => {
    const frag = document.createDocumentFragment();
    createChildElement(frag, "span", (ele) => {
      setSanitizedInnerHTML(
        ele,
        "<b>hi</b><script>alert(1)</script><img src=x onerror=alert(1)>",
      );
    });
    const span = frag.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.querySelector("script")).toBeNull();
    expect(span?.querySelector("[onerror]")).toBeNull();
    expect(span?.querySelector("b")?.textContent).toBe("hi");
  });
});
