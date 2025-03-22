import { Functions, remove } from "./util.js"
import type { Plugins, Workspace } from "obsidian"
import { constant, noop } from "lodash-es"
import type { AsyncOrSync } from "ts-essentials"
import type { PluginContext } from "./plugin.js"
import { around } from "monkey-around"
import { correctType } from "./types.js"
import { revealPrivateAsync } from "./private.js"

export async function patchPlugin<const I extends string>(
	context: PluginContext,
	id: I,
	patcher: (plugin: Plugins.Map<I>) => AsyncOrSync<() => void>,
): Promise<() => void> {
	return revealPrivateAsync(context, [context.app], async app2 => {
		const unpatch = new Functions({ async: false, settled: true })
		try {
			const { plugins } = app2
			unpatch.push(around(plugins, {
				loadPlugin(next) {
					return function fn<const I2 extends string>(
						this: typeof plugins,
						...args: Parameters<typeof next<I2>>
					): ReturnType<typeof next<I2>> {
						return (async (): Promise<typeof ret> => {
							const ret = await next.bind(this)(...args)
							try {
								const [id2] = args
								if (ret && id2 as unknown === id) {
									type Proto = typeof next<typeof id>
									// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
									const ret2 = ret as Awaited<ReturnType<Proto>> & typeof ret,
										unpatcher = await patcher(ret2)
									unpatch.push(unpatcher)
									ret2.register(() => {
										try { unpatcher() } finally { remove(unpatch, unpatcher) }
									})
								}
							} catch (error) {
								self.console.error(error)
							}
							return ret
						})()
					}
				},
			}))
			const plugin = plugins.getPlugin(id)
			if (plugin) {
				const unpatcher = await patcher(plugin)
				unpatch.push(unpatcher)
				plugin.register(() => {
					try { unpatcher() } finally { remove(unpatch, unpatcher) }
				})
			}
			return () => { unpatch.call() }
		} catch (error) {
			unpatch.call()
			throw error
		}
	}, constant(noop))
}

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
