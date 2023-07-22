import { Functions } from "./util.js"
import type { Workspace } from "obsidian"
import { correctType } from "./types.js"

export function patchWindows(
	workspace: Workspace,
	patcher: (
		self0: Window & typeof globalThis,
	) => (self0: Window & typeof globalThis) => void,
): () => void {
	const ret = new Functions({ async: false, settled: true })
	try {
		const oner = workspace.on("window-open", window => {
			const win0 = correctType(window.win),
				unpatch = patcher(win0)
			try {
				const offer = workspace.on("window-close", window0 => {
					if (window0 !== window) { return }
					try { unpatch(win0) } finally { workspace.offref(offer) }
				})
			} catch (error) {
				unpatch(win0)
				throw error
			}
		})
		ret.push(() => { workspace.offref(oner) })
		const unpatch = patcher(self)
		ret.push(() => { unpatch(self) })
		return () => { ret.call() }
	} catch (error) {
		ret.call()
		throw error
	}
}
