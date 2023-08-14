import {
	type Position,
	SourceMapGenerator,
	type StartOfSourceMap,
} from "source-map"
import { assignExact, splitLines, stringToBase64 } from "./util.js"
import type { AsyncFunctionConstructor } from "./types.js"
import { FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT } from "./internals/magic.js"

export function attachFunctionSourceMap(
	...args: Parameters<typeof generateFunctionSourceMap>
): string {
	const [, script] = args
	return `${script}
//# sourceMappingURL=data:application/json;base64,${stringToBase64(
		generateFunctionSourceMap(...args).toString(),
	)}`
}

export function attachSourceMap(
	...args: Parameters<typeof generateSourceMap>
): string {
	const [script] = args
	return `${script}
//# sourceMappingURL=data:application/json;base64,${stringToBase64(
		generateSourceMap(...args).toString(),
	)}`
}

const FUNCTION_CONSTRUCTOR_OFFSETS =
	new WeakMap<AsyncFunctionConstructor | FunctionConstructor, Position>()
export function generateFunctionSourceMap(
	ctor: AsyncFunctionConstructor | FunctionConstructor,
	script: string,
	options?: Omit<NonNullable<Parameters<
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		typeof generateSourceMap>[1]>, "offset">,
): SourceMapGenerator {
	let offset = FUNCTION_CONSTRUCTOR_OFFSETS.get(ctor)
	if (!offset) {
		// eslint-disable-next-line new-cap
		const str = new ctor(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT).toString(),
			idx = str.indexOf(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT)
		if (idx === -1) {
			self.console.error(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT, str, ctor)
			offset = { column: 0, line: 1 }
		} else {
			const lines = splitLines(str.slice(0, idx))
			offset = { column: lines.at(-1)?.length ?? 0, line: lines.length }
		}
		FUNCTION_CONSTRUCTOR_OFFSETS.set(ctor, offset)
	}
	return generateSourceMap(script, { ...options, offset })
}

export function generateSourceMap(
	script: string,
	options?: {
		readonly source?: string
		readonly file?: string
		readonly deletions?: readonly Position[]
		readonly offset?: Position
	},
): SourceMapGenerator {
	const offset = options?.offset ?? { column: 0, line: 1 },
		genOpts: StartOfSourceMap = { skipValidation: true }
	assignExact(genOpts, "file", options?.file)
	const generator = new SourceMapGenerator(genOpts),
		source = options?.source ?? "",
		content = [],
		deletions = new Set((options?.deletions ?? [])
			.map(({ line, column }) => `${line}:${column}`))
	for (const [line0, str] of Object.entries(splitLines(script))) {
		const line = Number(line0)
		let columnOffset = 0
		for (const [column0, char] of Object.entries(str)) {
			const column = Number(column0)
			if (deletions.has(`${1 + line}:${column}`)) {
				--columnOffset
				continue
			}
			content.push(char)
			generator.addMapping({
				generated: { column: offset.column + column, line: offset.line + line },
				original: { column: column + columnOffset, line: 1 + line },
				source,
			})
		}
		content.push("\n")
	}
	content.pop()
	generator.setSourceContent(source, content.join(""))
	return generator
}
