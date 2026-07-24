---
"@polyipseity/obsidian-plugin-library": patch
---

Enforce readonly-by-default rule across function signatures

- Change `Map<string, string>` parameters and return types to `ReadonlyMap<string, string>` where mutation is not required
- Change `Set<string>` parameter to `ReadonlySet<string>` where mutation is not required
- Change `T[]` parameter in `ListModal.Options.callback` to `readonly T[]`
- Change `Hotkey[]` local variable type to `readonly Hotkey[]`
