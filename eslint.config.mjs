// @ts-check
import eslintJs from "@eslint/js";
import eslintTs from "typescript-eslint";
import eslintSvelte from "eslint-plugin-svelte";
import eslintPrettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import path from "node:path";
import globals from "globals"; // provide Node/browser globals for file-level overrides

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  ...eslintTs.configs.strict,
  ...eslintSvelte.configs["flat/recommended"],
  includeIgnoreFile(path.join(__dirname, ".gitignore")),
  {
    files: FILE_GLOBS,
  },
  {
    files: ["**/*.svelte", "**/*.svelte.js", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"], // Add support for additional file extensions, such as .svelte
        parser: eslintTs.parser,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
  // Scripts run on Node.js — provide Node globals so `console` is defined
  {
    files: ["scripts/**", "tests/scripts/**"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // Disable formatting-related rules that may conflict with Prettier
  eslintPrettier,
  ...eslintSvelte.configs["flat/prettier"],
]);
