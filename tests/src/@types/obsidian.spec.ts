import { describe, expectTypeOf, it } from "vitest";
import type {
  $App,
  $BakedHotkey,
  $Commands,
  $CommunityPluginsSettingTab,
  $DataAdapter,
  $FileSystem,
  $HotkeyManager,
  $Keymap,
  $Plugins,
  $UnknownSettingTab,
  $ViewStateResult,
  $Workspace,
  $WorkspaceLeaf,
  $WorkspaceRibbon,
} from "../../src/@types/obsidian.js";

describe("$ brand interface export contract", () => {
  it("exports all $ brand interfaces from @types/obsidian", () => {
    expectTypeOf<$App>().not.toBeAny();
    expectTypeOf<$BakedHotkey>().not.toBeAny();
    expectTypeOf<$Commands>().not.toBeAny();
    expectTypeOf<$CommunityPluginsSettingTab>().not.toBeAny();
    expectTypeOf<$DataAdapter>().not.toBeAny();
    expectTypeOf<$FileSystem>().not.toBeAny();
    expectTypeOf<$HotkeyManager>().not.toBeAny();
    expectTypeOf<$Keymap>().not.toBeAny();
    expectTypeOf<$Plugins>().not.toBeAny();
    expectTypeOf<$UnknownSettingTab>().not.toBeAny();
    expectTypeOf<$ViewStateResult>().not.toBeAny();
    expectTypeOf<$Workspace>().not.toBeAny();
    expectTypeOf<$WorkspaceLeaf>().not.toBeAny();
    expectTypeOf<$WorkspaceRibbon>().not.toBeAny();
  });
});
