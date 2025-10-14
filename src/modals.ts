import {
	type ButtonComponent,
	type Instruction,
	Modal,
	type Setting,
	type ValueComponent,
} from "obsidian"
import {
	DISABLED_TOOLTIP,
	DOMClasses,
	JSON_STRINGIFY_SPACE,
	SI_PREFIX_SCALE,
} from "./magic.js"
import type { DeepReadonly, DeepWritable } from "ts-essentials"
import {
	type StatusUI,
	UpdatableUI,
	statusUI,
	useSettings,
	useSubsettings,
} from "./obsidian.js"
import {
	activeSelf,
	bracket,
	clearProperties,
	cloneAsWritable,
	consumeEvent,
	createChildElement,
	deepFreeze,
	removeAt,
	swap,
	unexpected,
} from "./util.js"
import { constant, noop } from "lodash-es"
import {
	dropdownSelect,
	linkSetting,
	resetButton,
} from "./settings-widgets.js"
import type { Fixer } from "./fixers.js"
import type { PluginContext } from "./plugin.js"
import { simplifyType } from "./types.js"

export function getDefaultSuggestModalInstructions(
	context: PluginContext,
): readonly Instruction[] {
	const { language: { value: i18n } } = context
	return [
		{
			get command(): string {
				return i18n.t("components.suggest.instructions.navigate")
			},
			get purpose(): string {
				return i18n.t("components.suggest.instructions.navigate-purpose")
			},
		},
		{
			get command(): string {
				return i18n.t("components.suggest.instructions.use")
			},
			get purpose(): string {
				return i18n.t("components.suggest.instructions.use-purpose")
			},
		},
		{
			get command(): string {
				return i18n.t("components.suggest.instructions.dismiss")
			},
			get purpose(): string {
				return i18n.t("components.suggest.instructions.dismiss-purpose")
			},
		},
	]
}

export class ListModal<T> extends Modal {
	protected readonly modalUI = new UpdatableUI()
	protected readonly ui = new UpdatableUI()
	protected readonly data
	readonly #inputter
	readonly #callback
	readonly #editables
	readonly #title
	readonly #description
	readonly #namer
	readonly #descriptor
	readonly #presets
	readonly #presetPlaceholder
	#setupListSubUI = noop

