import type { HotkeyManager, KeymapEventListener } from "obsidian"
import { constant, noop } from "lodash-es"
import type { PluginContext } from "./plugin.js"
import { around } from "monkey-around"
import { cloneAsWritable } from "./util.js"
import { revealPrivate } from "./private.js"

export function newHotkeyListener(
	context: PluginContext,
	ids?: Set<string>,
): KeymapEventListener {
	const { app, app: { keymap } } = context
	return revealPrivate(context, [app], app0 => {
		const { hotkeyManager } = app0
		let bakedHotkeys = cloneAsWritable(hotkeyManager.bakedHotkeys),
			bakedIds = cloneAsWritable(hotkeyManager.bakedIds)

		context.register(around(hotkeyManager, {
			bake(next) {
				return function fn(
					this: HotkeyManager,
					...args: Parameters<typeof next>
				): ReturnType<typeof next> {
					revealPrivate(context, [this], this0 => {
						if (this0.baked) { return }
						try {
							const defaultKeysOld = this0.defaultKeys
							try {
								this0.defaultKeys = Object.fromEntries(
									Object.entries(defaultKeysOld)
										.filter(([id]) => !ids || ids.has(id)),
								)

								const customKeysOld = cloneAsWritable(this0.customKeys)
								try {
									for (const id of Object.keys(customKeysOld)) {
										if (!ids || ids.has(id)) { continue }
										this0.removeHotkeys(id)
									}

									this0.baked = false
									next.apply(this0, args)
									bakedHotkeys = cloneAsWritable(this0.bakedHotkeys)
									bakedIds = cloneAsWritable(this0.bakedIds)
								} finally {
									for (const [id, hotkey] of Object.entries(customKeysOld)) {
										if (!ids || ids.has(id)) { continue }
										this0.setHotkeys(id, hotkey)
									}
								}
							} finally {
								this0.defaultKeys = defaultKeysOld
							}
						} finally {
							this0.baked = false
						}
					}, noop)
					next.apply(this, args)
				}
			},
		}))

		return (evt, ctx) => {
			revealPrivate(context, [app, keymap], (app1, keymap0) => {
				app1.hotkeyManager.bake()
				let idx = 0
				for (const hotkey of bakedHotkeys) {
					if (keymap0.constructor.isMatch(hotkey, ctx)) {
						const id = bakedIds[idx],
							command = app1.commands.findCommand(id)
						if (command && (!evt.repeat || (command.repeatable ?? false))
							&& app1.commands.executeCommand(command)) { return false }
					}
					++idx
				}
				return true
			}, noop)
		}
	}, constant(noop))
}
