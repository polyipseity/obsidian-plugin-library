import { Component, moment } from "obsidian"
import { EventEmitterLite, bracket, promisePromise } from "./util.js"
import i18next, {
	type FlatNamespace,
	type InitOptions,
	type ParseKeys,
	type ResourceKey,
	type TypeOptions,
	createInstance,
	type i18n,
} from "i18next"
import type { AsyncOrSync } from "ts-essentials"
import type { PluginContext } from "./plugin.js"
import resourcesToBackend from "i18next-resources-to-backend"

export type I18nFormatters = Readonly<Record<string, (
	lng?: string,
	options?: unknown,
) => (value: unknown) => string>>
export type I18nNamespaces =
	Readonly<Record<string, () => AsyncOrSync<Exclude<ResourceKey, string>>>>
export type I18nResources = Readonly<Record<string, I18nNamespaces>>
export type TranslationKey =
	ParseKeys<readonly [TypeOptions["defaultNS"],
		...readonly Exclude<FlatNamespace, TypeOptions["defaultNS"]>[]]>

export async function createI18n(
	resources: I18nResources,
	formatters: I18nFormatters = {},
	options?: Readonly<Omit<InitOptions, "ns">>,
): Promise<i18n> {
	const missingTranslationKey = "errors.missing-translation"
	let missingInterpolationHandlerReentrant = false
	const ret = createInstance({
		cleanCode: true,
		initImmediate: true,
		missingInterpolationHandler(text, value: RegExpExecArray) {
			if (missingInterpolationHandlerReentrant) {
				self.console.warn(value, text)
			} else {
				missingInterpolationHandlerReentrant = true
				try {
					self.console.warn(ret.t("errors.missing-interpolation", {
						interpolation: { escapeValue: false },
						name: value[1],
						text,
						value: value[0],
					}))
				} finally {
					missingInterpolationHandlerReentrant = false
				}
			}
			return value[0]
		},
		nonExplicitSupportedLngs: true,
		ns: [...new Set(Object.values(resources).flatMap(res => Object.keys(res)))],
		parseMissingKeyHandler(key, defaultValue) {
			if (key === missingTranslationKey) {
				self.console.warn(key, defaultValue)
			} else {
				self.console.warn(ret.t(missingTranslationKey, {
					interpolation: { escapeValue: false },
					key,
					value: defaultValue ?? key,
				}))
			}
			return defaultValue ?? key
		},
		returnNull: false,
		...options,
	}).use(resourcesToBackend(async (
		language: string,
		namespace: string,
	) => {
		const { valid: langValid, value: langValue } = bracket(resources, language)
		if (langValid) {
			const { valid, value } = bracket(langValue, namespace)
			if (valid) { return value() }
		}
		return null
	}))
	await ret.init()
	const { services } = ret,
		{ formatter } = services
	for (const [key, value] of Object.entries(formatters)) {
		formatter?.addCached(key, value)
	}
	return ret
}

export class LanguageManager extends Component {
	public readonly onChangeLanguage = new EventEmitterLite<readonly [string]>()
	public readonly onLoaded
	readonly #loader0
	readonly #loader = promisePromise()
	#loaded = false
	#i18n = i18next as unknown as i18n

	public constructor(
		protected readonly context: PluginContext,
		loader: () => AsyncOrSync<i18n>,
		protected readonly autoChangeLanguage = true,
	) {
		super()
		this.#loader0 = loader
		this.onLoaded = this.#loader.then(async ({ promise }) => promise)
		context.addChild(this)
	}

	public get i18n(): i18n {
		if (!this.#loaded) { throw new Error() }
		return this.#i18n
	}

	public get language(): string {
		return LanguageManager
			.interpretLanguage(this.context.settings.copy.language)
	}

	protected static interpretLanguage(language: string): string {
		return language || moment.locale() || language
	}

	public async changeLanguage(language: string): Promise<void> {
		const lng = LanguageManager.interpretLanguage(language)
		await this.i18n.changeLanguage(lng)
		await this.onChangeLanguage.emit(lng)
	}

	public override onload(): void {
		super.onload()
		const {
			context,
			context: { settings, settings: { onLoaded } },
		} = this;
		(async (): Promise<void> => {
			try {
				const { promise, resolve } = await this.#loader
				resolve((async (): Promise<void> => {
					await onLoaded
					this.#i18n = await this.#loader0()
					this.#loaded = true
					if (this.autoChangeLanguage) {
						context.register(settings.on(
							"mutate-settings",
							settings0 => settings0.language,
							async cur => this.changeLanguage(cur),
						))
					}
					await this.changeLanguage(this.language)
				})())
				await promise
			} catch (error) {
				self.console.error(error)
			}
		})()
	}
}