	public constructor(
		protected readonly context: PluginContext,
		protected readonly inputter: (
			setting: Setting,
			editable: boolean,
			getter: () => T,
			setter: (setter: (
				item: T,
				index: number,
				data: T[],
			) => unknown) => unknown,
		) => void,
		protected readonly placeholder: () => T,
		data: readonly T[],
		options?: ListModal.Options<T>,
	) {
		const { app, language } = context,
			{ value: i18n } = language
		super(app)
		this.data = [...data]
		this.#inputter = inputter
		this.#callback = options?.callback ?? ((): void => { })
		this.#editables = deepFreeze([...options?.editables ?? ListModal.EDITABLES])
		this.#title = options?.title
		this.#description = options?.description
		this.#namer = options?.namer ?? ((_0, index): string =>
			i18n.t("components.list.name", {
				count: index + 1,
				interpolation: { escapeValue: false },
				ordinal: true,
			}))
		this.#descriptor = options?.descriptor ?? ((): string => "")
		this.#presets = options?.presets
		this.#presetPlaceholder = options?.presetPlaceholder ?? ((): string =>
			i18n.t("components.list.preset-placeholder"))
	}

	public static stringInputter<T>(transformer: {
		readonly forth: (value: T) => string
		readonly back: (value: string) => T
	}) {
		return (
			setting: Setting,
			editable: boolean,
			getter: () => T,
			setter: (setter: (
				item: T,
				index: number,
				data: T[],
			) => unknown) => unknown,
			input: (
				setting: Setting,
				callback: (component: ValueComponent<string> & {
					readonly onChange: (callback: (value: string) => unknown) => unknown
				}) => unknown,
			) => void = (setting0, callback): void => {
				setting0.addTextArea(callback)
			},
		): void => {
			input(setting, text => text
				.setValue(transformer.forth(getter()))
				.setDisabled(!editable)
				.onChange(value => setter((_0, index, data) => {
					data[index] = transformer.back(value)
				})))
		}
	}

	public override onOpen(): void {
		super.onOpen()
		const { context, placeholder, data, ui, titleEl, modalUI, modalEl } = this,
			{ element: listEl, remover: listElRemover } = useSettings(this.contentEl),
			{ language } = context,
			{ value: i18n, onChangeLanguage } = language,
			editables = this.#editables,
			title = this.#title,
			description = this.#description,
			presets = this.#presets,
			presetPlaceholder = this.#presetPlaceholder
		modalUI.finally(onChangeLanguage.listen(() => { modalUI.update() }))
		ui.finally(listElRemover)
			.finally(onChangeLanguage.listen(() => { ui.update() }))
		if (title) {
			modalUI.new(constant(titleEl), ele => {
				ele.textContent = title()
			}, ele => { ele.textContent = null })
		}
		if (description) {
			ui.new(() => createChildElement(listEl, "div"), ele => {
				ele.classList.add(DOMClasses.SETTING_ITEM)
				ele.textContent = description()
			}, ele => { ele.remove() })
		}
		ui.newSetting(listEl, setting => {
			if (!editables.includes("prepend")) {
				setting.settingEl.remove()
				return
			}
			if (presets) {
				setting
					.setName(i18n.t("components.list.prepend"))
					.addDropdown(dropdownSelect(
						presetPlaceholder("prepend"),
						presets,
						async value => {
							data.unshift(value)
							this.#setupListSubUI()
							await this.postMutate()
						},
					))
					.addExtraButton(resetButton(
						i18n.t("asset:components.list.prepend-icon"),
						DISABLED_TOOLTIP,
						unexpected,
						unexpected,
						{ post(component) { component.setDisabled(true) } },
					))
				return
			}
			setting
				.setName(i18n.t("components.list.prepend"))
				.addButton(button => {
					button
						.setIcon(i18n.t("asset:components.list.prepend-icon"))
						.setTooltip(i18n.t("components.list.prepend"))
						.onClick(async () => {
							data.unshift(placeholder())
							this.#setupListSubUI()
							await this.postMutate()
						})
				})
		})
			.embed(() => {
				const subUI = new UpdatableUI(),
					ele = useSubsettings(listEl)
				this.#setupListSubUI = (): void => { this.setupListSubUI(subUI, ele) }
				this.#setupListSubUI()
				return subUI
			})
			.newSetting(listEl, setting => {
				if (!editables.includes("append")) {
					setting.settingEl.remove()
					return
				}
				if (presets) {
					setting
						.setName(i18n.t("components.list.append"))
						.addDropdown(dropdownSelect(
							presetPlaceholder("append"),
							presets,
							async value => {
								data.push(value)
								this.#setupListSubUI()
								await this.postMutate()
							},
						))
						.addExtraButton(resetButton(
							i18n.t("asset:components.list.append-icon"),
							DISABLED_TOOLTIP,
							unexpected,
							unexpected,
							{ post: component => { component.setDisabled(true) } },
						))
					return
				}
				setting
					.setName(i18n.t("components.list.append"))
					.addButton(button => button
						.setIcon(i18n.t("asset:components.list.append-icon"))
						.setTooltip(i18n.t("components.list.append"))
						.onClick(async () => {
							data.push(placeholder())
							this.#setupListSubUI()
							await this.postMutate()
						}))
			})
	}

	public override onClose(): void {
		super.onClose()
		this.modalUI.destroy()
		this.ui.destroy()
	}

	protected async postMutate(): Promise<void> {
		const { data, ui, modalUI } = this,
			cb = this.#callback([...data])
		modalUI.update()
		ui.update()
		await cb
	}

	protected setupListSubUI(ui: UpdatableUI, element: HTMLElement): void {
		const { context, data } = this,
			editables = this.#editables,
			namer = this.#namer,
			descriptor = this.#descriptor,
			{ language } = context,
			{ value: i18n } = language
		ui.destroy()
		for (const [index] of data.entries()) {
			ui.newSetting(element, setting => {
				const { valid, value: item } = bracket(data, index)
				if (!valid) { throw new Error(index.toString()) }
				setting.setName(namer(item, index, data))
					.setDesc(descriptor(item, index, data))
				this.#inputter(
					setting,
					editables.includes("edit"),
					() => item,
					async setter => {
						await setter(item, index, data)
						await this.postMutate()
					},
				)
				if (editables.includes("remove")) {
					setting
						.addButton(button => button
							.setTooltip(i18n.t("components.list.remove"))
							.setIcon(i18n.t("asset:components.list.remove-icon"))
							.onClick(async () => {
								removeAt(data, index)
								this.#setupListSubUI()
								await this.postMutate()
							}))
				}
				if (editables.includes("moveUp")) {
					setting.addExtraButton(button => button
						.setTooltip(i18n.t("components.list.move-up"))
						.setIcon(i18n.t("asset:components.list.move-up-icon"))
						.onClick(async () => {
							if (index <= 0) { return }
							swap(data, index - 1, index)
							this.#setupListSubUI()
							await this.postMutate()
						}))
				}
				if (editables.includes("moveDown")) {
					setting.addExtraButton(button => button
						.setTooltip(i18n.t("components.list.move-down"))
						.setIcon(i18n.t("asset:components.list.move-down-icon"))
						.onClick(async () => {
							if (index >= data.length - 1) { return }
							swap(data, index, index + 1)
							this.#setupListSubUI()
							await this.postMutate()
						}))
				}
			})
		}
	}
}
export namespace ListModal {
	export const EDITABLES = deepFreeze([
		"edit",
		"append",
		"prepend",
		"remove",
		"moveUp",
		"moveDown",
	])
	export interface Options<T> {
		readonly callback?: (data_: T[]) => unknown
		readonly editables?: readonly typeof EDITABLES[number][]
		readonly title?: () => string
		readonly description?: () => string
		readonly namer?: (value: T, index: number, data: readonly T[]) => string
		readonly descriptor?: (
			value: T,
			index: number,
			data: readonly T[],
		) => string
		readonly presets?: readonly {
			readonly name: string
			readonly value: T
		}[]
		readonly presetPlaceholder?: (action: "append" | "prepend") => string
	}
}

