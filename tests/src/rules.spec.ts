/**
 * Comprehensive tests for src/rules.ts — rule parsing and testing
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  Rules,
  type Rule,
  type NormalRule,
  type ErrorRule,
} from "../../src/rules.js";

describe("rules.ts — rule parsing and testing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rules.parse", () => {
    it("parses inclusion rule with + prefix", () => {
      const rules = Rules.parse(["+test"]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "+");
    });

    it("parses exclusion rule with - prefix", () => {
      const rules = Rules.parse(["-exclude"]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "-");
    });

    it("defaults to inclusion when no prefix", () => {
      const rules = Rules.parse(["noprefix"]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "+");
    });

    it("parses regex patterns with slashes", () => {
      const rules = Rules.parse(["/test.*/i"]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "+");
      expect(rules[0]).toHaveProperty("value.source", "test.*");
      expect(rules[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("i"),
      );
    });

    it("parses regex with multiple flags", () => {
      const rules = Rules.parse(["/pattern/gim"]);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("g"),
      );
      expect(rules[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("i"),
      );
      expect(rules[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("m"),
      );
    });

    it("handles regex with escaped slashes", () => {
      const rules = Rules.parse(["/path\\/to\\/file/u"]);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("value.source", "path\\/to\\/file");
    });

    it("creates error rule for invalid regex", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const rules = Rules.parse(["/[unclosed/u"]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "error");
      expect(rules[0]).toHaveProperty("value");

      expect(debugSpy).toHaveBeenCalled();
    });

    it("escapes literal strings by default", () => {
      const rules = Rules.parse(["test.txt"]);
      expect(Rules.test(rules, "test.txt")).toBe(true);
      expect(Rules.test(rules, "testXtxt")).toBe(false);
    });

    it("uses custom interpreter when provided", () => {
      const customInterpreter = vi.fn(
        (str: string) => new RegExp(`custom-${str}`),
      );
      const rules = Rules.parse(["input"], customInterpreter);

      expect(customInterpreter).toHaveBeenCalledWith("input");
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("value.source", "custom-input");
    });

    it("applies interpreter to non-regex patterns", () => {
      const interpreter = (str: string) => new RegExp(`^${str}$`);
      const rules = Rules.parse(["exact"], interpreter);

      expect(Rules.test(rules, "exact")).toBe(true);
      expect(Rules.test(rules, "exact-more")).toBe(false);
    });

    it("does not apply interpreter to regex patterns", () => {
      const interpreter = vi.fn(() => new RegExp("fallback"));
      const rules = Rules.parse(["/pattern/u"], interpreter);

      expect(interpreter).not.toHaveBeenCalled();
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("value.source", "pattern");
    });

    it("parses multiple rules", () => {
      const rules = Rules.parse([
        "+include",
        "-exclude",
        "default",
        "/regex/i",
      ]);
      expect(rules).toHaveLength(4);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "+");
      expect(rules[1]).toBeDefined();
      expect(rules[1]).toHaveProperty("type", "-");
      expect(rules[2]).toBeDefined();
      expect(rules[2]).toHaveProperty("type", "+");
      expect(rules[3]).toBeDefined();
      expect(rules[3]).toHaveProperty("type", "+");
    });

    it("handles empty string patterns", () => {
      const rules = Rules.parse([""]);
      expect(rules).toHaveLength(1);
      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "+");
    });

    it("handles whitespace patterns", () => {
      const rules = Rules.parse(["   "]);
      expect(rules).toHaveLength(1);
      expect(Rules.test(rules, "   ")).toBe(true);
    });

    it("preserves regex flags order-independently", () => {
      const rules1 = Rules.parse(["/test/gim"]);
      const rules2 = Rules.parse(["/test/mig"]);
      expect(rules1[0]).toBeDefined();
      expect(rules2[0]).toBeDefined();

      // Flags may be reordered, but all should be present
      expect(rules1[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("g"),
      );
      expect(rules1[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("i"),
      );
      expect(rules1[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("m"),
      );
      expect(rules2[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("g"),
      );
      expect(rules2[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("i"),
      );
      expect(rules2[0]).toHaveProperty(
        "value.flags",
        expect.stringContaining("m"),
      );
    });
  });

  describe("Rules.test", () => {
    it("returns false for empty rules", () => {
      const rules: Rules = [];
      expect(Rules.test(rules, "anything")).toBe(false);
    });

    it("matches with single inclusion rule", () => {
      const rules = Rules.parse(["+test"]);
      expect(Rules.test(rules, "test")).toBe(true);
      expect(Rules.test(rules, "other")).toBe(false);
    });

    it("excludes with single exclusion rule", () => {
      const rules = Rules.parse(["-test"]);
      expect(Rules.test(rules, "test")).toBe(false);
      expect(Rules.test(rules, "other")).toBe(false);
    });

    it("applies inclusion then exclusion", () => {
      const rules = Rules.parse(["+test", "-test"]);
      expect(Rules.test(rules, "test")).toBe(false);
      expect(Rules.test(rules, "other")).toBe(false);
    });

    it("applies multiple inclusions", () => {
      const rules = Rules.parse(["+test", "+example"]);
      expect(Rules.test(rules, "test")).toBe(true);
      expect(Rules.test(rules, "example")).toBe(true);
      expect(Rules.test(rules, "other")).toBe(false);
    });

    it("handles complex rule chains", () => {
      const rules = Rules.parse([
        "+/^file/", // Include files starting with "file"
        "-/\\.log$/", // Exclude .log files
        "+important.log", // Re-include important.log
      ]);

      expect(Rules.test(rules, "file.txt")).toBe(true);
      expect(Rules.test(rules, "file.log")).toBe(false);
      expect(Rules.test(rules, "important.log")).toBe(true);
      expect(Rules.test(rules, "other.txt")).toBe(false);
    });

    it("toggles state correctly", () => {
      const rules = Rules.parse(["+a", "-a", "+a"]);
      expect(Rules.test(rules, "a")).toBe(true);
    });

    it("skips error rules", () => {
      const rules: Rules = [
        { type: "+", value: /test/u },
        { type: "error", value: new Error("invalid") },
        { type: "-", value: /test/u },
      ];

      expect(Rules.test(rules, "test")).toBe(false);
    });

    it("handles partial matches with regex", () => {
      const rules = Rules.parse(["/test/"]);
      expect(Rules.test(rules, "testing")).toBe(true);
      expect(Rules.test(rules, "a test")).toBe(true);
      expect(Rules.test(rules, "no match")).toBe(false);
    });

    it("case-sensitive by default", () => {
      const rules = Rules.parse(["test"]);
      expect(Rules.test(rules, "test")).toBe(true);
      expect(Rules.test(rules, "TEST")).toBe(false);
    });

    it("case-insensitive with i flag", () => {
      const rules = Rules.parse(["/test/i"]);
      expect(Rules.test(rules, "test")).toBe(true);
      expect(Rules.test(rules, "TEST")).toBe(true);
      expect(Rules.test(rules, "TeSt")).toBe(true);
    });

    it("processes rules in order", () => {
      const rules = Rules.parse(["+/.*/u", "-specific", "+specific"]);
      expect(Rules.test(rules, "specific")).toBe(true);
      expect(Rules.test(rules, "anything")).toBe(true);
    });

    it("handles unicode patterns", () => {
      const rules = Rules.parse(["/日本語/u"]);
      expect(Rules.test(rules, "日本語")).toBe(true);
      expect(Rules.test(rules, "english")).toBe(false);
    });
  });

  describe("Rules.identityInterpreter", () => {
    it("escapes special regex characters", () => {
      const regex = Rules.identityInterpreter("test.txt");
      expect("test.txt").toMatch(regex);
      expect("testXtxt").not.toMatch(regex);
    });

    it("treats input as literal string", () => {
      const regex = Rules.identityInterpreter("a*b+c?");
      expect("a*b+c?").toMatch(regex);
      expect("abc").not.toMatch(regex);
    });

    it("uses unicode flag", () => {
      const regex = Rules.identityInterpreter("test");
      expect(regex.flags).toContain("u");
    });

    it("handles empty string", () => {
      const regex = Rules.identityInterpreter("");
      expect("").toMatch(regex);
      expect("anything").toMatch(regex); // Empty pattern matches at start
    });

    it("escapes brackets", () => {
      const regex = Rules.identityInterpreter("[test]");
      expect("[test]").toMatch(regex);
      expect("test").not.toMatch(regex);
    });

    it("escapes parentheses", () => {
      const regex = Rules.identityInterpreter("(group)");
      expect("(group)").toMatch(regex);
    });
  });

  describe("Rules.pathInterpreter", () => {
    it("normalizes and matches path prefixes", () => {
      const regex = Rules.pathInterpreter("path/to/dir");
      expect("path/to/dir").toMatch(regex);
      expect("path/to/dir/file.txt").toMatch(regex);
      expect("path/to/other").not.toMatch(regex);
    });

    it("requires path separator after directory", () => {
      const regex = Rules.pathInterpreter("dir");
      expect("dir/file.txt").toMatch(regex);
      expect("directory").not.toMatch(regex);
    });

    it("handles root path", () => {
      const regex = Rules.pathInterpreter("/");
      expect("anything").toMatch(regex);
      expect("").toMatch(regex);
    });

    it("returns NEVER_REGEX for empty string", () => {
      const regex = Rules.pathInterpreter("");
      expect("anything").not.toMatch(regex);
    });

    it("normalizes backslashes to forward slashes", () => {
      const regex = Rules.pathInterpreter("path\\to\\file");
      // After normalization, should match forward-slash format
      expect("path/to/file").toMatch(regex);
    });

    it("matches exact directory", () => {
      const regex = Rules.pathInterpreter("src/components");
      expect("src/components").toMatch(regex);
      expect("src/components/Button.tsx").toMatch(regex);
      expect("src/component").not.toMatch(regex);
    });

    it("is case-sensitive", () => {
      const regex = Rules.pathInterpreter("Path/To/Dir");
      expect("Path/To/Dir").toMatch(regex);
      expect("path/to/dir").not.toMatch(regex);
    });
  });

  describe("Rule types", () => {
    it("NormalRule has type and value", () => {
      const rule: NormalRule = {
        type: "+",
        value: /test/u,
      };

      expect(rule.type).toBe("+");
      expect(rule.value).toBeInstanceOf(RegExp);
    });

    it("ErrorRule has type and error value", () => {
      const error = new Error("Parse error");
      const rule: ErrorRule = {
        type: "error",
        value: error,
      };

      expect(rule.type).toBe("error");
      expect(rule.value).toBe(error);
    });

    it("Rule union type accepts both", () => {
      const rules: Rule[] = [
        { type: "+", value: /test/u },
        { type: "-", value: /exclude/u },
        { type: "error", value: new Error("bad") },
      ];

      expect(rules).toHaveLength(3);
    });
  });

  describe("Edge cases", () => {
    it("handles rules with no matches", () => {
      const rules = Rules.parse(["+/^$/u"]); // Only matches empty string
      expect(Rules.test(rules, "")).toBe(true);
      expect(Rules.test(rules, "anything")).toBe(false);
    });

    it("handles rules that match everything", () => {
      const rules = Rules.parse(["+/.*/u"]);
      expect(Rules.test(rules, "anything")).toBe(true);
      expect(Rules.test(rules, "")).toBe(true);
    });

    it("handles alternating include/exclude for same pattern", () => {
      const rules = Rules.parse(["+test", "-test", "+test", "-test"]);
      expect(Rules.test(rules, "test")).toBe(false);
    });

    it("handles rules with anchors", () => {
      const rules = Rules.parse(["/^start/", "/end$/u"]);
      expect(Rules.test(rules, "start of line")).toBe(true);
      expect(Rules.test(rules, "line end")).toBe(true);
      expect(Rules.test(rules, "middle")).toBe(false);
    });

    it("logs errors for invalid regex without crashing", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      const rules = Rules.parse(["/(invalid/u"]);

      expect(rules[0]).toBeDefined();
      expect(rules[0]).toHaveProperty("type", "error");
      expect(debugSpy).toHaveBeenCalled();
    });
  });
});
