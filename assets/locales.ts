import type {
	AsyncOrSync,
	AsyncOrSyncType,
	Builtin,
	DeepReadonly,
	IsUnknown,
} from "ts-essentials"
import type {
	DistributeKeys,
	DistributeValues,
	Evaluate,
	IsExact,
} from "../sources/types.js"
import type {
	I18nFormatters,
	I18nNamespaces,
	I18nResources,
} from "../sources/i18n.js"
import {
	capitalize,
	deepFreeze,
	startCase,
	typedKeys,
	uncapitalize,
} from "../sources/util.js"
import type { Resource } from "i18next"
import type en from "./locales/en/translation.json"
import { merge } from "ts-deepmerge"

export type NormalizeLocale<T> = T extends Builtin ? T
	// eslint-disable-next-line @typescript-eslint/ban-types
	: T extends {} ? {
		[K in keyof T as K extends `${infer K0}_${string}` ? K0 : K]:
		NormalizeLocale<T[K]>
	} : IsUnknown<T> extends true ? unknown : T
export function syncLocale<Expected>() {
	return function fn<Actual>(
		locale: IsExact<NormalizeLocale<Expected>, NormalizeLocale<Actual>
		> extends false ? never : Actual,
	): Actual {
		// TypeScript does not check more than 2 layers...
		return locale
	}
}
export type AwaitResources<T extends I18nResources, Default extends keyof T> = {
	[K in keyof T[Default]]: Awaited<ReturnType<T[Default][K]>>
}

export type MergeResources<Ts extends readonly I18nResources[]> = {
	[K in DistributeKeys<Ts[number]>]:
	Evaluate<MergeNamespaces<readonly DistributeValues<Ts[number], K>[]>>
}
export type MergeNamespaces<Ts extends readonly I18nNamespaces[]> = {
	[K in DistributeKeys<Ts[number]>]: () => PromiseLike<ReturnType<
		typeof merge<AsyncOrSyncType<ReturnType<DistributeValues<Ts[number], K>>>[

		]>>>
}
export function mergeResources<const Ts extends readonly I18nResources[]>(
	...resources: Ts
): DeepReadonly<MergeResources<Ts>> {
	const ret: Record<string, Record<string, {
		(): AsyncOrSync<Resource>
		readonly data: (() => AsyncOrSync<Resource>)[]
	}>> = {}
	for (const res of resources) {
		for (const [lang, locale] of Object.entries(res)) {
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-multi-assign
			const ret0 = ret[lang] ??= {}
			for (const [ns, resource] of Object.entries(locale)) {
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				(ret0[ns] ??=
					((data: (() => AsyncOrSync<Resource>)[] = []): {
						(): AsyncOrSync<Resource>
						readonly data: (() => AsyncOrSync<Resource>)[]
					} => Object.assign(
						async () =>
							merge(...await Promise.all(data.map(datum => datum()))),
						{ data },
					))()).data.push(resource)
			}
		}
	}
	// No way we are proving that to the type system
	return deepFreeze(ret as MergeResources<Ts>)
}

