import type { Plugin, TransformOptions } from "esbuild"
import { assignExact, escapeJavaScriptString as escJSStr } from "../util.js"
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { isEmpty } from "lodash-es"
import lzString from "lz-string"
import { resolve } from "import-meta-resolve"

const { compressToBase64 } = lzString,
	NAME = "compress"

export interface Options {
	readonly enable?: boolean | undefined
	readonly name?: string | undefined
}

export default function esbuildCompress(options?: Options): Plugin {
	return {
		name: options?.name ?? NAME,
		setup(build): void {
			if (options?.enable === false) { return }
			const { esbuild, initialOptions } = build,
				write = initialOptions.write ?? true
			// Await https://github.com/evanw/esbuild/issues/2999
			initialOptions.write = false
			build.onEnd(async ({ errors, outputFiles }) => {
				if (!isEmpty(errors) || !outputFiles) { return }
				const main = outputFiles.find(({ path }) => path.endsWith(".js"))
				if (main) {
					const { path, text } = main,
						tOpts: TransformOptions = {
							loader: "js",
							sourcefile: path,
						}
					for (const key of [
						"charset",
						"color",
						"define",
						"drop",
						// "dropLabels",
						"format",
						"globalName",
						"ignoreAnnotations",
						"jsx",
						"jsxDev",
						"jsxFactory",
						"jsxFragment",
						"jsxImportSource",
						"jsxSideEffects",
						"keepNames",
						"legalComments",
						// "lineLimit",
						"logLevel",
						"logLimit",
						"logOverride",
						"mangleCache",
						"mangleProps",
						"mangleQuoted",
						"minify",
						"minifyIdentifiers",
						"minifySyntax",
						"minifyWhitespace",
						"platform",
						"pure",
						"reserveProps",
						"sourceRoot",
						"sourcemap",
						"sourcesContent",
						"supported",
						"target",
						"treeShaking",
						// "tsconfigRaw",
					] as const) {
						assignExact(tOpts, key, initialOptions[key])
					}
					assignExact(tOpts, "banner", initialOptions.banner?.["js"])
					assignExact(tOpts, "footer", initialOptions.footer?.["js"])
					const { code: lzStringBundle } = await esbuild.transform(
						await readFile(
							fileURLToPath(resolve("lz-string", import.meta.url)),
						),
						tOpts,
					)
					main.contents = new TextEncoder().encode(
						(await esbuild.transform(
							`var a={};new Function("module",${escJSStr(
								lzStringBundle,
								// eslint-disable-next-line max-len
							)})(a);new Function("require","module","exports",a.exports.decompressFromBase64(${escJSStr(
								compressToBase64(text),
							)}))(require,module,exports)`,
							tOpts,
						)).code,
					)
				}
				if (!write) { return }
				await Promise.all(outputFiles
					.map(async ({ path, contents }) => writeFile(path, contents)))
			})
		},
	}
}
