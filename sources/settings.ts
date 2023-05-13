import type { AsyncOrSync, DeepReadonly, DeepWritable } from "ts-essentials"
import {
	DOUBLE_ACTION_WAIT,
	FileExtensions,
	JSON_STRINGIFY_SPACE,
	SI_PREFIX_SCALE,
} from "./magic.js"
import {
	EventEmitterLite,
	anyToError,
	asyncDebounce,
	clearProperties,
	cloneAsFrozen,
	copyOnWriteAsync,
	createChildElement,
	logError,
	promisePromise,
} from "./util.js"
import {
	addCommand,
	cleanFrontmatterCache,
	printError,
	printMalformedData,
} from "./obsidian.js"
import { isEmpty, isNil, throttle } from "lodash-es"
import { Component } from "obsidian"
import { DialogModal } from "./modals.js"
import type { Fixer } from "./fixers.js"
import type { PluginContext } from "./plugin.js"
import { SAVE_SETTINGS_WAIT } from "./internals/magic.js"
import deepEqual from "deep-equal"

export class SettingsManager<T extends SettingsManager.Type> extends Component {
	public readonly onLoaded
	#data: DeepReadonly<T>
	readonly #loader = promisePromise()
	#loaded = false
	readonly #onMutateSettings = new EventEmitterLite<readonly []>()

	readonly #write = asyncDebounce(throttle((
		resolve: (value: AsyncOrSync<void>) => void,
	) => {
		resolve(this.context.saveData(this.copy))
	}, SAVE_SETTINGS_WAIT * SI_PREFIX_SCALE))

	public constructor(
		protected readonly context: PluginContext,
		defaults: T,
		protected readonly fixer: Fixer<T>,
	) {
		super()
		this.#data = cloneAsFrozen(defaults)
		this.onLoaded = this.#loader.then(async ({ promise }) => promise)
		context.addChild(this)
	}

	public get copy(): DeepReadonly<T> {
		if (!this.#loaded) { throw new Error() }
		return this.#data
	}

	public override onload(): void {
		super.onload();
		(async (): Promise<void> => {
			try {
				const { promise, resolve } = await this.#loader
				resolve((async (): Promise<void> => {
					await this.read()
					this.#loaded = true
				})())
				await promise
				await this.write()
			} catch (error) {
				self.console.error(error)
			}
		})()
	}

	public async read(reader: () => unknown = async (): Promise<unknown> =>
		this.context.loadData()): Promise<void> {
		await this.mutate(async settings => {
			const read = await reader(),
				{ value, valid } = this.fixer(read)
			Object.assign(settings, value)
			if (!isNil(read) && !valid) {
				printMalformedData(this.context, read, value)
				settings.recovery[new Date().toISOString()] =
					JSON.stringify(read, null, JSON_STRINGIFY_SPACE)
			}
		})
	}

	public async write(): Promise<void> {
		await this.#write()
	}

	public async mutate(mutator: (
		settings: DeepWritable<T>) => unknown): Promise<void> {
		this.#data = await copyOnWriteAsync(this.#data, mutator)
		await this.#onMutateSettings.emit()
	}

	public on<V>(
		_event: "mutate-settings",
		accessor: (settings: DeepReadonly<T>) => V,
		callback: (
			cur: V,
			prev: V,
			settings: DeepReadonly<T>,
		) => unknown,
	): () => void {
		let prev = accessor(this.#data)
		return this.#onMutateSettings
			.listen(async (): Promise<void> => {
				const settings = this.#data,
					cur = accessor(settings),
					prev0 = prev
				if (prev0 !== cur) {
					prev = cur
					await callback(cur, prev0, settings)
				}
			})
	}
}
export namespace SettingsManager {
	export type Recovery = Readonly<Record<string, string>>
	export interface Type {
		readonly recovery: Recovery
	}
}

export function registerSettingsCommands(context: PluginContext): void {
	const {
		app: { workspace, metadataCache, fileManager },
		settings,
		language: { i18n },
	} = context
	addCommand(context, () => i18n.t("commands.export-settings-clipboard"), {
		callback() {
			(async (): Promise<void> => {
				try {
					await self.activeWindow.navigator.clipboard.writeText(JSON.stringify(
						context.settings,
						null,
						JSON_STRINGIFY_SPACE,
					))
				} catch (error) {
					printError(anyToError(error), () =>
						i18n.t("errors.error-exporting-settings"), context)
				}
			})()
		},
		icon: i18n.t("asset:commands.export-settings-clipboard-icon"),
		id: "export-settings.clipboard",
	})
	addCommand(context, () => i18n.t("commands.export-settings-current-file"), {
		checkCallback(checking) {
			const file = workspace.getActiveFile()
			if (file?.extension !== FileExtensions.MARKDOWN) { return false }
			if (!checking) {
				const cachedFm =
					cleanFrontmatterCache(metadataCache.getFileCache(file)?.frontmatter),
					process = (): void => {
						fileManager.processFrontMatter(file, (fm: object) => {
							if (!deepEqual(fm, cachedFm, { strict: true })) {
								throw new Error(i18n.t("errors.retry-outdated-frontmatter"))
							}
							clearProperties(fm)
							Object.assign(fm, context.settings)
						}).catch(error => {
							printError(anyToError(error), () => i18n.t(
								"errors.error-processing-frontmatter",
								{
									file,
									interpolation: { escapeValue: false },
								},
							), context)
						})
					}
				if (isEmpty(cachedFm)) {
					process()
				} else {
					new DialogModal(context, {
						confirm(close): void {
							close()
							process()
						},
						doubleConfirmTimeout: DOUBLE_ACTION_WAIT,
						draw(ui, element): void {
							ui.new(() => createChildElement(element, "div"), ele => {
								ele.textContent =
									i18n.t("dialogs.overwrite-existing-frontmatter")
							}, ele => { ele.remove() })
						},
						title(): string {
							return i18n.t("commands.export-settings-current-file")
						},
					}).open()
				}
			}
			return true
		},
		icon: i18n.t("asset:commands.export-settings-current-file-icon"),
		id: "export-settings.current-file",
	})
	addCommand(context, () => i18n.t("commands.import-settings-clipboard"), {
		callback() {
			(async (): Promise<void> => {
				try {
					await settings.read(async () => {
						const ret: unknown = JSON.parse(
							await self.activeWindow.navigator.clipboard.readText(),
						)
						return ret ?? {}
					})
					settings.write().catch(logError)
				} catch (error) {
					printError(anyToError(error), () =>
						i18n.t("errors.error-importing-settings"), context)
				}
			})()
		},
		icon: i18n.t("asset:commands.import-settings-clipboard-icon"),
		id: "import-settings.clipboard",
	})
	addCommand(context, () =>
		i18n.t("commands.import-settings-current-file"), {
		checkCallback(checking) {
			const file = workspace.getActiveFile()
			if (file?.extension !== FileExtensions.MARKDOWN) { return false }
			if (!checking) {
				(async (): Promise<void> => {
					try {
						await settings.read(() =>
							cleanFrontmatterCache(
								metadataCache.getFileCache(file)?.frontmatter,
							))
						settings.write().catch(logError)
					} catch (error) {
						printError(anyToError(error), () =>
							i18n.t("errors.error-importing-settings"), context)
					}
				})()
			}
			return true
		},
		icon: i18n.t("asset:commands.import-settings-current-file-icon"),
		id: "import-settings.current-file",
	})
}
