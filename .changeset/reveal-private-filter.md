---
"@polyipseity/obsidian-plugin-library": major
---

Make the keys of `Private<T, P>` optional, and improve the thoroughness of the
private-revealing transformation. These may break existing usages.

Add `revealPrivateFilter` and `revealPrivateAsyncFilter`, which filter types
out of the private-revealing transformation.