export namespace LibraryLocales {
	export const
		RETURN_NULL = false,
		DEFAULT_LANGUAGE = "en",
		DEFAULT_NAMESPACE = "translation",
		FALLBACK_LANGUAGES = deepFreeze({
			"default": [DEFAULT_LANGUAGE],
			zh: ["zh-Hans", DEFAULT_LANGUAGE],
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"zh-CN": ["zh-Hans", "zh", DEFAULT_LANGUAGE],
			// eslint-disable-next-line @typescript-eslint/naming-convention
			"zh-TW": ["zh-Hant", "zh", DEFAULT_LANGUAGE],
		}),
		FORMATTERS = deepFreeze({
			capitalize: lng => (value): string => capitalize(String(value), lng),
			startCase: lng => (value): string => startCase(String(value), lng),
			uncapitalize: lng => (value): string => uncapitalize(String(value), lng),
		}) satisfies I18nFormatters
	const sync = syncLocale<typeof en>()
	// Sync with https://github.com/obsidianmd/obsidian-translations#existing-languages (e266f1f2171102e8b8c607fec7c8b494e22b25b4)
	export const RESOURCES = deepFreeze({
		af: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/af/translation.json")).default),
		},
		am: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/am/translation.json")).default),
		},
		ar: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ar/translation.json")).default),
		},
		be: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/be/translation.json")).default),
		},
		bg: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/bg/translation.json")).default),
		},
		bn: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/bn/translation.json")).default),
		},
		ca: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ca/translation.json")).default),
		},
		cs: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/cs/translation.json")).default),
		},
		da: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/da/translation.json")).default),
		},
		de: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/de/translation.json")).default),
		},
		el: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/el/translation.json")).default),
		},
		en: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/en/translation.json")).default),
			asset: async () => (await import("./locales/en/asset.json")).default,
			language: async () =>
				(await import("./locales/en/language.json")).default,
		},
		eo: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/eo/translation.json")).default),
		},
		es: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/es/translation.json")).default),
		},
		eu: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/eu/translation.json")).default),
		},
		fa: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/fa/translation.json")).default),
		},
		fi: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/fi/translation.json")).default),
		},
		fr: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/fr/translation.json")).default),
		},
		gl: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/gl/translation.json")).default),
		},
		he: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/he/translation.json")).default),
		},
		hi: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/hi/translation.json")).default),
		},
		hu: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/hu/translation.json")).default),
		},
		id: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/id/translation.json")).default),
		},
		it: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/it/translation.json")).default),
		},
		ja: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ja/translation.json")).default),
		},
		ko: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ko/translation.json")).default),
		},
		lv: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/lv/translation.json")).default),
		},
		ml: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ml/translation.json")).default),
		},
		ms: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ms/translation.json")).default),
		},
		nl: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/nl/translation.json")).default),
		},
		no: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/no/translation.json")).default),
		},
		oc: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/oc/translation.json")).default),
		},
		pl: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/pl/translation.json")).default),
		},
		pt: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/pt/translation.json")).default),
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"pt-BR": {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/pt-BR/translation.json")).default),
		},
		ro: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ro/translation.json")).default),
		},
		ru: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ru/translation.json")).default),
		},
		se: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/se/translation.json")).default),
		},
		sk: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/sk/translation.json")).default),
		},
		sq: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/sq/translation.json")).default),
		},
		sr: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/sr/translation.json")).default),
		},
		ta: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ta/translation.json")).default),
		},
		te: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/te/translation.json")).default),
		},
		th: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/th/translation.json")).default),
		},
		tr: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/tr/translation.json")).default),
		},
		uk: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/uk/translation.json")).default),
		},
		ur: {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/ur/translation.json")).default),
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"zh-Hans": {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/zh-Hans/translation.json")).default),
		},
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"zh-Hant": {
			[DEFAULT_NAMESPACE]: async () =>
				sync((await import("./locales/zh-Hant/translation.json")).default),
		},
	}) satisfies I18nResources
	export type Resources =
		AwaitResources<typeof RESOURCES, typeof DEFAULT_LANGUAGE>
	export type Namespaces = readonly ["translation", "language", "asset"]
	export const NAMESPACES = typedKeys<Namespaces>()(RESOURCES[DEFAULT_LANGUAGE])
	export type Languages = readonly [
		"af",
		"am",
		"ar",
		"be",
		"bg",
		"bn",
		"ca",
		"cs",
		"da",
		"de",
		"el",
		"en",
		"eo",
		"es",
		"eu",
		"fa",
		"fi",
		"fr",
		"gl",
		"he",
		"hi",
		"hu",
		"id",
		"it",
		"ja",
		"ko",
		"lv",
		"ml",
		"ms",
		"nl",
		"no",
		"oc",
		"pl",
		"pt",
		"pt-BR",
		"ro",
		"ru",
		"se",
		"sk",
		"sq",
		"sr",
		"ta",
		"te",
		"th",
		"tr",
		"uk",
		"ur",
		"zh-Hans",
		"zh-Hant",
	]
	export const LANGUAGES = typedKeys<keyof Awaited<ReturnType<
		typeof RESOURCES[typeof DEFAULT_LANGUAGE]["language"]
	>> extends Languages[number] ? Languages : never>()(RESOURCES)
}
