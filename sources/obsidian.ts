import {
	AbstractTextComponent,
	type BaseComponent,
	ButtonComponent,
	type Command,
	type DataAdapter,
	DropdownComponent,
	type FrontMatterCache,
	Notice,
	Plugin,
	type PluginManifest,
	Setting,
	ValueComponent,
	type View,
	type ViewStateResult,
} from "obsidian"
import { type AnyObject, launderUnchecked } from "./types.js"
import {
	DOMClasses,
	NOTICE_NO_TIMEOUT,
	SI_PREFIX_SCALE,
} from "./magic.js"
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem"
import {
	Functions,
	clear,
	cloneAsWritable,
	createChildElement,
	deepFreeze,
	inSet,
	multireplace,
	onVisible,
} from "./util.js"
import { cloneDeep, constant, isUndefined } from "lodash-es"
import { revealPrivate, revealPrivateAsync } from "./private.js"
import { InternalDOMClasses } from "./internals/magic.js"
import { Platform } from "./platform.js"
import type { PluginContext } from "./plugin.js"
import { around } from "monkey-around"
import { saveAs } from "file-saver"

export interface StatusUI {
	readonly report: (status?: unknown) => void
}

export class UpdatableUI {
	readonly #updaters = new Functions({ async: false })
	readonly #finalizers = new Functions({ async: false })

	public new<V>(
		create: () => V,
		configure?: ((value: V) => void) | null,
		destroy?: ((value: V) => void) | null,
	): this {
		const value = create()
		try {
			if (configure) {
				const updater = (): void => { configure(value) }
				updater()
				this.#updaters.push(updater)
			}
			if (destroy) {
				this.#finalizers.push(() => { destroy(value) })
			}
			return this
		} catch (error) {
			if (destroy) { destroy(value) }
			throw error
		}
	}

	public newSetting(
		element: HTMLElement,
		configure: (setting: Setting) => void,
	): this {
		let recording = true
		return this.new(() => {
			const setting = new Setting(element),
				patch = <C extends BaseComponent>(proto: (
					cb: (component: C) => unknown,
				) => Setting): (cb: (component: C) => unknown) => Setting => {
					const components: (readonly [C, unknown])[] = []
					let index = 0
					return function fn(
						this: Setting,
						cb: (component: C) => unknown,
					): Setting {
						if (recording) {
							return proto.call(this, component => {
								cb(component)
								try {
									components.push([
										component,
										component instanceof ValueComponent
											? component.getValue()
											: null,
									])
								} catch (error) {
									self.console.error(error)
								}
							})
						}
						const [comp, def] = components[index] ?? []
						index = (index + 1) % components.length
						if (!comp) { throw new Error(index.toString()) }
						try {
							if ("onChange" in comp && typeof comp.onChange === "function") {
								try {
									comp.onChange((): void => { })
								} catch (error) {
									self.console.error(error)
								}
							}
							comp.setDisabled(false)
							if (comp instanceof AbstractTextComponent) {
								comp.setPlaceholder("")
							}
							if (comp instanceof ButtonComponent) {
								comp.removeCta()
								comp.buttonEl.classList.remove(DOMClasses.MOD_WARNING)
							}
							if (comp instanceof DropdownComponent) {
								comp.selectEl.replaceChildren()
							}
							if (comp instanceof ValueComponent) {
								comp.setValue(def)
							}
						} catch (error) {
							self.console.error(error)
						}
						cb(comp)
						return this
					}
				}
			around(setting, {
				addButton: patch,
				addColorPicker: patch,
				addDropdown: patch,
				addExtraButton: patch,
				addMomentFormat: patch,
				addSearch: patch,
				addSlider: patch,
				addText: patch,
				addTextArea: patch,
				addToggle: patch,
			} satisfies { [key in (keyof Setting) & `add${string}`]: unknown })
			return setting
		}, setting => {
			configure(setting
				.setDesc("")
				.setDisabled(false)
				.setName("")
				.setTooltip(""))
			recording = false
		}, setting => { setting.settingEl.remove() })
	}

