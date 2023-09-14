import type { AsyncOrSync, DeepReadonly, DeepWritable } from "ts-essentials"
import {
	DOUBLE_ACTION_WAIT,
	FileExtensions,
	JSON_STRINGIFY_SPACE,
	SI_PREFIX_SCALE,
} from "./magic.js"
import {
	EventEmitterLite,
	activeSelf,
	anyToError,
	asyncDebounce,
	clearProperties,
	copyOnWriteAsync,
	deepFreeze,
	lazyInit,
} from "./util.js"
import { type Fixed, type Fixer, markFixed } from "./fixers.js"
import {
	ResourceComponent,
	addCommand,
	cleanFrontmatterCache,
	printError,
	printMalformedData,
} from "./obsidian.js"
import { constant, isEmpty, isNil, throttle } from "lodash-es"
import { launderUnchecked, simplifyType } from "./types.js"
import { DialogModal } from "./modals.js"
import type { PluginContext } from "./plugin.js"
import { SAVE_SETTINGS_WAIT } from "./internals/magic.js"
import deepEqual from "deep-equal"
import { revealPrivate } from "./private.js"

export abstract class AbstractSettingsManager<T extends AbstractSettingsManager
	.Type>
	extends ResourceComponent<DeepReadonly<T>> {
	readonly #onMutate = new EventEmitterLite<readonly []>()

	public constructor(
		protected readonly fixer: Fixer<T>,
	) {
		super()
	}

	public async mutate(mutator: (
		settings: DeepWritable<T>) => unknown): Promise<void> {
		this.value = await copyOnWriteAsync(this.value, mutator)
		await this.#onMutate.emit()
	}

	public async read(
		reader: () => unknown = (): ReturnType<typeof this.read0> =>
			this.read0(),
	): Promise<void> {
		await this.mutate(async settings => {
			Object.assign(settings, await this.#read(reader))
		})
	}

	public onMutate<V>(
		accessor: (settings: DeepReadonly<T>) => V,
		callback: (
			cur: V,
			prev: V,
			settings: DeepReadonly<T>,
		) => unknown,
	): () => void {
		let prev = accessor(this.value)
		return this.#onMutate
			.listen(async (): Promise<void> => {
				const settings = this.value,
					cur = accessor(settings),
					prev0 = prev
				if (prev0 !== cur) {
					prev = cur
					await callback(cur, prev0, settings)
				}
			})
	}

	public override onload(): void {
		super.onload();
		(async (): Promise<void> => {
			try {
				await this.onLoaded
				await this.write()
			} catch (error) {
				self.console.error(error)
			}
		})()
	}

	protected override async load0(): Promise<DeepReadonly<T>> {
		return simplifyType(deepFreeze(await this.#read()))
	}

	async #read(reader: () => unknown = (): ReturnType<typeof this.read0> =>
		this.read0()): Promise<DeepWritable<T>> {
		const { fixer } = this,
			read = await reader(),
			{ value, valid } = fixer(read)
		if (!isNil(read) && !valid) { await this.onInvalidData(read, value) }
		return value
	}

	public abstract onInvalidData(
		actual: unknown,
		fixed: DeepWritable<T>,
	): unknown
	public abstract read0(): unknown
	public abstract write(): unknown
}
export namespace AbstractSettingsManager {
	export interface Type {
		readonly [Type]?: never
	}
	// eslint-disable-next-line @typescript-eslint/naming-convention
	declare const Type: unique symbol
	export function fix(self0: unknown): Fixed<Type> {
		return markFixed(self0, {})
	}
}

export class LocalSettingsManager<T extends LocalSettingsManager.Type>
	extends AbstractSettingsManager<T> {
	readonly #key = lazyInit(async () => {
		const { context, context: { app, manifest: { id } } } = this
		await context.language.onLoaded
		return revealPrivate(
			context,
			[app],
			app2 => `${app2.appId}.${id}.${LocalSettingsManager.KEY}`,
			constant(null),
		)
	})

	public constructor(
		protected readonly context: PluginContext,
		fixer: Fixer<T>,
	) {
		super(fixer)
	}

	protected get key(): PromiseLike<string | null> {
		return this.#key()
	}

	public override async onInvalidData(
		actual: unknown,
		fixed: DeepWritable<T>,
	): Promise<void> {
		const { context } = this
		await context.language.onLoaded
		printMalformedData(context, actual, fixed)
		fixed.recovery[`${LocalSettingsManager
			.RECOVERY_KEY_PREFIX}${new Date().toISOString()}`] =
			JSON.stringify(actual, null, JSON_STRINGIFY_SPACE)
	}

	public override async read0(): Promise<unknown> {
		const key = await this.key
		if (key === null) { return { [LocalSettingsManager.FAILED]: true } }
		return self.localStorage.getItem(key)
	}

	public override async write(): Promise<void> {
		const key = await this.key
		if (key === null) { return }
		self.localStorage.setItem(key, JSON.stringify(this.value))
	}
}
export namespace LocalSettingsManager {
	export const FAILED = Symbol("LocalSettingsManager.FAILED"),
		KEY = "settings",
		RECOVERY_KEY_PREFIX = "localStorage."
	export type Recovery = Readonly<Record<string, string>>
	export interface Type extends AbstractSettingsManager.Type {
		readonly [FAILED]?: true
		readonly recovery: Recovery
	}
	export function fix(self0: unknown): Fixed<Type> {
		const unc = launderUnchecked<Type>(self0)
		return markFixed(self0, {
			...AbstractSettingsManager.fix(self0).value,
			recovery: Object.fromEntries(Object
				.entries(launderUnchecked(unc.recovery))
				.map(([key, value]) => [key, String(value)])),
		})
	}
	export function hasFailed(value: Type): boolean { return FAILED in value }
}

