---
"@polyipseity/obsidian-plugin-library": major
---

Rework the private-revealing transformation around an exact whitelist. This may break existing usages.

- `RevealPrivate<T, Filter>` (and the runtime helpers) now expands **only** types that exactly match a `Filter` member (`IsEqualExact`), traversing everything else by dropping the brand. Previously every object type was eagerly expanded.
- Add `revealPrivateFilter<Filter>()` and `revealPrivateAsyncFilter<Filter>()` to fix the filter at the call site.
- Deprecate `RevealPrivate`, `revealPrivate`, `revealPrivateAsync`, and the `RevealPrivateExempt` marker. Use the filtered variants instead; builtin exceptions are handled by the gate directly.
- The `RevealPrivateExempt` marker is now a required property (`readonly __reveal_private_exempt: true`), fixing the weak-type bug where index-signature objects matched the marker.
- Declare `BakedHotkey`'s public members in the library's Obsidian augmentation (`$BakedHotkey`) and drop the `RevealPrivate<BakedHotkey>` workaround in `$Keymap.isMatch`.
