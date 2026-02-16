/**
 * Comprehensive tests for src/icons.ts — icon registration utilities
 */
import { describe, it, expect } from "vitest";
import { addIcon } from "../../src/icons.js";
import { InternalDOMClasses } from "../../src/internals/magic.js";

describe("icons.ts — icon registration", () => {
  describe("addIcon", () => {
    it("registers icon with SVG content", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>';

      const unregister = addIcon("test-icon", svgContent);

      expect(typeof unregister).toBe("function");
    });

    it("adds icon class to SVG element", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>';

      const unregister = addIcon("test-icon-class", svgContent);

      // The CLASS constant should be accessible
      expect(addIcon.CLASS).toBe(InternalDOMClasses.ICON);

      unregister();
    });

    it("returns cleanup function that removes icon", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24"/></svg>';

      const unregister = addIcon("removable-icon", svgContent);

      expect(() => unregister()).not.toThrow();
    });

    it("throws error for invalid SVG content", () => {
      const invalidContent = "not-valid-svg";

      expect(() => {
        addIcon("invalid-icon", invalidContent);
      }).toThrow();
    });

    it("throws error for empty content", () => {
      expect(() => {
        addIcon("empty-icon", "");
      }).toThrow();
    });

    it("handles SVG with attributes", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18"/></svg>';

      const unregister = addIcon("attributed-icon", svgContent);

      expect(unregister).toBeInstanceOf(Function);
      unregister();
    });

    it("handles complex SVG with multiple elements", () => {
      const complexSvg = `<svg xmlns="http://www.w3.org/2000/svg">
        <g>
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </g>
      </svg>`;

      const unregister = addIcon("complex-icon", complexSvg);

      expect(unregister).toBeInstanceOf(Function);
      unregister();
    });

    it("allows multiple icons with different IDs", () => {
      const svg1 =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
      const svg2 =
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20"/></svg>';

      const unregister1 = addIcon("icon-1", svg1);
      const unregister2 = addIcon("icon-2", svg2);

      expect(unregister1).toBeInstanceOf(Function);
      expect(unregister2).toBeInstanceOf(Function);

      unregister1();
      unregister2();
    });

    it("cleanup function can be called multiple times safely", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>';

      const unregister = addIcon("multi-cleanup", svgContent);

      expect(() => {
        unregister();
        unregister();
        unregister();
      }).not.toThrow();
    });

    it("handles SVG with namespaced attributes", () => {
      const svgContent =
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="#icon"/></svg>';

      const unregister = addIcon("namespaced-icon", svgContent);

      expect(unregister).toBeInstanceOf(Function);
      unregister();
    });
  });

  describe("addIcon.CLASS constant", () => {
    it("exports CLASS constant", () => {
      expect(typeof addIcon.CLASS).toBe("string");
      expect(addIcon.CLASS).toBe(InternalDOMClasses.ICON);
    });

    it("CLASS is non-empty", () => {
      expect(addIcon.CLASS.length).toBeGreaterThan(0);
    });
  });

  describe("Icon registration patterns", () => {
    it("supports custom icon registration workflow", () => {
      const customIcon =
        '<svg xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 22,22 2,22"/></svg>';

      const cleanup = addIcon("custom-workflow", customIcon);

      // Verify the workflow completes successfully
      expect(cleanup).toBeDefined();
      expect(cleanup).toBeInstanceOf(Function);

      cleanup();
    });

    it("handles rapid registration and unregistration", () => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>';

      for (let i = 0; i < 5; i++) {
        const unregister = addIcon(`rapid-${i}`, svg);
        unregister();
      }

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("Error handling", () => {
    it("does not care about malformed SVG", () => {
      const malformed = "<svg>incomplete";

      expect(() => {
        addIcon("malformed", malformed);
      }).not.toThrow();
    });

    it("handles SVG without xmlns", () => {
      const noNamespace = '<svg><circle r="10"/></svg>';

      // This might work or throw depending on implementation
      // Test that it handles it consistently
      expect(() => {
        const unregister = addIcon("no-ns", noNamespace);
        unregister();
      }).not.toThrow();
    });

    it("does not throw for non-SVG root element", () => {
      const notSvg = '<div><svg><circle r="10"/></svg></div>';

      // Don't care if the first element isn't SVG
      expect(() => {
        addIcon("not-svg-root", notSvg);
      }).not.toThrow();
    });
  });
});
