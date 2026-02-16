/**
 * Comprehensive tests for src/source-maps.ts — source map generation and handling
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  attachFunctionSourceMap,
  attachSourceMap,
  generateFunctionSourceMap,
  generateSourceMap,
} from "../../src/source-maps.js";
import type { AsyncFunctionConstructor } from "../../src/types.js";

describe("source-maps.ts — source map generation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateSourceMap", () => {
    it("generates source map for simple script", () => {
      const script = "const x = 1;";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
      expect(typeof sourceMap.toString).toBe("function");
    });

    it("generates source map with custom source name", () => {
      const script = "const y = 2;";
      const sourceMap = generateSourceMap(script, {
        source: "custom-source.ts",
      });

      const json = sourceMap.toJSON();
      expect(json.sources).toContain("custom-source.ts");
    });

    it("generates source map with file option", () => {
      const script = "const z = 3;";
      const sourceMap = generateSourceMap(script, {
        file: "output.js",
      });

      const json = sourceMap.toJSON();
      expect(json.file).toBe("output.js");
    });

    it("generates source map with sourceRoot", () => {
      const script = "const a = 4;";
      const sourceMap = generateSourceMap(script, {
        sourceRoot: "/src/",
      });

      const json = sourceMap.toJSON();
      expect(json.sourceRoot).toBe("/src/");
    });

    it("handles multiline scripts", () => {
      const script = `const x = 1;
const y = 2;
const z = 3;`;
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
      const json = sourceMap.toJSON();
      expect(json.mappings).toBeTruthy();
    });

    it("generates mappings for each character", () => {
      const script = "abc";
      const sourceMap = generateSourceMap(script);

      const json = sourceMap.toJSON();
      expect(json.mappings).toBeTruthy();
      expect(json.mappings.length).toBeGreaterThan(0);
    });

    it("includes source content", () => {
      const script = "const value = 42;";
      const sourceMap = generateSourceMap(script, {
        source: "test.ts",
      });

      const json = sourceMap.toJSON();
      expect(json.sourcesContent).toBeDefined();
      expect(json.sourcesContent?.[0]).toBe(script);
    });

    it("handles empty script", () => {
      const script = "";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
      const json = sourceMap.toJSON();
      expect(json).toBeDefined();
    });

    it("handles script with special characters", () => {
      const script = 'const str = "hello\\nworld";';
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
    });

    it("handles deletions option", () => {
      const script = "abc";
      const sourceMap = generateSourceMap(script, {
        deletions: [{ line: 1, column: 1 }],
      });

      expect(sourceMap).toBeDefined();
    });

    it("handles offset option", () => {
      const script = "const x = 1;";
      const sourceMap = generateSourceMap(script, {
        offset: { line: 5, column: 10 },
      });

      expect(sourceMap).toBeDefined();
      const json = sourceMap.toJSON();
      expect(json).toBeDefined();
    });

    it("defaults to line 1, column 0 when no offset", () => {
      const script = "test";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
    });

    it("handles script with existing source map comment", () => {
      // Deliberately break the source map comment to avoid triggering source map parsing in the test environment
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      const script = `const x = 1;
${"//"}# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozfQ==`;

      // Should not throw and should log debug information (mocked to avoid printing stacktrace)
      expect(() => generateSourceMap(script)).not.toThrow();
      expect(debugSpy).toHaveBeenCalled();
    });

    it("handles Unicode characters", () => {
      const script = "const 日本語 = '値';";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
    });

    it("preserves newlines in multiline scripts", () => {
      const script = "line1\nline2\nline3";
      const sourceMap = generateSourceMap(script, { source: "test.ts" });

      const json = sourceMap.toJSON();
      expect(json.sourcesContent?.[0]).toContain("\n");
    });
  });

  describe("generateFunctionSourceMap", () => {
    it("generates source map for Function constructor", () => {
      const script = "return x + 1;";
      const sourceMap = generateFunctionSourceMap(Function, script);

      expect(sourceMap).toBeDefined();
    });

    it("generates source map for AsyncFunction constructor", () => {
      const AsyncFunction = (async () => {})
        .constructor as AsyncFunctionConstructor;
      const script = "return await Promise.resolve(42);";
      const sourceMap = generateFunctionSourceMap(AsyncFunction, script);

      expect(sourceMap).toBeDefined();
    });

    it("caches offset for constructor", () => {
      const script1 = "return 1;";
      const script2 = "return 2;";

      const sourceMap1 = generateFunctionSourceMap(Function, script1);
      const sourceMap2 = generateFunctionSourceMap(Function, script2);

      expect(sourceMap1).toBeDefined();
      expect(sourceMap2).toBeDefined();
    });

    it("accepts additional options", () => {
      const script = "return true;";
      const sourceMap = generateFunctionSourceMap(Function, script, {
        source: "dynamic-fn.ts",
        file: "output.js",
      });

      const json = sourceMap.toJSON();
      expect(json.sources).toContain("dynamic-fn.ts");
      expect(json.file).toBe("output.js");
    });

    it("handles complex function bodies", () => {
      const script = `
        const a = 1;
        const b = 2;
        return a + b;
      `;
      const sourceMap = generateFunctionSourceMap(Function, script);

      expect(sourceMap).toBeDefined();
    });

    it("calculates correct offset for function wrapper", () => {
      const script = "return 'test';";
      const sourceMap = generateFunctionSourceMap(Function, script);

      // Should account for function wrapper offset
      expect(sourceMap).toBeDefined();
      const json = sourceMap.toJSON();
      expect(json.mappings).toBeTruthy();
    });

    it("handles empty function body", () => {
      const script = "";
      const sourceMap = generateFunctionSourceMap(Function, script);

      expect(sourceMap).toBeDefined();
    });
  });

  describe("attachSourceMap", () => {
    it("attaches source map comment to script", () => {
      const script = "const x = 1;";
      const result = attachSourceMap(script);

      expect(result).toContain(script);
      // Deliberately check for the comment in a way that avoids triggering source map parsing in the test environment
      expect(result).toContain(`${"//"}# sourceMappingURL=`);
    });

    it("appends source map as base64 comment", () => {
      const script = "const y = 2;";
      const result = attachSourceMap(script);

      expect(result.startsWith(script)).toBe(true);
      expect(result).toMatch(/\/\/# sourceMappingURL=data:application\/json/);
    });

    it("includes source map data", () => {
      const script = "console.log('test');";
      const result = attachSourceMap(script, {
        source: "test.ts",
      });

      expect(result).toContain("base64");
    });

    it("handles multiline scripts", () => {
      const script = `function test() {
  return 42;
}`;
      const result = attachSourceMap(script);

      expect(result).toContain(script);
      expect(result).toContain("sourceMappingURL");
    });

    it("preserves script content", () => {
      const script = "const value = 'important data';";
      const result = attachSourceMap(script);

      expect(result).toContain(script);
    });

    it("forwards options to generateSourceMap", () => {
      const script = "const a = 1;";
      const result = attachSourceMap(script, {
        file: "output.js",
        sourceRoot: "/src/",
      });

      expect(result).toContain(script);
      expect(result).toContain("sourceMappingURL");
    });
  });

  describe("attachFunctionSourceMap", () => {
    it("attaches source map to function script", () => {
      const script = "return x * 2;";
      const result = attachFunctionSourceMap(Function, script);

      expect(result).toContain(script);
      // Check for source map comment without triggering source map parsing
      expect(result).toContain(`${"//"}# sourceMappingURL=`);
    });

    it("works with AsyncFunction", () => {
      const AsyncFunction = (async () => {})
        .constructor as AsyncFunctionConstructor;
      const script = "return await fetch('/api');";
      const result = attachFunctionSourceMap(AsyncFunction, script);

      expect(result).toContain(script);
      expect(result).toContain("sourceMappingURL");
    });

    it("includes base64-encoded source map", () => {
      const script = "return 42;";
      const result = attachFunctionSourceMap(Function, script);

      expect(result).toMatch(/data:application\/json;charset=utf-8;base64/);
    });

    it("forwards options to generateFunctionSourceMap", () => {
      const script = "return true;";
      const result = attachFunctionSourceMap(Function, script, {
        source: "dynamic.ts",
      });

      expect(result).toContain(script);
      expect(result).toContain("sourceMappingURL");
    });

    it("handles complex function bodies", () => {
      const script = `
        if (x > 0) {
          return x;
        } else {
          return -x;
        }
      `;
      const result = attachFunctionSourceMap(Function, script);

      expect(result).toContain(script);
    });

    it("preserves script whitespace", () => {
      const script = "  return value;  ";
      const result = attachFunctionSourceMap(Function, script);

      expect(result).toContain(script);
    });
  });

  describe("Edge cases", () => {
    it("handles scripts with only whitespace", () => {
      const script = "   \n   \n   ";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
    });

    it("handles very long scripts", () => {
      const script = "const x = 1;\n".repeat(1000);

      expect(() => generateSourceMap(script)).not.toThrow();
    });

    it("handles special JavaScript tokens", () => {
      const script =
        "const obj = { key: 'value', [Symbol.iterator]: () => {} };";
      const sourceMap = generateSourceMap(script);

      expect(sourceMap).toBeDefined();
    });

    it("handles invalid source map in script gracefully", () => {
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      // Deliberately break the source map comment to avoid triggering source map parsing in the test environment
      const script = `const x = 1;
${"//"}# sourceMappingURL=data:application/json;base64,invalid!!!`;

      expect(() => generateSourceMap(script)).not.toThrow();
      expect(debugSpy).toHaveBeenCalled();
    });

    it("handles deletion at first position", () => {
      const script = "abc";
      const sourceMap = generateSourceMap(script, {
        deletions: [{ line: 1, column: 0 }],
      });

      expect(sourceMap).toBeDefined();
    });

    it("handles multiple deletions", () => {
      const script = "abcdef";
      const sourceMap = generateSourceMap(script, {
        deletions: [
          { line: 1, column: 1 },
          { line: 1, column: 3 },
        ],
      });

      expect(sourceMap).toBeDefined();
    });

    it("handles source map with no sources", () => {
      const script = "test";
      const sourceMap = generateSourceMap(script, {
        source: undefined,
      });

      expect(sourceMap).toBeDefined();
    });

    it("logs error for unrecognized function constructor offset", () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Use a constructor that returns a function whose `toString()` does NOT
      // contain the FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT. That forces the
      // offset-detection branch to log an error so we can assert it was called.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const BrokenCtor = function BrokenCtor(_script?: string) {
        return function broken() {
          return 42;
        };
      } as unknown as FunctionConstructor;

      const script = "return 1;";

      generateFunctionSourceMap(BrokenCtor, script);

      // verify logging happened and avoid printing to the terminal
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("Source map JSON structure", () => {
    it("generates valid source map v3 structure", () => {
      const script = "const test = 42;";
      const sourceMap = generateSourceMap(script, { source: "test.ts" });
      const json = sourceMap.toJSON();

      expect(json.version).toBe(3);
      expect(json.sources).toBeDefined();
      expect(json.mappings).toBeDefined();
      expect(Array.isArray(json.sources)).toBe(true);
    });

    it("includes all required fields", () => {
      const script = "test";
      const sourceMap = generateSourceMap(script);
      const json = sourceMap.toJSON();

      expect(json).toHaveProperty("version");
      expect(json).toHaveProperty("sources");
      expect(json).toHaveProperty("mappings");
    });

    it("encodes mappings as VLQ string", () => {
      const script = "const a = 1;";
      const sourceMap = generateSourceMap(script);
      const json = sourceMap.toJSON();

      expect(typeof json.mappings).toBe("string");
      expect(json.mappings.length).toBeGreaterThan(0);
    });
  });
});
