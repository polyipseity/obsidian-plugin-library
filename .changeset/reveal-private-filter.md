---
"@polyipseity/obsidian-plugin-library": major
---

Rework the private-revealing transformation around two orthogonal lists and a configurable depth. This may break existing usages.

- `RevealPrivate<T, RevealWhitelist, RecursionBlacklist, Depth>` now takes a **reveal whitelist** (`readonly unknown[]` of `$X` brand payloads) and a **recursion blacklist** (`readonly unknown[]` of whole types), plus a `Depth` number generic (default `8`). The reveal whitelist decides which branded types to expand; the recursion blacklist stops recursion into listed types (returned as-is, and wins over the whitelist). `Depth` bounds recursion on cyclic types.
- A branded type is revealed only when its brand payload exactly matches a whitelist element (`AreNonDistributiveEqual`); intermediate types on an access path are auto-traversed, so you list only the private types you want revealed (e.g. `RevealPrivate<App, [$CommunityPluginsSettingTab | $UnknownSettingTab]>`). Non-branded objects are returned unchanged, keeping the result assignable.
- Add `revealPrivateFilter<RevealWhitelist, RecursionBlacklist, Depth>()` and `revealPrivateAsyncFilter<…>()` to fix the lists at the call site; deprecate `RevealPrivate`, `revealPrivate`, `revealPrivateAsync` (use the filtered variants; builtin exceptions are handled by the gate directly).
- The `RevealPrivateExempt` marker is now a required property (`readonly __reveal_private_exempt: true`), fixing the weak-type bug where index-signature objects matched the marker. Builtins (`String`, `Number`, `Boolean`, `BigInt`, `Symbol`, `Date`, `RegExp`) extend the marker in `src/@types/lib.es5.ts`, so the gate matches it directly with no special-case union.
- `$BakedHotkey` is intentionally an **empty** interface; `BakedHotkey`'s public members live on the augmented `BakedHotkey` interface, and `$Keymap.isMatch` keeps its `(key: BakedHotkey, …)` signature. The reveal strips the brand and exposes no extra members.
