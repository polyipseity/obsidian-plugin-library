declare module "obsidian" {
  interface App extends Private<$App, PrivateKey> {}
  interface BakedHotkey extends Private<$BakedHotkey, PrivateKey> {}
  interface Commands extends Private<$Commands, PrivateKey> {}
  interface CommunityPluginsSettingTab extends Private<
    $CommunityPluginsSettingTab,
    PrivateKey
  > {}
  interface DataAdapter extends Private<$DataAdapter, PrivateKey> {}
  interface FileSystem extends Private<$FileSystem, PrivateKey> {}
  interface HotkeyManager extends Private<$HotkeyManager, PrivateKey> {}
  interface Keymap extends Private<$Keymap, PrivateKey> {}
  interface Plugins extends Private<$Plugins, PrivateKey> {}
  namespace Plugins {
    type Map<I extends string> = I extends keyof Mapping ? Mapping[I] : Plugin;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface extension point
    interface Mapping {}
  }
  interface Scope {
    register(
      modifiers: readonly Modifier[] | null,
      key: string | null,
      func: KeymapEventListener,
    ): KeymapEventHandler;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- type parameter used for declaration augmentation
  interface SuggestModal<T> {
    setInstructions(instructions: readonly Instruction[]): void;
  }
  interface UnknownSettingTab extends Private<$UnknownSettingTab, PrivateKey> {}
  interface ViewStateResult extends Private<$ViewStateResult, PrivateKey> {}
  interface Workspace extends Private<$Workspace, PrivateKey> {}
  interface WorkspaceLeaf extends Private<$WorkspaceLeaf, PrivateKey> {}
  interface WorkspaceRibbon extends Private<$WorkspaceRibbon, PrivateKey> {}
}
import type {
  BakedHotkey,
  Command,
  Commands,
  CommunityPluginsSettingTab,
  FileSystem,
  Hotkey,
  HotkeyManager,
  Instruction,
  Keymap,
  KeymapContext,
  KeymapEventHandler,
  KeymapEventListener,
  Modifier,
  PluginManifest,
  Plugins,
  SettingTab,
  UnknownSettingTab,
  UserEvent,
} from "obsidian";
import type { Private } from "../private.js";

// @ts-expect-error 6196 -- TypeScript bug failing to recognize that they are used.
type _TS_6196 =
  Instruction | KeymapEventHandler | KeymapEventListener | Modifier;

declare const PRIVATE_KEY: unique symbol;
type PrivateKey = typeof PRIVATE_KEY;
declare module "../private.js" {
  interface PrivateKeys {
    readonly [PRIVATE_KEY]: never;
  }
}

export interface $App {
  readonly appId: string;
  readonly commands: Commands;
  readonly hotkeyManager: HotkeyManager;
  readonly plugins: Plugins;
  readonly setting: {
    readonly settingTabs: readonly (
      CommunityPluginsSettingTab | UnknownSettingTab
    )[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- interface extension point
export interface $BakedHotkey {}

export interface $Commands {
  readonly executeCommand: (command: Command, event?: UserEvent) => boolean;
  readonly findCommand: (id?: string) => Command | undefined;
}

export interface $CommunityPluginsSettingTab extends SettingTab {
  readonly id: "community-plugins";
  readonly installedPlugins?:
    | {
        readonly groupEl?: HTMLElement | undefined;
        readonly listEl?: HTMLElement | undefined;
      }
    | undefined;
  /**
   * @deprecated Outdated private API.
   */
  readonly renderInstalledPlugin?:
    ((manifest: PluginManifest, element: HTMLElement) => void) | undefined;
}

export interface $DataAdapter {
  readonly fs: FileSystem;
}

export interface $FileSystem {
  readonly open?: <Length extends number>(
    path: Length extends 1 ? string : never,
  ) => Length extends 1 ? PromiseLike<void> : never;
}

export interface $HotkeyManager {
  readonly bake: () => void;
  baked: boolean;
  bakedHotkeys: BakedHotkey[];
  bakedIds: string[];
  readonly customKeys: Record<string, Hotkey[]>;
  defaultKeys: Record<string, Hotkey[]>;
  readonly removeHotkeys: (id: string) => void;
  readonly setHotkeys: (id: string, hotkey: readonly Hotkey[]) => void;
}

export interface $Keymap {
  readonly constructor: typeof Keymap & {
    readonly isMatch: (key: BakedHotkey, ctx: KeymapContext) => boolean;
  };
}

export interface $Plugins {
  readonly getPlugin: <const I extends string>(id: I) => Plugins.Map<I> | null;
  readonly loadPlugin: <const I extends string>(
    id: I,
  ) => PromiseLike<Plugins.Map<I> | null>;
}

export interface $UnknownSettingTab extends SettingTab {
  readonly id: unique symbol;
}

export interface $ViewStateResult {
  history: boolean;
}

export interface $Workspace {
  readonly requestUpdateLayout: () => void;
}

export interface $WorkspaceLeaf {
  readonly updateHeader: () => void;
}

export interface $WorkspaceRibbon {
  readonly addRibbonItemButton: (
    id: string,
    icon: string,
    title: string,
    callback: (event: MouseEvent) => unknown,
  ) => HTMLElement;
  readonly removeRibbonAction: (title: string) => void;
}
