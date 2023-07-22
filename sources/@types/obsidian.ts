/* eslint-disable @typescript-eslint/no-empty-interface */
declare module "obsidian" {
	interface App extends Private<$App, PrivateKey> { }
	interface DataAdapter extends Private<$DataAdapter, PrivateKey> { }
	interface Scope {
		// eslint-disable-next-line @typescript-eslint/method-signature-style
		register(
			modifiers: readonly Modifier[],
			key: string | null,
			func: KeymapEventListener,
		): KeymapEventHandler
	}
	interface ViewStateResult extends Private<$ViewStateResult, PrivateKey> { }
	interface Workspace extends Private<$Workspace, PrivateKey> { }
	interface WorkspaceLeaf extends Private<$WorkspaceLeaf, PrivateKey> { }
	interface WorkspaceRibbon extends Private<$WorkspaceRibbon, PrivateKey> { }
}
import type { PluginManifest, SettingTab } from "obsidian"
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
		readonly settingTabs: readonly (SettingTab & ({
			readonly id: "community-plugins"
			readonly renderInstalledPlugin: (
				manifest: PluginManifest,
				element: HTMLElement
			) => void
		} | { readonly id: unique symbol }))[]
	}
}

interface $DataAdapter {
	readonly fs: {
		readonly open: <T extends Platform.Current>(
			path: T extends Platform.Mobile ? string : never,
		) => T extends Platform.Mobile ? PromiseLike<void> : never
	}
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
