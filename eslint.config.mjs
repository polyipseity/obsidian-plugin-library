// @ts-check
import eslintJs from "@eslint/js";
import eslintPrettier from "eslint-config-prettier/flat";
import eslintObsidianMd from "eslint-plugin-obsidianmd";
import eslintSvelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals"; // provide Node/browser globals for file-level overrides
import path from "node:path";
import ts from "typescript";
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

const ASSET_JSON = "assets/**/*.json";
const lintFiles = [...FILE_GLOBS, ASSET_JSON];
/** @type {{ parseForESLint(text: string, options: object): ReturnType<typeof eslintTs.parser.parseForESLint> }} */
const assetParser = eslintTs.parser;

export default defineConfig([
  {
    files: lintFiles,
    extends: [
      eslintJs.configs.recommended,
      ...eslintTs.configs.strictTypeChecked,
      ...eslintSvelte.configs["flat/recommended"],
      eslintPrettier,
      ...eslintSvelte.configs["flat/prettier"],
    ],
  },
  // Obsidian
  ...eslintObsidianMd.configs.recommendedWithLocalesEn.filter(
    (config) => !config.name?.endsWith("typescript-eslint/base"),
  ),
  includeIgnoreFile(path.join(import.meta.dirname, ".gitignore")),
  {
    files: lintFiles,
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
    rules: {
      "no-self-assign": "error",
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
      "obsidianmd/hardcoded-config-path": "off",
      "obsidianmd/no-nodejs-modules": "off",
      "obsidianmd/prefer-create-el": "off",
      "obsidianmd/rule-custom-message": "off",
    },
  },
  // The rule targets production class instances. Tests deliberately assign structural mocks.
  {
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-unsafe-class-instance-assignment": "off",
    },
  },
  // Use TypeScript's JSON parser for every locale so the shared rules see object literals.
  {
    files: [ASSET_JSON],
    language: "@/js",
    languageOptions: {
      parser: {
        ...eslintTs.parser,
        /**
         * @param {string} text
         * @param {{ filePath: string }} options
         */
        parseForESLint(text, options) {
          // TypeScript also accepts JSON with comments and trailing commas.
          JSON.parse(text);
          // A JSON asset can be linted before any TypeScript module imports it.
          const { filePath } = options;
          const compilerOptions = {
            resolveJsonModule: true,
            noLib: true,
            types: [],
          };
          const host = ts.createCompilerHost(compilerOptions, true);
          host.readFile = (name) =>
            path.resolve(name) === filePath ? text : undefined;
          const program = ts.createProgram([filePath], compilerOptions, host);
          return assetParser.parseForESLint(text, {
            ...options,
            programs: [program],
          });
        },
      },
      parserOptions: { projectService: false },
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "no-dupe-keys": "error",
      "no-unexpected-multiline": "error",
      "no-unused-vars": "error",
      "obsidianmd/ui/sentence-case-json": "off",
    },
  },
  {
    files: ["package.json"],
    rules: {
      "depend/ban-dependencies": allowDependencies(
        // `moment` is exempted from `depend/ban-dependencies` — this library legitimately depends on it for locale detection, as a library cannot rely on Obsidian's runtime global.
        "moment",
        // `rimraf` is exempted from `depend/ban-dependencies` — the `clean` script relies on it for cross-platform recursive directory removal. The module-replacements alternatives are cumbersome: the native `fs.rm` replacement requires remembering `{ recursive: true, force: true }` (plus retry emulation on Windows) and `fs.rmdir` is deprecated, while `premove` has minimal activity.
        "rimraf",
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
