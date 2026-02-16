/**
 * Comprehensive tests for src/magic.ts — constants and magic values
 */
import { describe, it, expect } from "vitest";
import {
  ALWAYS_REGEX,
  ALWAYS_REGEX_G,
  DISABLED_TOOLTIP,
  DOUBLE_ACTION_WAIT,
  JSON_STRINGIFY_SPACE,
  NEVER_REGEX,
  NEVER_REGEX_G,
  NOTICE_NO_TIMEOUT,
  SI_PREFIX_SCALE,
  DOMClasses,
  FileExtensions,
  LibraryUUIDs,
} from "../../src/magic.js";

describe("magic.ts — constants and magic values", () => {
  describe("Regex constants", () => {
    it("ALWAYS_REGEX matches everything", () => {
      expect("anything").toMatch(ALWAYS_REGEX);
      expect("").toMatch(ALWAYS_REGEX);
      expect("special chars !@#$%").toMatch(ALWAYS_REGEX);
      expect("unicode 日本語").toMatch(ALWAYS_REGEX);
    });

    it("ALWAYS_REGEX_G matches everything globally", () => {
      const matches = "test string".match(ALWAYS_REGEX_G);
      expect(matches).not.toBeNull();
      expect(matches).length.greaterThan(0);
    });

    it("NEVER_REGEX never matches", () => {
      expect("anything").not.toMatch(NEVER_REGEX);
      expect("").not.toMatch(NEVER_REGEX);
      expect("test").not.toMatch(NEVER_REGEX);
    });

    it("NEVER_REGEX_G never matches globally", () => {
      const matches = "test string".match(NEVER_REGEX_G);
      expect(matches).toBeNull();
    });

    it("ALWAYS_REGEX uses unicode flag", () => {
      expect(ALWAYS_REGEX.flags).toContain("u");
    });

    it("NEVER_REGEX uses unicode flag", () => {
      expect(NEVER_REGEX.flags).toContain("u");
    });

    it("ALWAYS_REGEX_G uses global and unicode flags", () => {
      expect(ALWAYS_REGEX_G.flags).toContain("g");
      expect(ALWAYS_REGEX_G.flags).toContain("u");
    });

    it("NEVER_REGEX_G uses global and unicode flags", () => {
      expect(NEVER_REGEX_G.flags).toContain("g");
      expect(NEVER_REGEX_G.flags).toContain("u");
    });
  });

  describe("String constants", () => {
    it("DISABLED_TOOLTIP is empty string", () => {
      expect(DISABLED_TOOLTIP).toBe("");
      expect(DISABLED_TOOLTIP.length).toBe(0);
    });

    it("JSON_STRINGIFY_SPACE is tab character", () => {
      expect(JSON_STRINGIFY_SPACE).toBe("\t");
      const json = JSON.stringify({ a: 1 }, null, JSON_STRINGIFY_SPACE);
      expect(json).toContain("\t");
    });
  });

  describe("Number constants", () => {
    it("DOUBLE_ACTION_WAIT is 2 seconds", () => {
      expect(DOUBLE_ACTION_WAIT).toBe(2);
      expect(typeof DOUBLE_ACTION_WAIT).toBe("number");
    });

    it("NOTICE_NO_TIMEOUT is 0", () => {
      expect(NOTICE_NO_TIMEOUT).toBe(0);
      expect(typeof NOTICE_NO_TIMEOUT).toBe("number");
    });

    it("SI_PREFIX_SCALE is 1000", () => {
      expect(SI_PREFIX_SCALE).toBe(1000);
      expect(typeof SI_PREFIX_SCALE).toBe("number");
    });

    it("SI_PREFIX_SCALE converts seconds to milliseconds", () => {
      const seconds = 1;
      const milliseconds = seconds * SI_PREFIX_SCALE;
      expect(milliseconds).toBe(1000);
    });
  });

  describe("DOMClasses namespace", () => {
    it("exports markdown-related classes", () => {
      expect(DOMClasses.MARKDOWN_PREVIEW_VIEW).toBe("markdown-preview-view");
      expect(DOMClasses.MARKDOWN_PREVIEW_SECTION).toBe(
        "markdown-preview-section",
      );
      expect(DOMClasses.MARKDOWN_PREVIEW_SIZER).toBe("markdown-preview-sizer");
      expect(DOMClasses.MARKDOWN_RENDERED).toBe("markdown-rendered");
    });

    it("exports modal-related classes", () => {
      expect(DOMClasses.MODAL).toBe("modal");
      expect(DOMClasses.MODAL_CLOSE_BUTTON).toBe("modal-close-button");
    });

    it("exports tab-related classes", () => {
      expect(DOMClasses.VERTICAL_TAB_CONTENT).toBe("vertical-tab-content");
      expect(DOMClasses.VERTICAL_TAB_CONTENT_CONTAINER).toBe(
        "vertical-tab-content-container",
      );
    });

    it("exports folding classes", () => {
      expect(DOMClasses.ALLOW_FOLD_HEADINGS).toBe("allow-fold-headings");
      expect(DOMClasses.ALLOW_FOLD_LISTS).toBe("allow-fold-lists");
    });

    it("exports readable line width class", () => {
      expect(DOMClasses.IS_READABLE_LINE_WIDTH).toBe("is-readable-line-width");
    });

    it("exports status bar class", () => {
      expect(DOMClasses.STATUS_BAR).toBe("status-bar");
    });

    it("exports setting item class", () => {
      expect(DOMClasses.SETTING_ITEM).toBe("setting-item");
    });

    it("exports mod warning class", () => {
      expect(DOMClasses.MOD_WARNING).toBe("mod-warning");
    });

    it("exports node insert event class", () => {
      expect(DOMClasses.NODE_INSERT_EVENT).toBe("node-insert-event");
    });

    it("exports indentation guide class", () => {
      expect(DOMClasses.SHOW_INDENTATION_GUIDE).toBe("show-indentation-guide");
    });

    it("all class names are strings", () => {
      const classes = Object.values(DOMClasses);
      classes.forEach((className) => {
        expect(typeof className).toBe("string");
        expect(className.length).toBeGreaterThan(0);
      });
    });
  });

  describe("FileExtensions namespace", () => {
    it("MARKDOWN extension is 'md'", () => {
      expect(FileExtensions.MARKDOWN).toBe("md");
    });

    it("MARKDOWN extension is lowercase", () => {
      expect(FileExtensions.MARKDOWN).toBe(
        FileExtensions.MARKDOWN.toLowerCase(),
      );
    });

    it("MARKDOWN extension does not include dot", () => {
      expect(FileExtensions.MARKDOWN.startsWith(".")).toBe(false);
    });
  });

  describe("LibraryUUIDs namespace", () => {
    it("exports UUID0", () => {
      expect(LibraryUUIDs.UUID0).toBe("2af98ef6-0537-4fd3-a1e1-269517bca44d");
    });

    it("exports UUID1", () => {
      expect(LibraryUUIDs.UUID1).toBe("fec54e0c-8342-4418-bc4b-57ea4d92c3d4");
    });

    it("exports UUID2", () => {
      expect(LibraryUUIDs.UUID2).toBe("387823d1-e81d-4ed2-8148-4023aeae81a6");
    });

    it("exports UUID3", () => {
      expect(LibraryUUIDs.UUID3).toBe("c4ba1170-c0b7-4fde-a4a5-047c74ea5298");
    });

    it("all UUIDs are valid UUID format", () => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(LibraryUUIDs.UUID0).toMatch(uuidRegex);
      expect(LibraryUUIDs.UUID1).toMatch(uuidRegex);
      expect(LibraryUUIDs.UUID2).toMatch(uuidRegex);
      expect(LibraryUUIDs.UUID3).toMatch(uuidRegex);
    });

    it("all UUIDs are unique", () => {
      const uuids = [
        LibraryUUIDs.UUID0,
        LibraryUUIDs.UUID1,
        LibraryUUIDs.UUID2,
        LibraryUUIDs.UUID3,
      ];
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(uuids.length);
    });

    it("all UUIDs are lowercase", () => {
      expect(LibraryUUIDs.UUID0).toBe(LibraryUUIDs.UUID0.toLowerCase());
      expect(LibraryUUIDs.UUID1).toBe(LibraryUUIDs.UUID1.toLowerCase());
      expect(LibraryUUIDs.UUID2).toBe(LibraryUUIDs.UUID2.toLowerCase());
      expect(LibraryUUIDs.UUID3).toBe(LibraryUUIDs.UUID3.toLowerCase());
    });
  });

  describe("Constants usage examples", () => {
    it("JSON_STRINGIFY_SPACE for pretty printing", () => {
      const obj = { nested: { value: 42 } };
      const json = JSON.stringify(obj, null, JSON_STRINGIFY_SPACE);
      expect(json).toContain("\t");
      expect(json.split("\n").length).toBeGreaterThan(1);
    });

    it("SI_PREFIX_SCALE for time conversions", () => {
      const timeoutInSeconds = 5;
      const timeoutInMs = timeoutInSeconds * SI_PREFIX_SCALE;
      expect(timeoutInMs).toBe(5000);
    });

    it("NEVER_REGEX for filtering", () => {
      const items = ["item1", "item2", "item3"];
      const filtered = items.filter((item) => NEVER_REGEX.test(item));
      expect(filtered).toEqual([]);
    });

    it("ALWAYS_REGEX for matching", () => {
      const items = ["item1", "item2", "item3"];
      const filtered = items.filter((item) => ALWAYS_REGEX.test(item));
      expect(filtered).toEqual(items);
    });
  });
});
