---
"@polyipseity/obsidian-plugin-library": major
---

Rework the private-revealing transformation around an exact whitelist. This may break existing usages.

- `Filter` is now a **readonly tuple** (`readonly unknown[]`); `RevealPrivate<T, Filter>` (and the runtime helpers) expands **only** types that exactly match a `Filter` member (`AreNonDistributiveEqual`), traversing everything else by dropping the brand. Wrap each whitelist member in tuple brackets, e.g. `revealPrivateFilter<[App, Keymap]>()`; a nested union stays as one tuple element.
- Add `revealPrivateFilter<Filter>()` and `revealPrivateAsyncFilter<Filter>()` to fix the filter at the call site; deprecate `RevealPrivate`, `revealPrivate`, `revealPrivateAsync` (use the filtered variants; builtin exceptions are handled by the gate directly).
- The `RevealPrivateExempt` marker is now a required property (`readonly __reveal_private_exempt: true`), fixing the weak-type bug where index-signature objects matched the marker. Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate matches it directly with no special-case union.
- `$BakedHotkey` is intentionally an **empty** interface; `BakedHotkey`'s public members live on the augmented `BakedHotkey` interface, and `$Keymap.isMatch` keeps its `(key: BakedHotkey, …)` signature. The reveal strips the brand and exposes no extra members.
