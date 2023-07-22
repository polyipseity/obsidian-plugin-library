/* eslint-disable @typescript-eslint/no-empty-interface */
declare module "obsidian" {
	interface App extends Private<$App, PrivateKey> { }
	interface CommunityPluginsSettingTab
		extends Private<$CommunityPluginsSettingTab, PrivateKey> { }
	interface DataAdapter extends Private<$DataAdapter, PrivateKey> { }
	interface FileSystem extends Private<$FileSystem, PrivateKey> { }
	interface Scope {
		// eslint-disable-next-line @typescript-eslint/method-signature-style
		register(
			modifiers: readonly Modifier[],
			key: string | null,
			func: KeymapEventListener,
		): KeymapEventHandler
	}
	interface UnknownSettingTab
		extends Private<$UnknownSettingTab, PrivateKey> { }
	interface ViewStateResult extends Private<$ViewStateResult, PrivateKey> { }
	interface Workspace extends Private<$Workspace, PrivateKey> { }
	interface WorkspaceLeaf extends Private<$WorkspaceLeaf, PrivateKey> { }
	interface WorkspaceRibbon extends Private<$WorkspaceRibbon, PrivateKey> { }
}
import type {
	CommunityPluginsSettingTab,
	FileSystem,
	PluginManifest,
	SettingTab,
	UnknownSettingTab,
} from "obsidian"
import type { Deopaque } from "../types.js"
import type { Platform } from "../platform.js"
import type { Private } from "../private.js"

declare const PRIVATE_KEY: unique symbol
type PrivateKey = typeof PRIVATE_KEY
declare module "../private.js" {
	interface PrivateKeys {
		readonly [PRIVATE_KEY]: never
	}
}

interface $App {
	readonly setting: {
		readonly settingTabs:
		readonly (CommunityPluginsSettingTab | UnknownSettingTab)[]
	}
}

interface $CommunityPluginsSettingTab extends SettingTab {
	readonly id: "community-plugins"
	readonly renderInstalledPlugin: (
		manifest: PluginManifest,
		element: HTMLElement
	) => void
}

interface $DataAdapter {
	readonly fs: FileSystem
}

interface $FileSystem {
	readonly open: <T extends Platform.Current>(
		path: Deopaque<T> extends Platform.Mobile ? string : never,
	) => Deopaque<T> extends Platform.Mobile ? PromiseLike<void> : never
}

interface $UnknownSettingTab extends SettingTab {
	readonly id: unique symbol
}

interface $ViewStateResult {
	history: boolean
}

interface $Workspace {
	readonly requestUpdateLayout: () => void
}

interface $WorkspaceLeaf {
	readonly updateHeader: () => void
}

interface $WorkspaceRibbon {
	readonly addRibbonItemButton: (
		id: string,
		icon: string,
		title: string,
		callback: (event: MouseEvent) => unknown,
	) => HTMLElement
	readonly removeRibbonAction: (title: string) => void
}