export class EditDataModal<T extends object> extends Modal {
	protected readonly modalUI = new UpdatableUI()
	protected readonly ui = new UpdatableUI()
	protected readonly data
	#dataText
	readonly #callback
	readonly #elements
	readonly #title
	readonly #description

	public constructor(
		protected readonly context: PluginContext,
		protected readonly protodata: DeepReadonly<T>,
		protected readonly fixer: Fixer<T>,
		options?: EditDataModal.Options<T>,
	) {
		super(context.app)
		this.data = simplifyType<T>(cloneAsWritable(protodata))
		this.#dataText = JSON.stringify(this.data, null, JSON_STRINGIFY_SPACE)
		this.#callback = options?.callback ?? ((): void => { })
		this.#elements =
			deepFreeze([...options?.elements ?? EditDataModal.ELEMENTS])
		this.#title = options?.title
		this.#description = options?.description
	}

	public override onOpen(): void {
		super.onOpen()
		const { modalUI, ui, modalEl, contentEl, titleEl, context } = this,
			errorEl = statusUI(ui, ((): HTMLElement => {
				const ret = createChildElement(contentEl, "div", ele => {
					ele.classList.add(DOMClasses.MOD_WARNING)
				})
				ui.new(constant(ret), null, ele => { ele.remove() })
				return ret
			})()),
			{ element: listEl, remover: listElRemover } = useSettings(contentEl),
			{ language } = context,
			{ onChangeLanguage } = language,
			title = this.#title,
			desc = this.#description
		modalUI.finally(onChangeLanguage.listen(() => { modalUI.update() }))
		ui.finally(listElRemover)
			.finally(onChangeLanguage.listen(() => { ui.update() }))
			.finally(() => { this.#resetDataText() })
		if (title) {
			modalUI.new(constant(titleEl), ele => {
				ele.textContent = title()
			}, ele => { ele.textContent = null })
		}
		if (desc) {
			ui.new(() => createChildElement(listEl, "div"), ele => {
				ele.classList.add(DOMClasses.SETTING_ITEM)
				ele.textContent = desc()
			}, ele => { ele.remove() })
		}
		this.draw(ui, listEl, errorEl)
	}

	public override onClose(): void {
		super.onClose()
		this.modalUI.destroy()
		this.ui.destroy()
	}

	protected draw(
		ui: UpdatableUI,
		element: HTMLElement,
		errorEl: StatusUI,
	): void {
		const { context: { language: { value: i18n } }, fixer, protodata } = this,
			els = this.#elements
		if (els.includes("export")) {
			ui.newSetting(element, setting => {
				setting
					.setName(i18n.t("components.edit-data.export"))
					.addButton(button => {
						const { buttonEl } = button
						button
							.setIcon(i18n
								.t("asset:components.edit-data.export-to-clipboard-icon"))
							.setTooltip(i18n.t("components.edit-data.export-to-clipboard"))
							.onClick(async () => {
								try {
									await activeSelf(buttonEl).navigator.clipboard
										.writeText(this.#dataText)
								} catch (error) {
									/* @__PURE__ */ activeSelf(buttonEl).console.debug(error)
									errorEl.report(error)
								}
							})
					})
			})
		}
		if (els.includes("import")) {
			ui.newSetting(element, setting => {
				setting
					.setName(i18n.t("components.edit-data.import"))
					.addButton(button => {
						const { buttonEl } = button
						button
							.setIcon(i18n
								.t("asset:components.edit-data.import-from-clipboard-icon"))
							.setTooltip(i18n.t("components.edit-data.import-from-clipboard"))
							.onClick(async () => {
								try {
									const { value: parsed, valid } = fixer(JSON.parse(
										await activeSelf(buttonEl).navigator.clipboard.readText(),
									))
									if (!valid) {
										throw new Error(i18n.t("errors.malformed-data"))
									}
									this.replaceData(parsed)
								} catch (error) {
									/* @__PURE__ */ activeSelf(buttonEl).console.debug(error)
									errorEl.report(error)
									return
								}
								errorEl.report()
								await this.postMutate()
							})
					})
			})
		}
		if (els.includes("data")) {
			ui.newSetting(element, setting => {
				const { settingEl } = setting
				setting
					.setName(i18n.t("components.edit-data.data"))
					.addTextArea(linkSetting(
						() => this.#dataText,
						value => { this.#dataText = value },
						async value => {
							try {
								const { value: parsed, valid } = fixer(JSON.parse(value))
								if (!valid) {
									throw new Error(i18n.t("errors.malformed-data"))
								}
								this.replaceData(parsed)
							} catch (error) {
								/* @__PURE__ */ activeSelf(settingEl).console.debug(error)
								errorEl.report(error)
								return
							}
							errorEl.report()
							await this.postMutate(false)
						},
					))
					.addExtraButton(resetButton(
						i18n.t("asset:components.edit-data.data-icon"),
						i18n.t("components.edit-data.reset"),
						() => {
							this.replaceData(simplifyType<T>(cloneAsWritable(protodata)))
						},
						async () => this.postMutate(),
					))
			})
		}
	}

	protected async postMutate(reset = true): Promise<void> {
		const { data, modalUI, ui } = this,
			cb = this.#callback(simplifyType<T>(cloneAsWritable(data)))
		if (reset) { this.#resetDataText() }
		modalUI.update()
		ui.update()
		await cb
	}

	protected replaceData(data: typeof this.data): void {
		clearProperties(this.data)
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		Object.assign(this.data, data)
	}

	#resetDataText(): void {
		this.#dataText = JSON.stringify(this.data, null, JSON_STRINGIFY_SPACE)
	}
}
export namespace EditDataModal {
	export const ELEMENTS = deepFreeze([
		"export",
		"import",
		"data",
	])
	export interface Options<T> {
		readonly callback?: (data: DeepWritable<T>) => unknown
		readonly elements?: readonly typeof ELEMENTS[number][]
		readonly title?: () => string
		readonly description?: () => string
	}
}

export class DialogModal extends Modal {
	protected readonly modalUI = new UpdatableUI()
	protected readonly ui = new UpdatableUI()
	readonly #cancel
	readonly #confirm
	readonly #title
	readonly #description
	readonly #draw
	readonly #doubleConfirmTimeout

	public constructor(
		protected readonly context: PluginContext,
		options?: {
			cancel?: (close: () => void) => unknown
			confirm?: (close: () => void) => unknown
			title?: () => string
			description?: () => string
			draw?: (ui: UpdatableUI, element: HTMLElement) => void
			doubleConfirmTimeout?: number
		},
	) {
		super(context.app)
		this.#doubleConfirmTimeout = options?.doubleConfirmTimeout
		this.#cancel = options?.cancel ?? ((close): void => { close() })
		this.#confirm = options?.confirm ?? ((close): void => { close() })
		this.#title = options?.title
		this.#description = options?.description
		this.#draw = options?.draw ?? noop
	}

	public override onOpen(): void {
		super.onOpen()
		const { context, modalEl, scope, modalUI, titleEl, ui, contentEl } = this,
			{ language } = context,
			{ value: i18n, onChangeLanguage } = language,
			title = this.#title,
			description = this.#description,
			doubleConfirmTimeout = this.#doubleConfirmTimeout ?? 0
		modalUI.finally(onChangeLanguage.listen(() => { modalUI.update() }))
		ui.finally(onChangeLanguage.listen(() => { ui.update() }))
		if (title) {
			modalUI.new(constant(titleEl), ele => {
				ele.textContent = title()
			}, ele => { ele.textContent = null })
		}
		const confirmOnce = doubleConfirmTimeout <= 0
		let confirmButton: ButtonComponent | null = null,
			preconfirmed = confirmOnce
		modalUI
			.newSetting(modalEl, setting => {
				if (!confirmOnce) {
					setting.setDesc(i18n.t("components.dialog.double-confirm-hint"))
				}
				setting
					.addButton(button => {
						button
							.setIcon(i18n.t("asset:components.dialog.confirm-icon"))
							.setTooltip(i18n.t("components.dialog.confirm"))
							.onClick(async () => this.confirm(this.#close))
						if (preconfirmed) {
							button.setCta()
						} else {
							button.setWarning()
						}
						confirmButton = button
					})
					.addButton(button => button
						.setIcon(i18n.t("asset:components.dialog.cancel-icon"))
						.setTooltip(i18n.t("components.dialog.cancel"))
						.onClick(async () => this.cancel(this.#close)))
			})
			// Hooking escape does not work as it is already registered
			.new(() => scope.register([], "enter", async event => {
				if (preconfirmed) {
					await this.confirm(this.#close)
				} else {
					activeSelf(event).setTimeout(() => {
						preconfirmed = false
						confirmButton?.removeCta().setWarning()
					}, doubleConfirmTimeout * SI_PREFIX_SCALE)
					preconfirmed = true
					confirmButton?.setCta().buttonEl
						.classList.remove(DOMClasses.MOD_WARNING)
				}
				consumeEvent(event)
			}), null, ele => { scope.unregister(ele) })
		if (description) {
			ui.new(() => createChildElement(contentEl, "div"), ele => {
				ele.textContent = description()
			}, ele => { ele.remove() })
		}
		this.#draw(ui, contentEl)
	}

	public override onClose(): void {
		super.onClose()
		this.modalUI.destroy()
		this.ui.destroy()
	}

	public override close(): void {
		(async (): Promise<void> => {
			try {
				await this.cancel(this.#close)
			} catch (error) {
				activeSelf(this.containerEl).console.error(error)
			}
		})()
	}

	protected async confirm(close: () => void): Promise<void> {
		await this.#confirm(close)
	}

	protected async cancel(close: () => void): Promise<void> {
		await this.#cancel(close)
	}

	readonly #close = (): void => { super.close() }
}
