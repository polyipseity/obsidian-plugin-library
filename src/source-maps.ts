import {
  type Mapping,
  type Position,
  SourceMapGenerator,
  type StartOfSourceMap,
} from "source-map";
import {
  TraceMap,
  originalPositionFor,
  sourceContentFor,
} from "@jridgewell/trace-mapping";
import { assignExact, splitLines } from "./util.js";
import { fromObject, fromSource } from "convert-source-map";
import type { AsyncFunctionConstructor } from "./types.js";
import { FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT } from "./internals/magic.js";
import { isEmpty } from "lodash-es";

export function attachFunctionSourceMap(
  ...args: Parameters<typeof generateFunctionSourceMap>
): string {
  const [, script] = args;
  const comment = fromObject(
    generateFunctionSourceMap(...args).toJSON(),
  ).toComment();
  return `${script}\n${comment}`;
}

export function attachSourceMap(
  ...args: Parameters<typeof generateSourceMap>
): string {
  const [script] = args;
  const comment = fromObject(generateSourceMap(...args).toJSON()).toComment();
  return `${script}\n${comment}`;
}

const FUNCTION_CONSTRUCTOR_OFFSETS = new WeakMap<
  AsyncFunctionConstructor | FunctionConstructor,
  Position
>();
export function generateFunctionSourceMap(
  ctor: AsyncFunctionConstructor | FunctionConstructor,
  script: string,
  options?: Omit<
    NonNullable<Parameters<typeof generateSourceMap>[1]>,
    "offset"
  >,
): SourceMapGenerator {
  let offset = FUNCTION_CONSTRUCTOR_OFFSETS.get(ctor);
  if (!offset) {
    const str = new ctor(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT).toString(),
      idx = str.indexOf(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT);
    if (idx === -1) {
      self.console.error(FUNCTION_CONSTRUCTOR_OFFSET_SCRIPT, str, ctor);
      offset = { column: 0, line: 1 };
    } else {
      const lines = splitLines(str.slice(0, idx));
      offset = { column: lines.at(-1)?.length ?? 0, line: lines.length };
    }
    FUNCTION_CONSTRUCTOR_OFFSETS.set(ctor, offset);
  }
  return generateSourceMap(script, { ...options, offset });
}

export function generateSourceMap(
  script: string,
  options?: {
    readonly source?: string;
    readonly file?: string;
    readonly sourceRoot?: string;
    readonly deletions?: readonly Position[];
    readonly offset?: Position;
  },
): SourceMapGenerator {
  const offset = options?.offset ?? { column: 0, line: 1 },
    genOpts: StartOfSourceMap = { skipValidation: true };
  assignExact(genOpts, "file", options?.file);
  assignExact(genOpts, "sourceRoot", options?.sourceRoot);
  let subSourceMap = null;
  try {
    const subSourceMap0 = fromSource(script);
    if (subSourceMap0) {
      subSourceMap = new TraceMap(subSourceMap0.toJSON());
    }
  } catch (error) {
    /* @__PURE__ */ self.console.debug(error);
  }
  const generator = new SourceMapGenerator(genOpts),
    source = options?.source ?? (isEmpty(subSourceMap?.sources) ? "" : "."),
    content = [],
    deletions = new Set(
      (options?.deletions ?? []).map(({ line, column }) => `${line}:${column}`),
    );
  for (const [line0, str] of Object.entries(splitLines(script))) {
    const line = Number(line0);
    let columnOffset = 0;
    for (const [column0, char] of Object.entries(str)) {
      const column = Number(column0);
      if (deletions.has(`${1 + line}:${column}`)) {
        --columnOffset;
        continue;
      }
      content.push(char);
      const mapping: Mapping = {
        generated: {
          column: offset.column + column,
          line: offset.line + line,
        },
        original: { column: column + columnOffset, line: 1 + line },
        source,
      };
      if (subSourceMap) {
        const subMapping = originalPositionFor(subSourceMap, mapping.original);
        if (subMapping.source !== null) {
          mapping.original = subMapping;
          mapping.source = subMapping.source;
          assignExact(mapping, "name", subMapping.name ?? void 0);
        }
      }
      generator.addMapping(mapping);
    }
    content.push("\n");
  }
  content.pop();
  if (subSourceMap) {
    for (const src of subSourceMap.sources) {
      if (src === null) {
        continue;
      }
      const ct = sourceContentFor(subSourceMap, src);
      if (ct === null) {
        continue;
      }
      generator.setSourceContent(src, ct);
    }
  }
  generator.setSourceContent(source, content.join(""));
  return generator;
}
