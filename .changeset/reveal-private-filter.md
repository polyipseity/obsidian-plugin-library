---
"@polyipseity/obsidian-plugin-library": major
---

Rework the private-revealing transformation around two orthogonal lists and a configurable depth. This may break existing usages.

- `RevealPrivate<T, RevealWhitelist, RecursionBlacklist, Depth>` now takes a **reveal whitelist** (`readonly unknown[]` of `$X` brand payloads) and a **recursion blacklist** (`readonly unknown[]` of whole types), plus a `Depth` number generic (default `8`).
- The recursion blacklist and reveal whitelist are orthogonal. The blacklist only stops descent into a type's members; a type listed in both is still revealed (its private `$X` shape merged) but its members are not descended. Previously the blacklist suppressed the reveal as well.
- A branded type is revealed only when its brand payload exactly matches a whitelist element (`AreNonDistributiveEqual`); intermediate types on an access path are auto-traversed, so you list only the private types you want revealed (e.g. `RevealPrivate<App, [$CommunityPluginsSettingTab | $UnknownSettingTab]>`).
- Add `revealPrivateFilter<RevealWhitelist, RecursionBlacklist, Depth>()` and `revealPrivateAsyncFilter<…>()` to fix the lists at the call site; deprecate `RevealPrivate`, `revealPrivate`, `revealPrivateAsync`.
- `RevealPrivateExempt` is now a required property (`readonly __reveal_private_exempt: true`), fixing the weak-type bug where index-signature objects matched the marker.
