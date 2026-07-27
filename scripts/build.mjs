import cssEscape from "css.escape";
import { analyzeMetafile, context, formatMessages } from "esbuild";
import esbuildCompress from "esbuild-compress";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { copy } from "esbuild-plugin-copy";
import esbuildSvelte from "esbuild-svelte";
import { isEmpty, kebabCase } from "lodash-es";
import { spawn } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import { argv } from "node:process";
import { sveltePreprocess } from "svelte-preprocess";
import which from "which";
import { PACKAGE_ID, PATHS } from "./utils.mjs";

const ARGV_PRODUCTION = 2,
  COMMENT =
    "// repository: https://github.com/polyipseity/obsidian-plugin-library",
  DEV = argv[ARGV_PRODUCTION] === "dev",
  PACKAGE_ID0 = await PACKAGE_ID;

async function tsc() {
  const bun = await which("bun", {});
  await new Promise((resolve, reject) => {
    spawn(
      bun,
      [
        "x",
        "--package",
        "@typescript/native",
        "--",
        "tsc",
        "--emitDeclarationOnly",
        ...(DEV ? ["--watch"] : []),
      ],
      {
        stdio: "inherit",
      },
    )
      .once("error", reject)
      .once("exit", (code, signal) => {
        if (code === 0) {
          resolve();
          return;
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- Intentional to minimize strings.
        reject(code ?? signal);
      });
  });
}

async function esbuild() {
  const build = await context({
    alias: {},
    banner: { js: COMMENT },
    bundle: true,
    color: true,
    drop: [],
    entryPoints: ["src/index.ts", "src/inject/index.ts", "src/style.css"],
    external: ["node:*"],
    footer: { js: COMMENT },
    format: "esm",
    jsx: "transform",
    legalComments: "inline",
    loader: {},
    logLevel: "info",
    logLimit: 0,
    metafile: true,
    minify: false,
    outdir: PATHS.outDir,
    platform: "browser",
    plugins: [
      nodeExternalsPlugin({}),
      copy({
        assets: [
          {
            from: ["src/**/*.d.svelte.ts", "src/**/*.svelte"],
            to: ["src/"],
          },
        ],
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- JSDoc typings could be not parsed for some reason.
      esbuildCompress({
        compressors: [
          {
            filter: /\.json$/,
            loader: "json",
          },
        ],
      }),
      esbuildSvelte({
        cache: true,
        compilerOptions: {
          css: "injected",
          cssHash(/** @type {{ readonly name: string }} */ { name }) {
            return cssEscape(
              `${PACKAGE_ID0}-svelte-${kebabCase(name)}`,
            ).replace(/\\./gu, "_");
          },
          dev: DEV,
        },
        include: /\.svelte(?:\.js|\.ts)?$/,
        moduleCompilerOptions: {
          dev: DEV,
          generate: "client",
        },
        preprocess: [
          sveltePreprocess({
            aliases: [],
            globalStyle: {
              sourceMap: DEV,
            },
            preserve: [],
            replace: [],
            sourceMap: DEV,
            typescript: {
              compilerOptions: {
                // svelte-preprocess uses transpileModule (no type checking),
                // so the full tsconfig is not needed. We only need enough
                // options for transpilation.
                //
                // svelte-preprocess internally forces `module: ESNext` and
                // checks whether moduleResolution is Bundler; if not, it
                // falls back to the deprecated Node10. Setting "bundler"
                // here (with tsconfigFile: false to prevent the project
                // tsconfig from overriding it to nodenext) makes
                // svelte-preprocess keep Bundler, avoiding the TypeScript 6
                // Node10 deprecation error.
                moduleResolution: "bundler",
                verbatimModuleSyntax: true,
              },
              reportDiagnostics: true,
              // Do not load the project tsconfig. transpileModule does not
              // type-check and does not read package.json for node16/nodenext
              // semantics, so the project tsconfig settings are not needed
              // here. More importantly, if the tsconfig were loaded it would
              // override moduleResolution back to "nodenext", causing
              // svelte-preprocess to fall through to the deprecated Node10.
              tsconfigFile: false,
            },
          }),
        ],
      }),
    ],
    sourcemap: DEV && "linked",
    sourcesContent: true,
    target: "ES2022",
    treeShaking: true,
  });

  if (DEV) {
    await build.watch({});
    return;
  }

  try {
    // Await https://github.com/evanw/esbuild/issues/2886
    const { errors, warnings, metafile } = await build.rebuild();
    await Promise.all([
      (async () => {
        console.log(
          await analyzeMetafile(metafile, { color: true, verbose: true }),
        );
        if (!isEmpty(warnings)) {
          console.warn(
            (
              await formatMessages(warnings, { color: true, kind: "warning" })
            ).join("\n"),
          );
        }
        if (!isEmpty(errors)) {
          console.error(
            (await formatMessages(errors, { color: true, kind: "error" })).join(
              "\n",
            ),
          );
        }
      })(),
      writeFile(PATHS.metafile, JSON.stringify(metafile, null, "  "), {
        encoding: "utf-8",
      }),
    ]);
  } finally {
    await build.dispose();
  }
}

// remove previous build output before starting a new build
try {
  const results = await Promise.allSettled([
    rm(PATHS.outDir, { force: true, recursive: true }),
  ]);
  const rejectedReasons = results
    .filter((r) => r.status === "rejected")
    .map((r) => /** @type {unknown} */ (r.reason));
  if (rejectedReasons.length) {
    // throw all errors together so callers can inspect each failure
    throw new AggregateError(
      rejectedReasons,
      "Failed to remove previous build output (one or more errors)",
    );
  }
} catch (err) {
  console.warn(
    "Failed to remove previous build output, proceeding anyway:",
    err,
  );
}
await Promise.all([tsc(), esbuild()]);
