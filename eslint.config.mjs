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
      "no-console": "off",
      "no-new-func": "off",
      "no-restricted-globals": "off",
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/prefer-create-el": "off",
    },
  },
]);