	public finally(finalizer: () => void): this {
		this.#finalizers.push(finalizer)
		return this
	}

	public embed<U extends this>(
		create: () => U,
		configure?: ((ele: U) => void) | null,
		destroy?: ((ele: U) => void) | null,
	): this {
		let update = false
		return this.new(create, ele => {
			if (update) { ele.update() }
			update = true
			if (configure) { configure(ele) }
		}, ele => {
			ele.destroy()
			if (destroy) { destroy(ele) }
		})
	}

	public update(): void {
		this.#updaters.call()
	}

	public destroy(): void {
		this.#finalizers.transform(self => self.splice(0)).call()
		clear(this.#updaters)
	}
}

export function statusUI(ui: UpdatableUI, element: HTMLElement): StatusUI {
	ui.new(constant(element), () => { }, () => { element.textContent = null })
	return deepFreeze({
		report(status?: unknown) {
			element.textContent = isUndefined(status) ? null : String(status)
		},
	})
}

export class UnnamespacedID<V extends string> {
	public constructor(public readonly id: V) { }

	public namespaced(context: Plugin | PluginManifest): string {
		return `${(context instanceof Plugin
			? context.manifest
			: context).id}:${this.id}`
	}
}

type AddCommandPredefinedOptions = {
	readonly [K in "name"]: Command[K]
}
export function addCommand(
	context: PluginContext,
	name: () => string,
	command: Readonly<Omit<Command, keyof AddCommandPredefinedOptions>>,
): Command {
	let namer = name
	return context.addCommand(Object.assign(
		{
			get name(): string { return namer() },
			set name(format) {
				namer = commandNamer(
					name,
					() => context.displayName(),
					context.displayName(true),
					format,
				)
			},
		} satisfies AddCommandPredefinedOptions,
		command,
	))
}

export function addRibbonIcon(
	context: PluginContext,
	id: string,
	icon: string,
	title: () => string,
	callback: (event: MouseEvent) => unknown,
): void {
	const { app: { workspace: { leftRibbon } }, language } = context
	revealPrivate(
		context,
		[leftRibbon],
		leftRibbon0 => {
			const ribbon = (): readonly [ele: HTMLElement, title: string] => {
				const title0 = title()
				return Object.freeze([
					leftRibbon0.addRibbonItemButton(
						new UnnamespacedID(id).namespaced(context),
						icon,
						title0,
						callback,
					), title0,
				])
			}
			let [ele, title0] = ribbon()
			context.register(() => {
				leftRibbon0.removeRibbonAction(title0)
				ele.remove()
			})
			context.register(language.onChangeLanguage.listen(() => {
				ele.replaceWith(([ele, title0] = ribbon())[0])
			}))
		},
		_0 => { context.addRibbonIcon(icon, id, callback) },
	)
}

export async function awaitCSS(
	element: HTMLElement,
): Promise<void> {
	const { classList, style, style: { display } } = element
	style.display = "none"
	return new Promise((resolve, reject) => {
		const obsr = onVisible(element, () => {
			try {
				style.display = display
				classList.remove(awaitCSS.CLASS)
				resolve()
			} catch (error) {
				reject(error)
			} finally { obsr.disconnect() }
		})
		classList.add(awaitCSS.CLASS)
	})
}
export namespace awaitCSS {
	export const CLASS = InternalDOMClasses.AWAIT_CSS
}

export function cleanFrontmatterCache(
	cache?: FrontMatterCache,
): Readonly<Record<string, unknown>> {
	if (!cache) { return deepFreeze({}) }
	const ret = cloneAsWritable<Partial<typeof cache>>(cache)
	delete ret.position
	return deepFreeze(ret)
}

export function commandNamer(
	cmdNamer: () => string,
	pluginNamer: () => string,
	defaultPluginName: string,
	format: string,
): () => string {
	const cmd = cmdNamer()
	return () => multireplace(format, {
		[cmd]: cmdNamer(),
		[defaultPluginName]: pluginNamer(),
	})
}

export function printMalformedData(
	context: PluginContext,
	actual: unknown,
	expected?: unknown,
): void {
	const { language: { i18n } } = context,
		tryClone = (thing: unknown): unknown => {
			try {
				return cloneDeep(thing)
			} catch (error) {
				self.console.warn(error)
				return thing
			}
		}
	self.console.error(
		i18n.t("errors.malformed-data"),
		tryClone(actual),
		tryClone(expected),
	)
}

export function newCollabrativeState(
	context: Plugin | PluginManifest,
	states: ReadonlyMap<UnnamespacedID<string>, unknown>,
): unknown {
	const entries = (function* fn(): Generator<readonly [string, unknown], void> {
		for (const [key, value] of states.entries()) {
			yield [key.namespaced(context), value]
		}
	}())
	return Object.freeze(Object.fromEntries(entries))
}

export function notice(
	message: () => DocumentFragment | string,
	timeout: number = NOTICE_NO_TIMEOUT,
	context?: PluginContext,
): Notice {
	const timeoutMs = SI_PREFIX_SCALE * Math.max(timeout, 0),
		ret = new Notice(message(), timeoutMs)
	if (!context) { return ret }
	const unreg = context.language.onChangeLanguage
		.listen(() => ret.setMessage(message()))
	if (timeoutMs > 0) {
		self.setTimeout(unreg, timeoutMs)
	}
	return ret
}

export function notice2(
	message: () => DocumentFragment | string,
	timeout = NOTICE_NO_TIMEOUT,
	context?: PluginContext,
): void {
	if (timeout >= 0) {
		notice(message, timeout, context)
	}
}

export function printError(
	error: Error,
	message = (): string => "",
	context?: PluginContext,
): void {
	self.console.error(`${message()}\n`, error)
	notice2(
		() => `${message()}\n${error.name}: ${error.message}`,
		context?.settings.copy.errorNoticeTimeout,
		context,
	)
}

export function readStateCollabratively(
	implType: string,
	state: unknown,
): unknown {
	return launderUnchecked<AnyObject>(state)[implType]
}

export function recordViewStateHistory(
	context: PluginContext,
	result: ViewStateResult,
): void {
	revealPrivate(context, [result], result0 => {
		result0.history = true
	}, _0 => { })
}

export async function saveFileAs(
	context: PluginContext,
	adapter: DataAdapter,
	data: File,
): Promise<void> {
	if (inSet(Platform.MOBILE, Platform.CURRENT)) {
		await revealPrivateAsync(context, [adapter], async ({ fs }) => {
			await fs.open<typeof Platform.CURRENT>(
				(await Filesystem.writeFile({
					data: await data.text(),
					directory: Directory.Cache,
					encoding: Encoding.UTF8,
					path: data.name,
				})).uri,
			)
		}, async _0 => { })
		return
	}
	saveAs(data)
}

export function updateView(context: PluginContext, view: View): void {
	revealPrivate(context, [
		view.leaf,
		context.app.workspace,
	], (leaf, workspace) => {
		leaf.updateHeader()
		workspace.requestUpdateLayout()
	}, _0 => { })
}

export function useSettings(element: HTMLElement): {
	readonly element: HTMLElement
	readonly remover: () => void
} {
	const container = createChildElement(element, "div", ele => {
		ele.classList.add(DOMClasses.VERTICAL_TAB_CONTENT_CONTAINER)
	})
	return Object.freeze({
		element: createChildElement(container, "div", ele => {
			ele.classList.add(DOMClasses.VERTICAL_TAB_CONTENT)
		}),
		remover() { container.remove() },
	})
}

export function useSubsettings(element: HTMLElement): HTMLElement {
	const ret = createChildElement(element, "div")
	if (element.firstChild) { createChildElement(ret, "div") }
	return ret
}

export function writeStateCollabratively(
	state: unknown,
	implType: string,
	implState: unknown,
): unknown {
	return Object.assign(launderUnchecked(state), { [implType]: implState })
}
