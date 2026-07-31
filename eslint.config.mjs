// @ts-check
import eslintJs from "@eslint/js";
import eslintPrettier from "eslint-config-prettier/flat";
import eslintObsidianMd from "eslint-plugin-obsidianmd";
import eslintSvelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals"; // provide Node/browser globals for file-level overrides
import path from "node:path";
import eslintTs from "typescript-eslint";

export const FILE_GLOBS = [
  "**/*.cjs",
  "**/*.cts",
  "**/*.d.ts",
  "**/*.js",
  "**/*.jsx",
  "**/*.mjs",
  "**/*.mts",
  "**/*.ts",
  "**/*.tsx",
  "**/*.svelte",
  "**/*.svelte.js",
  "**/*.svelte.ts",
];

export default defineConfig([
  eslintJs.configs.recommended,
  ...eslintTs.configs.strictTypeChecked,
  ...eslintSvelte.configs["flat/recommended"],
  eslintPrettier,
  // Disable formatting-related rules that may conflict with Prettier
  ...eslintSvelte.configs["flat/prettier"],
  // Obsidian
  ...eslintObsidianMd.configs.recommendedWithLocalesEn.filter(
    (config) => !config.name?.endsWith("typescript-eslint/base"),
  ),
  // Disable all Svelte rules for `package.json` to avoid crashes (JSON parser has no parserServices)
  {
    files: ["package.json"],
    rules: Object.fromEntries(
      Object.keys(eslintSvelte.rules).map((key) => [`svelte/${key}`, "off"]),
    ),
  },
  includeIgnoreFile(path.join(import.meta.dirname, ".gitignore")),
  {
    files: FILE_GLOBS,
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.mjs", "*.mts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowInterfaces: "with-single-extends",
        },
      ],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.js", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        extraFileExtensions: [".svelte"], // Add support for additional file extensions, such as .svelte
        parser: eslintTs.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Scripts and tests run on Node.js — provide Node globals so `console` is defined
  {
    files: ["*.mjs", "*.mts", "scripts/**", "tests/**"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-restricted-globals": "off",
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/prefer-create-el": "off",
      "obsidianmd/rule-custom-message": "off",
    },
  },
  // JSON files are data declarations, not executable code — expression and UI-text rules don't apply
  {
    files: ["assets/**/*.json"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "obsidianmd/ui/sentence-case-json": "off",
    },
  },
  {
    files: ["package.json"],
    rules: {
      "depend/ban-dependencies": allowDependencies(
        // `moment` is exempted from `depend/ban-dependencies` — this library legitimately depends on it for locale detection, as a library cannot rely on Obsidian's runtime global.
        "moment",
      ),
    },
  },
]);

/**
 * Derive the `depend/ban-dependencies` rule for `package.json` from the upstream obsidianmd config, allowing the given dependencies in addition to the upstream defaults.
 * @param {...string} dependencies - Dependencies to allow.
 */
function allowDependencies(...dependencies) {
  let rule = eslintObsidianMd.configs.recommendedWithLocalesEn.find(
    (config) =>
      config.files?.includes("package.json") &&
      config.rules?.["depend/ban-dependencies"],
  )?.rules?.["depend/ban-dependencies"];
  if (typeof rule === "undefined") {
    return rule;
  }
  rule = Array.isArray(rule) ? [...rule] : [rule];
  const /** @type {Record<string, unknown>} */ ruleConfig =
      typeof rule[1] === "object" ? { ...rule[1] } : {};
  const ruleConfigAllowed = Array.isArray(ruleConfig.allowed)
    ? ruleConfig.allowed.slice()
    : [];
  ruleConfigAllowed.push(...dependencies);
  ruleConfig.allowed = ruleConfigAllowed;
  rule[1] = ruleConfig;
  return rule;
}
