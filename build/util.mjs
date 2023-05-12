import PLazy from "p-lazy"
import { execFile } from "child_process"
import { promisify } from "util"
import { readFile } from "fs/promises"

const execFileP = promisify(execFile),
	OUTDIR = "./dist"

export const
	PATHS = Object.freeze({
		main: `${OUTDIR}/main.js`,
		metafile: "metafile.json",
		outDir: OUTDIR,
		"package": "package.json",
		packageLock: "package-lock.json",
		styles: `${OUTDIR}/styles.css`,
		versions: "versions.json",
	}),
	PACKAGE_ID = PLazy.from(async () =>
		JSON.parse(await readFile(PATHS.package, { encoding: "utf-8" })).name)

export async function execute(...args) {
	const process = execFileP(...args),
		{ stdout, stderr } = await process
	if (stdout) {
		console.log(stdout)
	}
	if (stderr) {
		console.error(stderr)
	}
	const { exitCode } = process.child
	if (exitCode !== 0) {
		throw new Error(String(exitCode))
	}
	return stdout
}
