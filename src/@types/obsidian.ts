/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module "obsidian" {
	interface App extends Private<$App, PrivateKey> { }
	interface BakedHotkey extends Private<$BakedHotkey, PrivateKey> { }
	interface Commands extends Private<$Commands, PrivateKey> { }
	interface CommunityPluginsSettingTab
		extends Private<$CommunityPluginsSettingTab, PrivateKey> { }
	interface DataAdapter extends Private<$DataAdapter, PrivateKey> { }
	interface FileSystem extends Private<$FileSystem, PrivateKey> { }
	interface HotkeyManager extends Private<$HotkeyManager, PrivateKey> { }
	interface Keymap extends Private<$Keymap, PrivateKey> { }
	interface Plugins extends Private<$Plugins, PrivateKey> { }
	namespace Plugins {
		type Map<I extends string> = I extends keyof Mapping ? Mapping[I] : Plugin
		interface Mapping { }
	}
	interface Scope {
		// eslint-disable-next-line @typescript-eslint/method-signature-style
		register(
			modifiers: readonly Modifier[] | null,
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
	BakedHotkey,
	Command,
	Commands,
	CommunityPluginsSettingTab,
	FileSystem,
	Hotkey,
	HotkeyManager,
	Keymap,
	KeymapContext,
	PluginManifest,
	Plugins,
	SettingTab,
	UnknownSettingTab,
	UserEvent,
} from "obsidian"
import type { Private, RevealPrivate } from "../private.js"

declare const PRIVATE_KEY: unique symbol
type PrivateKey = typeof PRIVATE_KEY
declare module "../private.js" {
	interface PrivateKeys {
		readonly [PRIVATE_KEY]: never
	}
}

interface $App {
	readonly appId: string
	readonly commands: Commands
	readonly hotkeyManager: HotkeyManager
	readonly plugins: Plugins
	readonly setting: {
		readonly settingTabs:
		readonly (CommunityPluginsSettingTab | UnknownSettingTab)[]
	}
}

interface $BakedHotkey { }

interface $Commands {
	readonly executeCommand: (command: Command, event?: UserEvent) => boolean
	readonly findCommand: (id?: string) => Command | undefined
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
	readonly open?: <Length extends number>(
		path: Length extends 1 ? string : never,
	) => Length extends 1 ? PromiseLike<void> : never
}

interface $HotkeyManager {
	readonly bake: () => void
	baked: boolean
	bakedHotkeys: BakedHotkey[]
	bakedIds: string[]
	readonly customKeys: Record<string, Hotkey[]>
	defaultKeys: Record<string, Hotkey[]>
	readonly removeHotkeys: (id: string) => void
	readonly setHotkeys: (id: string, hotkey: readonly Hotkey[]) => void
}

interface $Keymap {
	readonly constructor: typeof Keymap & {
		readonly isMatch: (
			key: RevealPrivate<BakedHotkey>,
			ctx: KeymapContext,
		) => boolean
	}
}

interface $Plugins {
	readonly getPlugin: <const I extends string>(
		id: I,
	) => Plugins.Map<I> | null
	readonly loadPlugin: <const I extends string>(
		id: I,
	) => PromiseLike<Plugins.Map<I> | null>
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
