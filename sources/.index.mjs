// Await https://github.com/evanw/esbuild/issues/1420
// npm install --global ts-file-exports
import { readFile, writeFile } from "node:fs/promises"
import tsFileExports from "ts-file-exports"

async function generateNamedExports(filename) {
	console.log(filename)
	const filename2 = filename.replace(/\.js$/u, ".ts")
	let exports = []
	try {
		exports.push(...tsFileExports.default(filename2))
	} catch {
		console.log("error")
		const code = await readFile(filename2, { encoding: "utf-8" })
		exports.push(...[
			...code.matchAll(/^export[^]+?(class|const|function|interface|let|namespace|type|var)[ \n]+([^ \n(<]+)/gmu),
		].map(([, , name]) => name))
	}
	exports = [...new Set(exports)].sort()
	exports.push("")
	return `export {\n${exports.join(",\n")}} from "${filename}"`
}

const regex = /^export[^]+?from[^"]+"([^"]*)"$/gmu,
	index = await readFile("index.ts", { encoding: "utf-8" }),
	files = Object.fromEntries(
		await Promise.all(
			[...index.matchAll(regex)]
				.map(async ([, filename]) => [
					filename,
					await generateNamedExports(filename),
				]),
		),
	)
await writeFile(
	"index.ts",
	index.replace(regex, (substring, filename) => files[filename] ?? substring),
	{ encoding: "utf-8" },
)
