import { noop } from "es-toolkit/function";
import { around } from "monkey-around";
import type {
  App,
  BakedHotkey,
  Commands,
  Hotkey,
  HotkeyManager,
  Keymap,
  KeymapContext,
  KeymapEventListener,
} from "obsidian";
import type { PluginContext } from "./plugin.js";
import { revealPrivateFilter } from "./private.js";
import { cloneAsWritable } from "./utils.js";

export function newHotkeyListener(
  context: PluginContext,
  ids?: ReadonlySet<string>,
): KeymapEventListener {
  const {
    app,
    app: { keymap },
  } = context;
  return revealPrivateFilter<[App, HotkeyManager]>()(
    context,
    [app],
    (app0) => {
      const { hotkeyManager } = app0;
      let bakedHotkeys = cloneAsWritable(hotkeyManager.bakedHotkeys),
        bakedIds = cloneAsWritable(hotkeyManager.bakedIds);

      type ThisType = typeof hotkeyManager;
      context.register(
        around(hotkeyManager, {
          bake(next) {
            return function fn(
              this: ThisType,
              ...args: Parameters<typeof next>
            ): ReturnType<typeof next> {
              if (this.baked) {
                return;
              }
              try {
                const defaultKeysOld = this.defaultKeys;
                try {
                  this.defaultKeys = Object.fromEntries(
                    Object.entries(defaultKeysOld).filter(
                      ([id]) => !ids || ids.has(id),
                    ),
                  );

                  const customKeysOld: Record<string, readonly Hotkey[]> =
                    cloneAsWritable(this.customKeys);
                  try {
                    for (const id of Object.keys(customKeysOld)) {
                      if (!ids || ids.has(id)) {
                        continue;
                      }
                      this.removeHotkeys(id);
                    }

                    this.baked = false;
                    next.apply(this, args);
                    bakedHotkeys = cloneAsWritable(this.bakedHotkeys);
                    bakedIds = cloneAsWritable(this.bakedIds);
                  } finally {
                    for (const [id, hotkey] of Object.entries(customKeysOld)) {
                      if (!ids || ids.has(id)) {
                        continue;
                      }
                      this.setHotkeys(id, hotkey);
                    }
                  }
                } finally {
                  this.defaultKeys = defaultKeysOld;
                }
              } finally {
                this.baked = false;
              }
              next.apply(this, args);
            };
          },
        }),
      );

      return (evt: KeyboardEvent, ctx: KeymapContext) => {
        revealPrivateFilter<
          [App, HotkeyManager, Commands, Keymap, BakedHotkey]
        >()(
          context,
          [app, keymap],
          (app1, keymap0) => {
            app1.hotkeyManager.bake();
            let idx = 0;
            for (const hotkey of bakedHotkeys) {
              if (keymap0.constructor.isMatch(hotkey, ctx)) {
                const id = bakedIds[idx],
                  command = app1.commands.findCommand(id);
                if (
                  command &&
                  (!evt.repeat || (command.repeatable ?? false)) &&
                  app1.commands.executeCommand(command)
                ) {
                  return false;
                }
              }
              ++idx;
            }
            return true;
          },
          noop,
        );
      };
    },
    () => noop,
  );
}
