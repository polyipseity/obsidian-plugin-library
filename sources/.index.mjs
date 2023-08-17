// Await https://github.com/evanw/esbuild/issues/1420
import { readFile, writeFile } from "node:fs/promises"

function generateNamedExports(filename, code) {
	return `export {
${[...new Set(
		[...code.matchAll(/^export[^]+?(class|const|function|interface|let|namespace|type|var)[ \n]+([^ \n(<]+)/gmu)]
			.map(([, keyword, name]) =>
				`${["interface", "type"].includes(keyword) ? "type " : ""}${name}`),
	)]
			.sort((left, right) => {
				const left2 = left.replace(/^type /u, "")
				const right2 = right.replace(/^type /u, "")
				return left2 > right2 ? 1 : left2 < right2 ? -1 : 0
			})
			.concat([""])
			.join(",\n")}} from "${filename}"`
}

const regex = /^export[^]+?from[^"]+"([^"]*)"$/gmu,
	index = await readFile("index.ts", { encoding: "utf-8" }),
	files = Object.fromEntries(
		await Promise.all(
			[...index.matchAll(regex)]
				.map(async ([, filename]) => [
					filename,
					generateNamedExports(
						filename,
						await readFile(
							filename.replace(/\.js$/u, ".ts"),
							{ encoding: "utf-8" },
						),
					),
				]),
		),
	)
await writeFile(
	"index.ts",
	index.replace(regex, (substring, filename) => files[filename] ?? substring),
	{ encoding: "utf-8" },
)
