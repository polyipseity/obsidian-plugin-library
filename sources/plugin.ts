import type { LanguageManager } from "./i18n.js"
import type { Plugin } from "obsidian"
import type { SettingsManager } from "./settings.js"

export interface PluginContext<S extends PluginContext.Settings = PluginContext
	.Settings> extends Plugin {
	readonly language: LanguageManager
	readonly settings: SettingsManager<S>
	readonly displayName: (unlocalized?: boolean) => string
}
export namespace PluginContext {
	export interface Settings extends SettingsManager.Type {
		readonly errorNoticeTimeout: number
		readonly noticeTimeout: number

		readonly language: string
	}
}
