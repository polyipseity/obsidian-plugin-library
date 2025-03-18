import { defineConfig, globalIgnores } from "eslint/config"
import { fixupConfigRules } from "@eslint/compat"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import * as espree from "espree"
import tsParser from "@typescript-eslint/parser"
import svelteParser from "svelte-eslint-parser"
import markdownlintParser from "eslint-plugin-markdownlint/parser.js"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url),
	__dirname = path.dirname(__filename),
	compat = new FlatCompat({
		baseDirectory: __dirname,
		recommendedConfig: js.configs.recommended,
		allConfig: js.configs.all,
	})

export default defineConfig([
	globalIgnores(["build/*/", "**/main.js", "**/node_modules/", "**/dist/"]),
	{
		"extends": fixupConfigRules(compat.extends(
			"eslint:all",
			"plugin:import/electron",
			"plugin:import/recommended",
			"plugin:import/typescript",
		)),

		plugins: {
			"@typescript-eslint": typescriptEslint,
			svelte,
		},

		linterOptions: {
			reportUnusedDisableDirectives: true,
		},

		languageOptions: {
			globals: {
				...globals.browser,
				...Object.fromEntries(Object.entries(globals.node).map(([key]) => [key, "off"])),
			},

			parser: espree,
			ecmaVersion: "latest",
			sourceType: "module",

			parserOptions: {
				allowReserved: false,
				ecmaFeatures: {},
				extraFileExtensions: [".svelte"],
				project: true,
			},
		},

		settings: {
			"import/resolver": {
				node: false,
				typescript: true,
			},
		},

		rules: {
			"array-element-newline": ["error", "consistent"],
			"arrow-parens": ["error", "as-needed"],

			"brace-style": ["error", "1tbs", {
				allowSingleLine: true,
			}],

			"class-methods-use-this": "off",
			"comma-dangle": ["error", "always-multiline"],
			"dot-location": ["error", "property"],

			"func-style": ["error", "declaration", {
				allowArrowFunctions: true,
			}],

			"function-call-argument-newline": ["error", "consistent"],
			"function-paren-newline": ["error", "multiline-arguments"],
			"generator-star-spacing": ["error", "after"],
			"grouped-accessor-pairs": "off",
			"implicit-arrow-linebreak": "off",
			"import/no-cycle": "error",

			"import/no-unresolved": ["error", {
				amd: true,
				commonjs: true,
			}],

			indent: ["error", "tab", {
				SwitchCase: 1,
			}],

			"linebreak-style": "off",

			"lines-between-class-members": ["error", "always", {
				exceptAfterSingleLine: true,
			}],

			"max-classes-per-file": "off",
			"max-depth": "off",

			"max-len": ["error", {
				code: 80,
				ignorePattern: "eslint-disable",
				ignoreRegExpLiterals: false,
				ignoreStrings: false,
				ignoreTemplateLiterals: false,
				ignoreUrls: true,
				tabWidth: 2,
			}],

			"max-lines": "off",
			"max-lines-per-function": "off",
			"max-params": "off",
			"max-statements": "off",
			"max-statements-per-line": "off",
			"multiline-ternary": ["error", "always-multiline"],

			"new-cap": ["error", {
				properties: false,
			}],

			"no-confusing-arrow": "off",
			"no-console": "off",
			"no-continue": "off",

			"no-inline-comments": ["error", {
				ignorePattern: "^ @__PURE__ $",
			}],

			"no-magic-numbers": ["error", {
				ignore: [-1, 0, 1, 10],
			}],

			"no-nested-ternary": "off",
			"no-plusplus": "off",

			"no-restricted-globals": [
				"error",
				"addEventListener",
				"blur",
				"captureEvents",
				"chrome",
				"clientInformation",
				"close",
				"closed",
				"console",
				"createImageBitmap",
				"crypto",
				"customElements",
				"defaultStatus",
				"defaultstatus",
				"devicePixelRatio",
				"document",
				"external",
				"find",
				"focus",
				"frameElement",
				"frames",
				"getComputedStyle",
				"getSelection",
				"indexedDB",
				"innerHeight",
				"innerWidth",
				"isSecureContext",
				"length",
				"location",
				"locationbar",
				"matchMedia",
				"menubar",
				"moveBy",
				"moveTo",
				"name",
				"navigator",
				"onabort",
				"onafterprint",
				"onanimationend",
				"onanimationiteration",
				"onanimationstart",
				"onappinstalled",
				"onauxclick",
				"onbeforeinstallprompt",
				"onbeforeprint",
				"onbeforeunload",
				"onblur",
				"oncancel",
				"oncanplay",
				"oncanplaythrough",
				"onchange",
				"onclick",
				"onclose",
				"oncontextmenu",
				"oncuechange",
				"ondblclick",
				"ondevicemotion",
				"ondeviceorientation",
				"ondeviceorientationabsolute",
				"ondrag",
				"ondragend",
				"ondragenter",
				"ondragleave",
				"ondragover",
				"ondragstart",
				"ondrop",
				"ondurationchange",
				"onemptied",
				"onended",
				"onerror",
				"onfocus",
				"ongotpointercapture",
				"onhashchange",
				"oninput",
				"oninvalid",
				"onkeydown",
				"onkeypress",
				"onkeyup",
				"onlanguagechange",
				"onload",
				"onloadeddata",
				"onloadedmetadata",
				"onloadstart",
				"onlostpointercapture",
				"onmessage",
				"onmessageerror",
				"onmousedown",
				"onmouseenter",
				"onmouseleave",
				"onmousemove",
				"onmouseout",
				"onmouseover",
				"onmouseup",
				"onmousewheel",
				"onoffline",
				"ononline",
				"onpagehide",
				"onpageshow",
				"onpause",
				"onplay",
				"onplaying",
				"onpointercancel",
				"onpointerdown",
				"onpointerenter",
				"onpointerleave",
				"onpointermove",
				"onpointerout",
				"onpointerover",
				"onpointerup",
				"onpopstate",
				"onprogress",
				"onratechange",
				"onrejectionhandled",
				"onreset",
				"onresize",
				"onscroll",
				"onsearch",
				"onseeked",
				"onseeking",
				"onselect",
				"onstalled",
				"onstorage",
				"onsubmit",
				"onsuspend",
				"ontimeupdate",
				"ontoggle",
				"ontransitionend",
				"onunhandledrejection",
				"onunload",
				"onvolumechange",
				"onwaiting",
				"onwebkitanimationend",
				"onwebkitanimationiteration",
				"onwebkitanimationstart",
				"onwebkittransitionend",
				"onwheel",
				"open",
				"openDatabase",
				"opener",
				"origin",
				"outerHeight",
				"outerWidth",
				"pageXOffset",
				"pageYOffset",
				"parent",
				"performance",
				"personalbar",
				"postMessage",
				"print",
				"releaseEvents",
				"removeEventListener",
				"resizeBy",
				"resizeTo",
				"screen",
				"screenLeft",
				"screenTop",
				"screenX",
				"screenY",
				"scroll",
				"scrollBy",
				"scrollTo",
				"scrollX",
				"scrollY",
				"scrollbars",
				"setInterval",
				"setTimeout",
				"speechSynthesis",
				"status",
				"statusbar",
				"stop",
				"styleMedia",
				"toolbar",
				"top",
				"visualViewport",
				"webkitRequestFileSystem",
				"webkitResolveLocalFileSystemURL",
				"webkitStorageInfo",
				"window",
			],

			"no-tabs": ["error", {
				allowIndentationTabs: true,
			}],

			"no-ternary": "off",

			"no-underscore-dangle": ["error", {
				allowAfterThis: true,
			}],

			"no-void": ["off"],
			"object-curly-spacing": ["error", "always"],

			"object-property-newline": ["error", {
				allowAllPropertiesOnSameLine: true,
			}],

			"one-var": ["error", "consecutive"],
			"padded-blocks": ["error", "never"],

			"quote-props": ["error", "as-needed", {
				keywords: true,
				numbers: true,
				unnecessary: true,
			}],

			semi: ["error", "never", {
				beforeStatementContinuationChars: "always",
			}],

			"sort-vars": "off",
			"space-before-function-paren": ["error", {
				anonymous: "never",
				asyncArrow: "always",
				named: "never",
			}],
		},
	},
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.jsx"],
	},
	{
		files: ["build/**"],

		languageOptions: {
			globals: {
				...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
				...globals.node,
			},
		},

		settings: {
			"import/resolver": {
				node: true,
				typescript: true,
			},
		},

		rules: {
			"no-restricted-globals": [
				"error",
				"addEventListener",
				"blur",
				"captureEvents",
				"chrome",
				"clientInformation",
				"close",
				"closed",
				"createImageBitmap",
				"crypto",
				"customElements",
				"defaultStatus",
				"defaultstatus",
				"devicePixelRatio",
				"document",
				"external",
				"find",
				"focus",
				"frameElement",
				"frames",
				"getComputedStyle",
				"getSelection",
				"indexedDB",
				"innerHeight",
				"innerWidth",
				"isSecureContext",
				"length",
				"location",
				"locationbar",
				"matchMedia",
				"menubar",
				"moveBy",
				"moveTo",
				"name",
				"navigator",
				"onabort",
				"onafterprint",
				"onanimationend",
				"onanimationiteration",
				"onanimationstart",
				"onappinstalled",
				"onauxclick",
				"onbeforeinstallprompt",
				"onbeforeprint",
				"onbeforeunload",
				"onblur",
				"oncancel",
				"oncanplay",
				"oncanplaythrough",
				"onchange",
				"onclick",
				"onclose",
				"oncontextmenu",
				"oncuechange",
				"ondblclick",
				"ondevicemotion",
				"ondeviceorientation",
				"ondeviceorientationabsolute",
				"ondrag",
				"ondragend",
				"ondragenter",
				"ondragleave",
				"ondragover",
				"ondragstart",
				"ondrop",
				"ondurationchange",
				"onemptied",
				"onended",
				"onerror",
				"onfocus",
				"ongotpointercapture",
				"onhashchange",
				"oninput",
				"oninvalid",
				"onkeydown",
				"onkeypress",
				"onkeyup",
				"onlanguagechange",
				"onload",
				"onloadeddata",
				"onloadedmetadata",
				"onloadstart",
				"onlostpointercapture",
				"onmessage",
				"onmessageerror",
				"onmousedown",
				"onmouseenter",
				"onmouseleave",
				"onmousemove",
				"onmouseout",
				"onmouseover",
				"onmouseup",
				"onmousewheel",
				"onoffline",
				"ononline",
				"onpagehide",
				"onpageshow",
				"onpause",
				"onplay",
				"onplaying",
				"onpointercancel",
				"onpointerdown",
				"onpointerenter",
				"onpointerleave",
				"onpointermove",
				"onpointerout",
				"onpointerover",
				"onpointerup",
				"onpopstate",
				"onprogress",
				"onratechange",
				"onrejectionhandled",
				"onreset",
				"onresize",
				"onscroll",
				"onsearch",
				"onseeked",
				"onseeking",
				"onselect",
				"onstalled",
				"onstorage",
				"onsubmit",
				"onsuspend",
				"ontimeupdate",
				"ontoggle",
				"ontransitionend",
				"onunhandledrejection",
				"onunload",
				"onvolumechange",
				"onwaiting",
				"onwebkitanimationend",
				"onwebkitanimationiteration",
				"onwebkitanimationstart",
				"onwebkittransitionend",
				"onwheel",
				"open",
				"openDatabase",
				"opener",
				"origin",
				"outerHeight",
				"outerWidth",
				"pageXOffset",
				"pageYOffset",
				"parent",
				"performance",
				"personalbar",
				"postMessage",
				"print",
				"releaseEvents",
				"removeEventListener",
				"resizeBy",
				"resizeTo",
				"self",
				"screen",
				"screenLeft",
				"screenTop",
				"screenX",
				"screenY",
				"scroll",
				"scrollBy",
				"scrollTo",
				"scrollX",
				"scrollY",
				"scrollbars",
				"setInterval",
				"setTimeout",
				"speechSynthesis",
				"status",
				"statusbar",
				"stop",
				"styleMedia",
				"toolbar",
				"top",
				"visualViewport",
				"webkitRequestFileSystem",
				"webkitResolveLocalFileSystemURL",
				"webkitStorageInfo",
				"window",
			],
		},
	},
	{
		files: ["**/*.ts", "**/*.mts", "**/*.cts", "**/*.tsx", "**/*.svelte"],

		"extends": compat.extends(
			"plugin:@typescript-eslint/eslint-recommended",
			"plugin:@typescript-eslint/all",
		),

		languageOptions: {
			parser: tsParser,
		},

		rules: {
			"@typescript-eslint/adjacent-overload-signatures": "off",

			"@typescript-eslint/consistent-type-imports": ["error", {
				disallowTypeAnnotations: false,
				prefer: "type-imports",
			}],

			"@typescript-eslint/explicit-module-boundary-types": ["error", {
				allowArgumentsExplicitlyTypedAsAny: true,
			}],

			"@typescript-eslint/max-params": "off",

			"@typescript-eslint/naming-convention": ["error", {
				format: ["camelCase"],
				selector: "default",
			}, {
				format: ["camelCase", "UPPER_CASE"],
				selector: "variable",
			}, {
				format: ["camelCase"],
				leadingUnderscore: "allow",
				selector: "parameter",
			}, {
				format: ["camelCase"],
				leadingUnderscore: "allowDouble",
				selector: "memberLike",
			}, {
				format: ["camelCase"],
				modifiers: ["private"],
				prefix: ["#"],
				selector: "memberLike",
			}, {
				format: ["PascalCase"],
				selector: "typeLike",
			}],

			"@typescript-eslint/no-empty-function": ["error", {
				allow: ["arrowFunctions", "overrideMethods"],
			}],

			"@typescript-eslint/no-explicit-any": "off",

			"@typescript-eslint/no-floating-promises": ["error", {
				ignoreIIFE: true,
			}],

			"@typescript-eslint/no-magic-numbers": ["error", {
				ignore: [-1, 0, 1, 10],
				ignoreEnums: true,
				ignoreReadonlyClassProperties: true,
			}],

			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-type-alias": "off",

			"@typescript-eslint/no-unnecessary-condition": ["error", {
				allowConstantLoopConditions: true,
			}],

			"@typescript-eslint/no-unused-vars": ["error", {
				argsIgnorePattern: "^_",
			}],

			"@typescript-eslint/no-use-before-define": ["error", {
				functions: false,
			}],

			"@typescript-eslint/parameter-properties": ["error", {
				prefer: "parameter-property",
			}],

			"@typescript-eslint/prefer-readonly-parameter-types": ["off"],
		},
	},
	{
		files: ["**/*.svelte"],

		languageOptions: {
			parser: svelteParser,
			ecmaVersion: 5,
			sourceType: "script",

			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},

		rules: {
			"@typescript-eslint/explicit-function-return-type": "off",

			"arrow-parens": ["error", "always"],
		},
	},
	{
		files: ["**/*.md"],
		"extends": compat.extends("plugin:markdownlint/recommended"),

		languageOptions: {
			parser: markdownlintParser,
		},

		rules: {
			"max-len": "off",
			"markdownlint/md013": "off",
		},
	},
])