export class SettingsManager<T extends SettingsManager.Type>
	extends AbstractSettingsManager<T> {
	readonly #write = asyncDebounce(throttle((
		resolve: (value: AsyncOrSync<void>) => void,
	) => {
		resolve(this.context.saveData(this.value))
	}, SAVE_SETTINGS_WAIT * SI_PREFIX_SCALE))

	public constructor(
		protected readonly context: PluginContext,
		fixer: Fixer<T>,
	) {
		super(fixer)
	}

	public override async onInvalidData(
		actual: unknown,
		fixed: DeepWritable<T>,
	): Promise<void> {
		const { context } = this
		await context.language.onLoaded
		printMalformedData(context, actual, fixed)
		fixed.recovery[new Date().toISOString()] =
			JSON.stringify(actual, null, JSON_STRINGIFY_SPACE)
	}

	public override async read0(): Promise<unknown> {
		return this.context.loadData()
	}

	public override async write(): Promise<void> {
		await this.#write()
	}
}
export namespace SettingsManager {
	export type Recovery = Readonly<Record<string, string>>
	export interface Type extends AbstractSettingsManager.Type {
		readonly recovery: Recovery
	}
	export function fix(self0: unknown): Fixed<Type> {
		const unc = launderUnchecked<Type>(self0)
		return markFixed(self0, {
			...AbstractSettingsManager.fix(self0).value,
			recovery: Object.fromEntries(Object
				.entries(launderUnchecked(unc.recovery))
				.map(([key, value]) => [key, String(value)])),
		})
	}
}

export function registerSettingsCommands(context: PluginContext): void {
	const {
		app, app: { fileManager, metadataCache, workspace },
		language: { value: i18n },
		settings,
	} = context
	addCommand(context, () => i18n.t("commands.export-settings-clipboard"), {
		callback() {
			const { lastEvent } = app;
			(async (): Promise<void> => {
				try {
					await activeSelf(lastEvent).navigator.clipboard
						.writeText(JSON.stringify(
							settings.value,
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
						description(): string {
							return i18n.t("dialogs.overwrite-existing-frontmatter")
						},
						doubleConfirmTimeout: DOUBLE_ACTION_WAIT,
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
			const { lastEvent } = app;
			(async (): Promise<void> => {
				try {
					await settings.read(async () => {
						const ret: unknown = JSON.parse(
							await activeSelf(lastEvent).navigator.clipboard.readText(),
						)
						return ret ?? {}
					})
					settings.write().catch(error => {
						activeSelf(lastEvent).console.error(error)
					})
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
				const { lastEvent } = app;
				(async (): Promise<void> => {
					try {
						await settings.read(() =>
							cleanFrontmatterCache(
								metadataCache.getFileCache(file)?.frontmatter,
							))
						settings.write().catch(error => {
							activeSelf(lastEvent).console.error(error)
						})
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
