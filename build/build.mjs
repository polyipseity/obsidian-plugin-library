import { PACKAGE_ID, PATHS } from "./util.mjs"
import { analyzeMetafile, context, formatMessages } from "esbuild"
import { constant, isEmpty, isUndefined, kebabCase } from "lodash-es"
import { argv } from "node:process"
import { copy } from "esbuild-plugin-copy"
import esbuildCompress from "esbuild-compress"
import esbuildSvelte from "esbuild-svelte"
import { nodeExternalsPlugin } from "esbuild-node-externals"
import { spawn } from "node:child_process"
import sveltePreprocess from "svelte-preprocess"
import which from "which"
import { writeFile } from "node:fs/promises"

const ARGV_PRODUCTION = 2,
	COMMENT = "// repository: https://github.com/polyipseity/obsidian-plugin-library",
	DEV = argv[ARGV_PRODUCTION] === "dev",
	PACKAGE_ID0 = await PACKAGE_ID,
	BUILD = await context({
		alias: {},
		banner: { js: COMMENT },
		bundle: true,
		color: true,
		drop: [],
		entryPoints: [
			"sources/index.ts",
			"sources/inject/index.ts",
			"sources/style.css",
		],
		external: [],
		footer: { js: COMMENT },
		format: "esm",
		jsx: "transform",
		legalComments: "inline",
		loader: {},
		logLevel: "info",
		logLimit: 0,
		metafile: true,
		minify: !DEV,
		outdir: PATHS.outDir,
		platform: "browser",
		plugins: [
			nodeExternalsPlugin({}),
			copy({
				assets: [
					{
						from: ["sources/**/*.svelte"],
						to: ["sources"],
					},
				],
			}),
			esbuildCompress({
				compressors: [
					{
						filter: /.json$/u,
						loader: "json",
					},
				],
			}),
			esbuildSvelte({
				cache: "overzealous",
				compilerOptions: {
					accessors: false,
					css: "injected",
					cssHash({ name }) {
						return `${PACKAGE_ID0}-svelte-${kebabCase(name)}`
					},
					customElement: false,
					dev: DEV,
					enableSourcemap: {
						css: DEV,
						js: true,
					},
					errorMode: "throw",
					format: "esm",
					generate: "dom",
					hydratable: false,
					immutable: true,
					legacy: false,
					loopGuardTimeout: 0,
					preserveComments: false,
					preserveWhitespace: false,
					varsReport: "full",
				},
				filterWarnings: constant(true),
				fromEntryFile: false,
				include: /\.svelte$/u,
				preprocess: [
					sveltePreprocess({
						aliases: [],
						globalStyle: {
							sourceMap: DEV,
						},
						preserve: [],
						replace: [],
						sourceMap: false,
						typescript: {
							compilerOptions: {
								module: "ESNext",
							},
							handleMixedImports: true,
							reportDiagnostics: true,
							tsconfigDirectory: "./",
							tsconfigFile: "./tsconfig.json",
						},
					}),
				],
			}),
		],
		sourcemap: "linked",
		sourcesContent: true,
		target: "ES2022",
		treeShaking: true,
	})

async function tsc() {
	const npx = await which("npx", {})
	return new Promise((resolve, reject) => {
		spawn(
			npx,
			[
				"--package",
				"typescript",
				"--",
				"tsc",
				"--emitDeclarationOnly",
				...DEV ? ["--watch"] : [],
			],
			{ stdio: "inherit" },
		)
			.once("error", reject)
			.once("exit", (code, signal) => {
				if (code === 0) {
					resolve()
					return
				}
				reject(code ?? signal)
			})
	})
}
async function esbuild() {
	if (DEV) {
		await BUILD.watch({})
	} else {
		try {
			// Await https://github.com/evanw/esbuild/issues/2886
			const { errors, warnings, metafile } = await BUILD.rebuild()
			await Promise.all([
				(async () => {
					if (!isUndefined(metafile)) {
						console.log(await analyzeMetafile(metafile, {
							color: true,
							verbose: true,
						}))
					}
					for await (const logging of [
						{
							data: warnings,
							kind: "warning",
							log: console.warn.bind(console),
						},
						{
							data: errors,
							kind: "error",
							log: console.error.bind(console),
						},
					]
						.filter(({ data }) => !isEmpty(data))
						.map(async ({ data, kind, log }) => {
							const message = (await formatMessages(data, {
								color: true,
								kind,
							})).join("\n")
							return () => log(message)
						})) {
						logging()
					}
				})(),
				isUndefined(metafile)
					? null
					: writeFile(
						PATHS.metafile,
						JSON.stringify(metafile, null, "\t"),
						{ encoding: "utf-8" },
					),
			])
		} finally {
			await BUILD.dispose()
		}
	}
}
await Promise.all([tsc(), esbuild()])
