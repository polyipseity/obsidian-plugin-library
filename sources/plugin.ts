import type { SettingsManager, StorageSettingsManager } from "./settings.js"
import type { LanguageManager } from "./i18n.js"
import type { Plugin } from "obsidian"

export interface PluginContext<
	S extends PluginContext.Settings = PluginContext.Settings,
	LS extends PluginContext.LocalSettings = PluginContext.LocalSettings,
> extends Plugin {
	readonly language: LanguageManager
	readonly localSettings: StorageSettingsManager<LS>
	readonly settings: SettingsManager<S>
	readonly displayName: (unlocalized?: boolean) => string
}
export namespace PluginContext {
	export type LocalSettings = StorageSettingsManager.Type
	export interface Settings extends SettingsManager.Type {
		readonly errorNoticeTimeout: number
		readonly noticeTimeout: number

		readonly language: string
	}
}
